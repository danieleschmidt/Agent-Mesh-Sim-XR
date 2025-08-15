import { 
  Scene,
  Group,
  Mesh,
  SphereGeometry,
  MeshLambertMaterial,
  Color
} from 'three'
import { logger } from '../utils/Logger'
import type { Agent, SwarmVisualizationConfig } from '../types'

export class SimpleSwarmVisualizer {
  private scene: Scene
  private agentGroup: Group
  private agentMeshes: Map<string, Mesh> = new Map()
  private config: SwarmVisualizationConfig

  constructor(scene: Scene, config: SwarmVisualizationConfig) {
    this.scene = scene
    this.config = config
    this.agentGroup = new Group()
    this.scene.add(this.agentGroup)
    
    logger.info('SimpleSwarmVisualizer', 'Simple swarm visualizer initialized')
  }

  addAgent(agent: Agent): void {
    const geometry = new SphereGeometry(0.1, 8, 6)
    const material = new MeshLambertMaterial({ 
      color: this.getAgentColor(agent) 
    })
    const mesh = new Mesh(geometry, material)
    
    mesh.position.copy(agent.position)
    mesh.userData = { agentId: agent.id }
    
    this.agentMeshes.set(agent.id, mesh)
    this.agentGroup.add(mesh)
  }

  updateAgent(agent: Agent): void {
    const mesh = this.agentMeshes.get(agent.id)
    if (mesh) {
      mesh.position.copy(agent.position)
      const material = mesh.material as MeshLambertMaterial
      material.color = this.getAgentColor(agent)
    }
  }

  removeAgent(agentId: string): void {
    const mesh = this.agentMeshes.get(agentId)
    if (mesh) {
      this.agentGroup.remove(mesh)
      this.agentMeshes.delete(agentId)
    }
  }

  updateAgents(agents: Agent[]): void {
    agents.forEach(agent => this.updateAgent(agent))
  }

  update(): void {
    // Simple update method for compatibility
    // In the full version, this would handle LOD updates, etc.
  }

  private getAgentColor(agent: Agent): Color {
    switch (agent.currentState.status) {
      case 'active': return new Color(0x00ff00)
      case 'idle': return new Color(0xffff00)
      case 'error': return new Color(0xff0000)
      case 'paused': return new Color(0x808080)
      default: return new Color(0xffffff)
    }
  }

  getAgentCount(): number {
    return this.agentMeshes.size
  }

  dispose(): void {
    this.agentMeshes.clear()
    this.scene.remove(this.agentGroup)
    logger.info('SimpleSwarmVisualizer', 'Simple swarm visualizer disposed')
  }
}