import { AgentMeshXR, SwarmVisualizer, SpatialInspector, CausalTracer, TimelineVR } from '../index'
import { Vector3 } from 'three'
import type { Agent, AgentState } from '../types'

class AgentMeshXRDemo {
  private xrSim: AgentMeshXR
  private inspector: SpatialInspector
  private causalTracer: CausalTracer
  private timelineVR: TimelineVR
  private isDebugMode = false
  private simulationAgents: Agent[] = []
  private agentUpdateInterval?: NodeJS.Timeout

  constructor() {
    this.xrSim = new AgentMeshXR({
      maxAgents: 1000,
      physicsEngine: 'cannon',
      renderMode: 'instanced',
      vrSupport: true,
      arSupport: false
    })

    this.inspector = new SpatialInspector({
      followUser: true,
      anchorDistance: 1.5,
      autoHide: false
    })

    this.causalTracer = new CausalTracer({
      maxHistorySize: 10000,
      trackMessages: true,
      trackStateChanges: true,
      trackDecisions: true
    })

    this.timelineVR = new TimelineVR({
      length: 10,
      height: 2,
      position: new Vector3(0, 1, -3)
    })

    this.setupEventListeners()
    this.setupUI()
    this.startSimulation()
  }

  private setupEventListeners(): void {
    this.xrSim.on('connected', () => {
      this.updateConnectionStatus(true)
      console.log('Connected to Agent Mesh')
    })

    this.xrSim.on('error', (error) => {
      console.error('XR Error:', error)
      this.updateConnectionStatus(false)
    })

    this.xrSim.on('agentUpdate', (agents: Agent[]) => {
      this.updateMetrics()
    })

    this.xrSim.on('xrStarted', () => {
      console.log('XR Session started')
      this.addXRComponents()
    })

    // Causal tracing
    this.causalTracer.on('eventRecorded', (event) => {
      this.timelineVR.addEvent(event)
    })

    // Timeline interactions
    this.timelineVR.on('scrub', (timestamp) => {
      console.log('Timeline scrubbed to:', new Date(timestamp))
    })
  }

  private setupUI(): void {
    const connectBtn = document.getElementById('connect-btn') as HTMLButtonElement
    const vrEnterBtn = document.getElementById('vr-enter-btn') as HTMLButtonElement
    const debugModeBtn = document.getElementById('debug-mode-btn') as HTMLButtonElement
    const timeControlBtn = document.getElementById('time-control-btn') as HTMLButtonElement
    const endpointInput = document.getElementById('endpoint-input') as HTMLInputElement
    const vizModeSelect = document.getElementById('viz-mode') as HTMLSelectElement
    const agentModelSelect = document.getElementById('agent-model') as HTMLSelectElement

    connectBtn.addEventListener('click', async () => {
      const endpoint = endpointInput.value
      try {
        connectBtn.disabled = true
        connectBtn.textContent = 'Connecting...'
        
        // For demo, we'll simulate connection
        setTimeout(() => {
          this.simulateConnection()
          connectBtn.textContent = 'Connected'
          vrEnterBtn.disabled = false
        }, 1000)
        
      } catch (error) {
        console.error('Connection failed:', error)
        connectBtn.disabled = false
        connectBtn.textContent = 'Connect'
      }
    })

    vrEnterBtn.addEventListener('click', async () => {
      try {
        await this.enterVR()
      } catch (error) {
        console.error('VR entry failed:', error)
      }
    })

    debugModeBtn.addEventListener('click', () => {
      this.toggleDebugMode()
    })

    timeControlBtn.addEventListener('click', () => {
      this.enableTimeControl()
    })

    vizModeSelect.addEventListener('change', (e) => {
      const mode = (e.target as HTMLSelectElement).value
      // Update visualization mode
      console.log('Visualization mode changed to:', mode)
    })

    agentModelSelect.addEventListener('change', (e) => {
      const model = (e.target as HTMLSelectElement).value
      console.log('Agent model changed to:', model)
    })
  }

  private simulateConnection(): void {
    this.updateConnectionStatus(true)
    this.xrSim.emit('connected')
  }

  private async enterVR(): Promise<void> {
    const loading = document.getElementById('loading')!
    loading.style.display = 'block'

    try {
      await this.xrSim.startXR({
        mode: 'immersive-vr',
        referenceSpace: 'local-floor',
        controllers: true,
        handTracking: true
      })
      
      loading.style.display = 'none'
      
      // Hide UI overlay in VR
      const overlay = document.getElementById('ui-overlay')!
      overlay.style.display = 'none'
      
    } catch (error) {
      loading.style.display = 'none'
      alert('VR not supported or failed to initialize. Continuing in desktop mode.')
      console.error('VR Error:', error)
    }
  }

  private addXRComponents(): void {
    const scene = this.xrSim.getScene()
    
    // Add inspector to scene
    scene.add(this.inspector.getMainGroup())
    
    // Add timeline to scene
    scene.add(this.timelineVR.getGroup())
  }

  private toggleDebugMode(): void {
    this.isDebugMode = !this.isDebugMode
    
    const btn = document.getElementById('debug-mode-btn') as HTMLButtonElement
    btn.textContent = this.isDebugMode ? 'Exit Debug Mode' : 'Toggle Debug Mode'
    
    if (this.isDebugMode) {
      this.inspector.setVisible(true)
      this.timelineVR.getGroup().visible = true
      console.log('Debug mode enabled')
    } else {
      this.inspector.setVisible(false)
      this.timelineVR.getGroup().visible = false
      console.log('Debug mode disabled')
    }
  }

  private enableTimeControl(): void {
    this.xrSim.enableTimeControl({
      maxRewind: 3600, // 1 hour
      recordInterval: 0.1, // 100ms
      causalTracking: true
    })
    
    const btn = document.getElementById('time-control-btn') as HTMLButtonElement
    btn.textContent = 'Time Control Enabled'
    btn.disabled = true
    
    console.log('Time control enabled')
  }

  private startSimulation(): void {
    // Create some demo agents
    this.createDemoAgents()
    
    // Start agent update loop
    this.agentUpdateInterval = setInterval(() => {
      this.updateDemoAgents()
    }, 100) // 10 FPS updates
  }

  private createDemoAgents(): void {
    const agentCount = 50
    
    for (let i = 0; i < agentCount; i++) {
      const agent: Agent = {
        id: `agent-${i}`,
        type: this.getRandomAgentType(),
        position: new Vector3(
          (Math.random() - 0.5) * 20,
          Math.random() * 5,
          (Math.random() - 0.5) * 20
        ),
        velocity: new Vector3(
          (Math.random() - 0.5) * 2,
          0,
          (Math.random() - 0.5) * 2
        ),
        currentState: this.generateRandomState(),
        metadata: {
          created: Date.now(),
          version: '1.0'
        },
        activeGoals: this.generateRandomGoals(),
        connectedPeers: [],
        metrics: {
          cpuMs: Math.random() * 50,
          memoryMB: 10 + Math.random() * 40,
          msgPerSec: Math.floor(Math.random() * 20),
          uptime: Math.random() * 3600000
        },
        lastUpdate: Date.now()
      }
      
      this.simulationAgents.push(agent)
      this.xrSim.addAgent(agent)
    }
  }

  private updateDemoAgents(): void {
    this.simulationAgents.forEach(agent => {
      // Update position
      agent.position.add(agent.velocity.clone().multiplyScalar(0.1))
      
      // Bounce off boundaries
      if (Math.abs(agent.position.x) > 10) {
        agent.velocity.x *= -1
      }
      if (Math.abs(agent.position.z) > 10) {
        agent.velocity.z *= -1
      }
      
      // Random state changes
      if (Math.random() < 0.01) { // 1% chance per update
        const oldState = { ...agent.currentState }
        agent.currentState = this.generateRandomState()
        
        // Record causal event
        this.causalTracer.recordStateChange(
          agent.id,
          oldState,
          agent.currentState
        )
      }
      
      // Update metrics
      agent.metrics.cpuMs = Math.max(0, agent.metrics.cpuMs + (Math.random() - 0.5) * 5)
      agent.metrics.msgPerSec = Math.max(0, agent.metrics.msgPerSec + Math.floor((Math.random() - 0.5) * 3))
      
      agent.lastUpdate = Date.now()
      
      this.xrSim.updateAgent(agent)
    })
    
    this.updateMetrics()
  }

  private getRandomAgentType(): string {
    const types = ['worker', 'leader', 'scout', 'coordinator', 'specialist']
    return types[Math.floor(Math.random() * types.length)]
  }

  private generateRandomState(): AgentState {
    const statuses = ['active', 'idle', 'error', 'paused'] as const
    const behaviors = ['exploring', 'following', 'leading', 'waiting', 'processing']
    const roles = ['worker', 'leader', 'coordinator', 'scout']
    
    return {
      status: statuses[Math.floor(Math.random() * statuses.length)],
      behavior: behaviors[Math.floor(Math.random() * behaviors.length)],
      role: roles[Math.floor(Math.random() * roles.length)],
      energy: Math.random() * 100,
      priority: Math.floor(Math.random() * 10) + 1
    }
  }

  private generateRandomGoals(): string[] {
    const goals = ['explore_area', 'find_target', 'collaborate', 'optimize_path', 'collect_data']
    const numGoals = Math.floor(Math.random() * 3) + 1
    return goals.slice(0, numGoals)
  }

  private updateConnectionStatus(connected: boolean): void {
    const statusDot = document.getElementById('connection-status')!
    const statusText = document.getElementById('connection-text')!
    
    if (connected) {
      statusDot.classList.add('connected')
      statusText.textContent = 'Connected'
    } else {
      statusDot.classList.remove('connected')
      statusText.textContent = 'Disconnected'
    }
  }

  private updateMetrics(): void {
    const agentCount = document.getElementById('agent-count')!
    const fpsCounter = document.getElementById('fps-counter')!
    const renderTime = document.getElementById('render-time')!
    
    agentCount.textContent = this.xrSim.getActiveAgentCount().toString()
    fpsCounter.textContent = '60' // Placeholder
    renderTime.textContent = '16ms' // Placeholder
  }

  // Demo interaction handlers
  private handleAgentClick(agent: Agent): void {
    this.inspector.inspectAgent(agent)
    
    // Trace causality for this agent
    const causalChain = this.causalTracer.traceCausality({
      agent: agent.id,
      maxDepth: 5
    })
    
    console.log('Causal chain for agent', agent.id, causalChain)
  }

  dispose(): void {
    if (this.agentUpdateInterval) {
      clearInterval(this.agentUpdateInterval)
    }
    
    this.xrSim.dispose()
    this.inspector.dispose()
    this.causalTracer.removeAllListeners()
    this.timelineVR.dispose()
  }
}

// Initialize the demo
const demo = new AgentMeshXRDemo()

// Expose for debugging
;(window as any).demo = demo