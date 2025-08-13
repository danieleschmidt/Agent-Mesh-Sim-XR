import { EventEmitter } from 'eventemitter3'
import { XRManager } from './XRManager'
import { AgentMeshConnector } from './AgentMeshConnector'
import { SimpleSwarmVisualizer as SwarmVisualizer } from '../visualization/SimpleSwarmVisualizer'
import { TimeController } from '../debugging/TimeController'
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor'
import { SecurityManager } from '../security/SecurityManager'
import { logger } from '../utils/Logger'
import { errorHandler, ErrorSeverity } from '../utils/ErrorHandler'
import { Validator } from '../utils/Validator'
import type { 
  AgentMeshXRConfig, 
  XRSessionConfig, 
  Agent, 
  TimeControlConfig 
} from '../types'

export class AgentMeshXR extends EventEmitter {
  private xrManager: XRManager
  private connector: AgentMeshConnector
  private swarmVisualizer: SwarmVisualizer
  private timeController?: TimeController
  private performanceMonitor: PerformanceMonitor
  private securityManager: SecurityManager
  private config: AgentMeshXRConfig
  private agents: Map<string, Agent> = new Map()
  private isRunning = false
  private sessionId: string

  constructor(config: AgentMeshXRConfig) {
    super()
    
    try {
      // Validate configuration
      if (!config || typeof config !== 'object') {
        throw new Error('Invalid configuration provided')
      }

      this.config = config
      this.sessionId = this.generateSessionId()

      // Initialize security manager
      this.securityManager = SecurityManager.getInstance({
        maxAgentsPerUser: config.maxAgents,
        requireHTTPS: true
      })

      // Initialize performance monitor
      this.performanceMonitor = new PerformanceMonitor({
        minFPS: 30,
        maxRenderTime: 33,
        maxMemoryUsage: 500,
        maxCPUUsage: 80
      }, {
        targetFPS: 60,
        maxAgents: config.maxAgents,
        maxTriangles: 100000,
        maxDrawCalls: 100
      })

      this.xrManager = new XRManager({
        vrSupported: config.vrSupport,
        arSupported: config.arSupport
      })
      
      this.connector = new AgentMeshConnector(config.networkConfig)
      this.swarmVisualizer = new SwarmVisualizer(this.xrManager.getScene(), {
        agentModel: 'geometric',
        colorScheme: 'byState',
        trailLength: 50,
        clusterDetection: false,
        lodEnabled: false
      })
      
      this.setupEventListeners()
      this.setupErrorRecovery()

      logger.info('AgentMeshXR', 'AgentMeshXR initialized successfully', { 
        sessionId: this.sessionId,
        config: this.config 
      })

    } catch (error) {
      const errorId = errorHandler.handleError(
        error as Error,
        ErrorSeverity.CRITICAL,
        { module: 'AgentMeshXR', function: 'constructor', timestamp: Date.now() }
      )
      throw new Error(`Failed to initialize AgentMeshXR: ${errorId}`)
    }
  }

  async connect(endpoint: string): Promise<void> {
    try {
      // Validate endpoint
      Validator.validateWebSocketURL(endpoint)
      
      // Security checks
      if (!this.securityManager.validateHTTPS(endpoint)) {
        throw new Error('Insecure connection rejected')
      }

      // Rate limiting
      if (!this.securityManager.checkRateLimit(this.sessionId)) {
        throw new Error('Rate limit exceeded')
      }

      await this.connector.connect(endpoint)
      
      this.securityManager.auditAction('connect', 'websocket', 'success', {
        additionalData: { endpoint }
      })

      this.emit('connected')
      logger.info('AgentMeshXR', 'Connected to agent mesh', { endpoint })

    } catch (error) {
      const errorId = errorHandler.handleError(
        error as Error,
        ErrorSeverity.HIGH,
        { 
          module: 'AgentMeshXR', 
          function: 'connect', 
          sessionId: this.sessionId,
          timestamp: Date.now(),
          additionalData: { endpoint }
        },
        { retry: true, reportToUser: true }
      )

      this.securityManager.auditAction('connect', 'websocket', 'failure', {
        additionalData: { endpoint, errorId }
      })

      this.emit('error', error)
      throw error
    }
  }

  async startXR(config: XRSessionConfig): Promise<void> {
    try {
      await this.xrManager.startSession(config)
      this.isRunning = true
      this.startRenderLoop()
      this.emit('xrStarted')
    } catch (error) {
      this.emit('error', error)
      throw error
    }
  }

  async stopXR(): Promise<void> {
    this.isRunning = false
    await this.xrManager.endSession()
    this.emit('xrStopped')
  }

  enableTimeControl(config: TimeControlConfig): void {
    this.timeController = new TimeController(config)
    this.timeController.on('rewind', (timestamp) => {
      this.rewindToTimestamp(timestamp)
    })
  }

  addAgent(agent: Agent): void {
    try {
      // Validate and sanitize agent data
      Validator.validateAgent(agent)
      const sanitizedAgent = Validator.sanitizeAgentData(agent)

      // Check agent limits
      if (this.agents.size >= this.config.maxAgents) {
        throw new Error(`Maximum agent limit reached: ${this.config.maxAgents}`)
      }

      // Security check for suspicious activity
      if (this.securityManager.detectSuspiciousActivity(this.sessionId, 'add_agent')) {
        throw new Error('Suspicious activity detected')
      }

      this.agents.set(sanitizedAgent.id, sanitizedAgent)
      this.swarmVisualizer.addAgent(sanitizedAgent)
      
      // Update performance metrics
      this.performanceMonitor.updateAgentCount(this.agents.size)

      this.securityManager.auditAction('add_agent', 'agent', 'success', {
        additionalData: { agentId: sanitizedAgent.id, agentType: sanitizedAgent.type }
      })

      this.emit('agentAdded', sanitizedAgent)
      logger.debug('AgentMeshXR', 'Agent added', { agentId: sanitizedAgent.id })

    } catch (error) {
      errorHandler.handleError(
        error as Error,
        ErrorSeverity.MEDIUM,
        { 
          module: 'AgentMeshXR', 
          function: 'addAgent', 
          sessionId: this.sessionId,
          timestamp: Date.now(),
          additionalData: { attemptedAgentId: agent?.id }
        }
      )

      this.securityManager.auditAction('add_agent', 'agent', 'failure', {
        additionalData: { attemptedAgentId: agent?.id, error: (error as Error).message }
      })

      throw error
    }
  }

  updateAgent(agentData: Partial<Agent> & { id: string }): void {
    const existing = this.agents.get(agentData.id)
    if (existing) {
      const updated = { ...existing, ...agentData, lastUpdate: Date.now() }
      this.agents.set(agentData.id, updated)
      this.swarmVisualizer.updateAgent(updated)
      this.emit('agentUpdated', updated)
    }
  }

  removeAgent(agentId: string): void {
    const agent = this.agents.get(agentId)
    if (agent) {
      this.agents.delete(agentId)
      this.swarmVisualizer.removeAgent(agentId)
      this.emit('agentRemoved', agent)
    }
  }

  getAgent(agentId: string): Agent | undefined {
    return this.agents.get(agentId)
  }

  getAllAgents(): Agent[] {
    return Array.from(this.agents.values())
  }

  getActiveAgentCount(): number {
    return Array.from(this.agents.values())
      .filter(agent => agent.currentState.status === 'active').length
  }

  private setupEventListeners(): void {
    this.connector.on('agentUpdate', (agents: Agent[]) => {
      agents.forEach(agent => this.updateAgent(agent))
      this.emit('agentUpdate', agents)
    })

    this.connector.on('agentRemoved', (agentId: string) => {
      this.removeAgent(agentId)
    })

    this.connector.on('error', (error) => {
      this.emit('error', error)
    })

    this.xrManager.on('sessionEnd', () => {
      this.isRunning = false
      this.emit('xrStopped')
    })
  }

  private startRenderLoop(): void {
    const render = () => {
      if (!this.isRunning) return

      try {
        // Measure render performance
        this.performanceMonitor.measurePerformance('render', () => {
          this.xrManager.render()
        })

        // Measure update performance
        this.performanceMonitor.measurePerformance('update', () => {
          this.swarmVisualizer.update()
          
          if (this.timeController) {
            this.timeController.update()
          }
        })

      } catch (error) {
        errorHandler.handleError(
          error as Error,
          ErrorSeverity.HIGH,
          { 
            module: 'AgentMeshXR', 
            function: 'renderLoop', 
            sessionId: this.sessionId,
            timestamp: Date.now()
          },
          { autoRecover: true }
        )
      }

      requestAnimationFrame(render)
    }
    
    this.performanceMonitor.startMonitoring()
    render()
  }

  private rewindToTimestamp(timestamp: number): void {
    // Implementation for time rewind
    this.emit('timeRewind', timestamp)
  }

  private setupErrorRecovery(): void {
    // Setup automatic error recovery strategies
    errorHandler.registerRetryStrategy('NetworkError', async () => {
      logger.info('AgentMeshXR', 'Attempting network recovery')
      try {
        await this.connector.reconnect()
        return true
      } catch (retryError) {
        return false
      }
    })

    errorHandler.registerRetryStrategy('XRError', async () => {
      logger.info('AgentMeshXR', 'Attempting XR recovery')
      try {
        await this.xrManager.resetSession()
        return true
      } catch (retryError) {
        return false
      }
    })
  }

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Public API extensions for robust operation
  getPerformanceReport(): any {
    return this.performanceMonitor.getPerformanceReport()
  }

  getSecurityReport(): any {
    return this.securityManager.getSecurityReport()
  }

  getScene(): any {
    return this.xrManager.getScene()
  }

  getSessionId(): string {
    return this.sessionId
  }

  dispose(): void {
    try {
      logger.info('AgentMeshXR', 'Disposing AgentMeshXR', { sessionId: this.sessionId })
      
      this.isRunning = false
      
      // Stop monitoring
      this.performanceMonitor.stopMonitoring()
      this.performanceMonitor.dispose()

      // Cleanup connections
      this.connector.disconnect()
      
      // Cleanup XR
      this.xrManager.dispose()
      
      // Cleanup visualization
      this.swarmVisualizer.dispose()
      
      // Cleanup time controller
      if (this.timeController) {
        this.timeController.dispose()
      }

      // Clear agents
      this.agents.clear()

      // Final audit
      this.securityManager.auditAction('dispose', 'system', 'success', {
        additionalData: { sessionId: this.sessionId }
      })

      this.removeAllListeners()

    } catch (error) {
      errorHandler.handleError(
        error as Error,
        ErrorSeverity.MEDIUM,
        { 
          module: 'AgentMeshXR', 
          function: 'dispose',
          sessionId: this.sessionId,
          timestamp: Date.now()
        }
      )
    }
  }
}