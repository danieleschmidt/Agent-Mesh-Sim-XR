import { EventEmitter } from 'eventemitter3'
import { 
  Group, 
  Mesh, 
  PlaneGeometry, 
  MeshBasicMaterial,
  Vector3,
  Color,
  CanvasTexture,
  DoubleSide
} from 'three'
import type { Agent } from '../types'

interface SpatialInspectorConfig {
  followUser: boolean
  anchorDistance: number
  autoHide: boolean
  maxPanels: number
}

interface AgentPanel {
  agent: Agent
  group: Group
  canvas: HTMLCanvasElement
  context: CanvasRenderingContext2D
  texture: CanvasTexture
  mesh: Mesh
  sections: Map<string, any>
}

export class SpatialInspector extends EventEmitter {
  private config: SpatialInspectorConfig
  private panels: Map<string, AgentPanel> = new Map()
  private mainGroup: Group
  private userPosition: Vector3 = new Vector3()
  private selectedAgent: Agent | null = null

  constructor(config: Partial<SpatialInspectorConfig> = {}) {
    super()
    
    this.config = {
      followUser: true,
      anchorDistance: 1.5,
      autoHide: false,
      maxPanels: 3,
      ...config
    }
    
    this.mainGroup = new Group()
    this.setupUpdateLoop()
  }

  private setupUpdateLoop(): void {
    const update = () => {
      if (this.config.followUser) {
        this.updatePanelPositions()
      }
      requestAnimationFrame(update)
    }
    update()
  }

  inspectAgent(agent: Agent): void {
    // Close oldest panel if at max capacity
    if (this.panels.size >= this.config.maxPanels) {
      const oldestId = this.panels.keys().next().value
      if (oldestId) this.closePanel(oldestId)
    }

    const panel = this.createAgentPanel(agent)
    this.panels.set(agent.id, panel)
    this.mainGroup.add(panel.group)
    
    this.selectedAgent = agent
    this.emit('agentSelected', agent)
  }

  private createAgentPanel(agent: Agent): AgentPanel {
    const canvas = document.createElement('canvas')
    canvas.width = 512
    canvas.height = 512
    
    const context = canvas.getContext('2d')!
    const texture = new CanvasTexture(canvas)
    
    const geometry = new PlaneGeometry(1, 1)
    const material = new MeshBasicMaterial({ 
      map: texture, 
      transparent: true,
      side: DoubleSide
    })
    
    const mesh = new Mesh(geometry, material)
    const group = new Group()
    group.add(mesh)
    
    const panel: AgentPanel = {
      agent,
      group,
      canvas,
      context,
      texture,
      mesh,
      sections: new Map()
    }
    
    this.renderPanelContent(panel)
    return panel
  }

  private renderPanelContent(panel: AgentPanel): void {
    const { context, canvas, agent } = panel
    
    // Clear canvas
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'
    context.fillRect(0, 0, canvas.width, canvas.height)
    
    // Header
    context.fillStyle = '#00ff00'
    context.font = 'bold 24px Arial'
    context.fillText(`Agent ${agent.id}`, 20, 40)
    
    let y = 80
    const lineHeight = 25
    
    // Basic info
    context.fillStyle = '#ffffff'
    context.font = '16px Arial'
    
    const info = [
      `Type: ${agent.type}`,
      `Status: ${agent.currentState.status}`,
      `Role: ${agent.currentState.role}`,
      `Energy: ${agent.currentState.energy.toFixed(1)}`,
      `Position: (${agent.position.x.toFixed(2)}, ${agent.position.y.toFixed(2)}, ${agent.position.z.toFixed(2)})`,
      '',
      'Performance:',
      `  CPU: ${agent.metrics.cpuMs.toFixed(2)}ms`,
      `  Memory: ${agent.metrics.memoryMB.toFixed(1)}MB`,
      `  Messages/sec: ${agent.metrics.msgPerSec}`,
      '',
      'Connections:',
      `  Peers: ${agent.connectedPeers.length}`,
      `  Goals: ${agent.activeGoals.length}`
    ]
    
    info.forEach(line => {
      if (line.startsWith('  ')) {
        context.fillStyle = '#cccccc'
        context.fillText(line, 40, y)
      } else if (line === '') {
        // Skip empty lines but advance y
      } else {
        context.fillStyle = '#ffffff'
        context.fillText(line, 20, y)
      }
      y += lineHeight
    })
    
    // Render custom sections
    panel.sections.forEach((data, sectionName) => {
      y += 10
      context.fillStyle = '#00ccff'
      context.font = 'bold 18px Arial'
      context.fillText(sectionName, 20, y)
      y += 25
      
      context.fillStyle = '#ffffff'
      context.font = '14px Arial'
      
      if (typeof data === 'object') {
        Object.entries(data).forEach(([key, value]) => {
          const text = `${key}: ${JSON.stringify(value)}`
          context.fillText(text.substring(0, 50), 30, y)
          y += 20
        })
      } else {
        context.fillText(String(data), 30, y)
        y += 20
      }
    })
    
    panel.texture.needsUpdate = true
  }

  addSection(agentId: string, sectionName: string, data: any): void {
    const panel = this.panels.get(agentId)
    if (panel) {
      panel.sections.set(sectionName, data)
      this.renderPanelContent(panel)
    }
  }

  updateAgent(agent: Agent): void {
    const panel = this.panels.get(agent.id)
    if (panel) {
      panel.agent = agent
      this.renderPanelContent(panel)
    }
  }

  closePanel(agentId: string): void {
    const panel = this.panels.get(agentId)
    if (panel) {
      this.mainGroup.remove(panel.group)
      panel.texture.dispose()
      this.panels.delete(agentId)
      
      if (this.selectedAgent?.id === agentId) {
        this.selectedAgent = null
      }
      
      this.emit('panelClosed', agentId)
    }
  }

  closeAllPanels(): void {
    Array.from(this.panels.keys()).forEach(agentId => {
      this.closePanel(agentId)
    })
  }

  showPanel(agentId: string): void {
    const panel = this.panels.get(agentId)
    if (panel) {
      panel.group.visible = true
    }
  }

  hidePanel(agentId: string): void {
    const panel = this.panels.get(agentId)
    if (panel) {
      panel.group.visible = false
    }
  }

  setUserPosition(position: Vector3): void {
    this.userPosition.copy(position)
  }

  private updatePanelPositions(): void {
    let index = 0
    this.panels.forEach(panel => {
      const angle = (index * Math.PI * 2) / Math.max(this.panels.size, 1)
      const x = Math.cos(angle) * this.config.anchorDistance
      const z = Math.sin(angle) * this.config.anchorDistance
      
      panel.group.position.set(
        this.userPosition.x + x,
        this.userPosition.y + 0.5,
        this.userPosition.z + z
      )
      
      // Make panel face the user
      panel.group.lookAt(this.userPosition)
      
      index++
    })
  }

  getSelectedAgent(): Agent | null {
    return this.selectedAgent
  }

  getPanelCount(): number {
    return this.panels.size
  }

  getMainGroup(): Group {
    return this.mainGroup
  }

  setVisible(visible: boolean): void {
    this.mainGroup.visible = visible
  }

  isVisible(): boolean {
    return this.mainGroup.visible
  }

  // Interaction handling
  handleControllerSelect(controllerPosition: Vector3, agentGetter: (position: Vector3) => Agent | null): void {
    const agent = agentGetter(controllerPosition)
    if (agent) {
      this.inspectAgent(agent)
    }
  }

  handleRaycast(origin: Vector3, direction: Vector3, agentGetter: (origin: Vector3, direction: Vector3) => Agent | null): void {
    const agent = agentGetter(origin, direction)
    if (agent) {
      this.inspectAgent(agent)
    }
  }

  // Panel management
  cyclePanels(): void {
    const panelIds = Array.from(this.panels.keys())
    if (panelIds.length === 0) return
    
    const currentIndex = this.selectedAgent ? 
      panelIds.indexOf(this.selectedAgent.id) : -1
    const nextIndex = (currentIndex + 1) % panelIds.length
    
    const nextAgentId = panelIds[nextIndex]
    const panel = this.panels.get(nextAgentId)
    if (panel) {
      this.selectedAgent = panel.agent
      this.emit('agentSelected', panel.agent)
    }
  }

  resize(scale: number): void {
    this.panels.forEach(panel => {
      panel.group.scale.setScalar(scale)
    })
  }

  dispose(): void {
    this.closeAllPanels()
    this.removeAllListeners()
  }
}