import { EventEmitter } from 'eventemitter3'
import { XRManager } from './XRManager'
import { AgentMeshConnector } from './AgentMeshConnector'
import { SimpleSwarmVisualizer as SwarmVisualizer } from '../visualization/SimpleSwarmVisualizer'
import { TimeController } from '../debugging/TimeController'
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor'
import { SecurityManager } from '../security/SecurityManager'
import { SimpleGPUAccelerator } from './SimpleGPUAccelerator'
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
  private gpuAccelerator: SimpleGPUAccelerator
  private config: AgentMeshXRConfig
  private agents: Map<string, Agent> = new Map()
  private isRunning = false
  private sessionId: string
  private healthCheckInterval?: NodeJS.Timeout
  private lastHealthCheck = 0
  private consecutiveFailures = 0
  private maxConsecutiveFailures = 3
  private circuitBreakerOpen = false

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

      // Initialize GPU accelerator for scaling
      this.gpuAccelerator = new SimpleGPUAccelerator({
        maxBatchSize: Math.min(config.maxAgents / 10, 100),
        enableInstancing: true,
        useWebWorkers: true,
        workerCount: Math.min(navigator.hardwareConcurrency || 4, 6)
      })
      
      this.setupEventListeners()
      this.setupErrorRecovery()
      this.startHealthCheck()

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
      // Circuit breaker check
      if (this.circuitBreakerOpen) {
        logger.warn('AgentMeshXR', 'Agent add rejected - circuit breaker open')
        throw new Error('System in degraded state - agent addition rejected')
      }

      // Validate and sanitize agent data
      Validator.validateAgent(agent)
      const sanitizedAgent = Validator.sanitizeAgentData(agent)

      // Adaptive capacity management
      const currentCapacity = this.getAdaptiveCapacity()
      if (this.agents.size >= currentCapacity) {
        throw new Error(`Current capacity limit reached: ${currentCapacity}`)
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
        this.performanceMonitor.measurePerformance('update', async () => {
          // Batch process agent updates for better performance
          if (this.agents.size > 50) {
            await this.processBatchedAgentUpdates()
          }
          
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

  private startHealthCheck(): void {
    this.healthCheckInterval = setInterval(() => {
      this.performHealthCheck()
    }, 10000) // Check every 10 seconds
  }

  private async performHealthCheck(): Promise<void> {
    try {
      this.lastHealthCheck = Date.now()
      
      // Check system health
      const performanceReport = this.performanceMonitor.getPerformanceReport()
      const isHealthy = this.evaluateSystemHealth(performanceReport)
      
      if (isHealthy) {
        this.consecutiveFailures = 0
        if (this.circuitBreakerOpen) {
          this.circuitBreakerOpen = false
          logger.info('AgentMeshXR', 'Circuit breaker closed - system recovered')
          this.emit('healthRecovered')
        }
      } else {
        this.consecutiveFailures++
        logger.warn('AgentMeshXR', 'Health check failed', { 
          consecutiveFailures: this.consecutiveFailures,
          maxFailures: this.maxConsecutiveFailures 
        })
        
        if (this.consecutiveFailures >= this.maxConsecutiveFailures && !this.circuitBreakerOpen) {
          this.circuitBreakerOpen = true
          logger.error('AgentMeshXR', 'Circuit breaker opened - system degraded')
          this.emit('healthDegraded')
          await this.attemptRecovery()
        }
      }
      
      this.emit('healthCheck', { 
        healthy: isHealthy, 
        timestamp: this.lastHealthCheck,
        circuitBreakerOpen: this.circuitBreakerOpen 
      })
      
    } catch (error) {
      logger.error('AgentMeshXR', 'Health check error', error as Error)
    }
  }

  private evaluateSystemHealth(performanceReport: unknown): boolean {
    // Simple health evaluation based on performance metrics
    try {
      const report = performanceReport as { fps?: number; memoryUsage?: number; isMonitoring?: boolean }
      
      if (!report?.isMonitoring) return false
      if (report.fps && report.fps < 15) return false // Critical FPS threshold
      if (report.memoryUsage && report.memoryUsage > 90) return false // Critical memory threshold
      
      return true
    } catch {
      return false
    }
  }

  private async attemptRecovery(): Promise<void> {
    try {
      logger.info('AgentMeshXR', 'Attempting system recovery')
      
      // Reduce agent count if too high
      if (this.agents.size > this.config.maxAgents * 0.8) {
        const agentsToRemove = Array.from(this.agents.keys()).slice(Math.floor(this.config.maxAgents * 0.6))
        agentsToRemove.forEach(id => this.removeAgent(id))
        logger.info('AgentMeshXR', 'Reduced agent count for recovery', { removed: agentsToRemove.length })
      }
      
      // Clear performance history
      this.performanceMonitor.clearMetrics()
      
      // Restart monitoring
      this.performanceMonitor.stopMonitoring()
      await new Promise(resolve => setTimeout(resolve, 1000))
      this.performanceMonitor.startMonitoring()
      
    } catch (error) {
      logger.error('AgentMeshXR', 'Recovery attempt failed', error as Error)
    }
  }

  private async processBatchedAgentUpdates(): Promise<void> {
    try {
      const allAgents = Array.from(this.agents.values())
      
      if (allAgents.length === 0) return

      // Optimize batch size based on current performance
      const performanceReport = this.performanceMonitor.getPerformanceReport() as { fps?: number }
      const currentFPS = performanceReport?.fps || 60
      const optimizedBatchSize = this.gpuAccelerator.optimizeBatchSize(currentFPS)
      
      // Process agents in batches
      for (let i = 0; i < allAgents.length; i += optimizedBatchSize) {
        const batch = allAgents.slice(i, i + optimizedBatchSize)
        
        const result = await this.gpuAccelerator.processAgentBatch(batch)
        
        if (result.errors > 0) {
          logger.warn('AgentMeshXR', 'Batch processing had errors', { 
            errors: result.errors,
            processed: result.processed,
            timeMs: result.timeMs
          })
        }

        // Log performance warnings if batch processing is slow
        if (result.timeMs > 16) { // Frame budget exceeded
          logger.warn('AgentMeshXR', 'Batch processing exceeded frame budget', {
            timeMs: result.timeMs,
            frameBudget: 16,
            batchSize: batch.length
          })
        }
      }

    } catch (error) {
      logger.error('AgentMeshXR', 'Failed to process agent batch updates', error as Error)
    }
  }

  private getAdaptiveCapacity(): number {
    try {
      const performanceReport = this.performanceMonitor.getPerformanceReport() as { 
        fps?: number; 
        memoryUsage?: number;
        renderTime?: number;
      }

      let capacityMultiplier = 1.0

      // Reduce capacity based on performance metrics
      if (performanceReport?.fps && performanceReport.fps < 30) {
        capacityMultiplier *= 0.7 // Reduce to 70% if FPS is low
      }
      
      if (performanceReport?.memoryUsage && performanceReport.memoryUsage > 70) {
        capacityMultiplier *= 0.8 // Reduce to 80% if memory usage is high
      }

      if (performanceReport?.renderTime && performanceReport.renderTime > 25) {
        capacityMultiplier *= 0.9 // Reduce to 90% if render time is high
      }

      const adaptiveCapacity = Math.floor(this.config.maxAgents * capacityMultiplier)
      return Math.max(100, adaptiveCapacity) // Minimum capacity of 100 agents
      
    } catch {
      return this.config.maxAgents
    }
  }

  // Public API extensions for robust operation
  getPerformanceReport(): unknown {
    return this.performanceMonitor.getPerformanceReport()
  }

  getSecurityReport(): unknown {
    return this.securityManager.getSecurityReport()
  }

  getScene(): unknown {
    return this.xrManager.getScene()
  }

  getSessionId(): string {
    return this.sessionId
  }

  getGPUAcceleratorStats(): unknown {
    return this.gpuAccelerator.getStatistics()
  }

  getSystemInfo(): unknown {
    return {
      sessionId: this.sessionId,
      agentCount: this.agents.size,
      activeAgents: this.getActiveAgentCount(),
      adaptiveCapacity: this.getAdaptiveCapacity(),
      circuitBreakerOpen: this.circuitBreakerOpen,
      isRunning: this.isRunning,
      lastHealthCheck: this.lastHealthCheck,
      consecutiveFailures: this.consecutiveFailures,
      performance: this.getPerformanceReport(),
      gpuAccelerator: this.getGPUAcceleratorStats()
    }
  }

  dispose(): void {
    try {
      logger.info('AgentMeshXR', 'Disposing AgentMeshXR', { sessionId: this.sessionId })
      
      this.isRunning = false
      
      // Clear health check interval
      if (this.healthCheckInterval) {
        clearInterval(this.healthCheckInterval)
        this.healthCheckInterval = undefined
      }
      
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

      // Cleanup GPU accelerator
      this.gpuAccelerator.dispose()

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