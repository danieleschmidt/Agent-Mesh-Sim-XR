import { 
  Scene,
  Group,
  Mesh,
  SphereGeometry,
  MeshLambertMaterial,
  Vector3,
  Color,
  InstancedMesh,
  Matrix4,
  BufferGeometry,
  LineBasicMaterial,
  Line,
  Camera
} from 'three'
import { LODSystem } from '../optimization/LODSystem'
import { AgentCache } from '../optimization/CacheManager'
import { AgentUpdateBatcher } from '../optimization/BatchProcessor'
import { logger } from '../utils/Logger'
import type { Agent, SwarmVisualizationConfig } from '../types'

export class SwarmVisualizer {
  private scene: Scene
  private agentGroup: Group
  private agentMeshes: Map<string, Mesh> = new Map()
  private trailMeshes: Map<string, Line> = new Map()
  private instancedMesh?: InstancedMesh
  private config: SwarmVisualizationConfig
  private agentPositions: Map<string, Vector3[]> = new Map()
  private lodSystem: LODSystem
  private cache: AgentCache
  private updateBatcher: AgentUpdateBatcher
  private camera: Camera | null = null
  private lastUpdateTime = 0

  constructor(scene: Scene, config?: Partial<SwarmVisualizationConfig>) {
    this.scene = scene
    this.agentGroup = new Group()
    this.scene.add(this.agentGroup)
    
    this.config = {
      agentModel: 'geometric',
      colorScheme: 'byState',
      trailLength: 50,
      clusterDetection: false,
      lodEnabled: true,
      ...config
    }

    // Initialize optimization systems
    this.cache = new AgentCache({
      maxSize: 5000,
      defaultTTL: 30000 // 30 seconds
    })

    this.lodSystem = new LODSystem({
      levels: [
        { distance: 5, model: 'high-poly', animations: true, trails: true, stateIndicators: true, updateRate: 60, geometryComplexity: 1.0, textureResolution: 512 },
        { distance: 20, model: 'medium-poly', animations: true, trails: false, stateIndicators: true, updateRate: 30, geometryComplexity: 0.6, textureResolution: 256 },
        { distance: 50, model: 'low-poly', animations: false, trails: false, stateIndicators: false, updateRate: 10, geometryComplexity: 0.3, textureResolution: 128 },
        { distance: 100, model: 'billboard', animations: false, trails: false, stateIndicators: false, updateRate: 5, geometryComplexity: 0.1, textureResolution: 64 },
        { distance: Infinity, model: 'culled', animations: false, trails: false, stateIndicators: false, updateRate: 1, geometryComplexity: 0, textureResolution: 0 }
      ],
      updateInterval: 100,
      frustumCulling: true,
      occlusionCulling: false,
      adaptiveQuality: true
    })

    this.updateBatcher = new AgentUpdateBatcher(
      async (agents: Agent[]) => {
        this.processBatchedUpdates(agents)
      },
      {
        maxBatchSize: 100,
        flushInterval: 16, // ~60fps
        maxWaitTime: 33
      }
    )
    
    this.setupInstancedRendering()
    this.setupEventListeners()

    logger.info('SwarmVisualizer', 'SwarmVisualizer initialized with optimization systems')
  }

  private setupInstancedRendering(): void {
    const geometry = new SphereGeometry(0.1, 8, 6)
    const material = new MeshLambertMaterial({ color: 0x00ff00 })
    
    // Create instanced mesh for performance with many agents
    this.instancedMesh = new InstancedMesh(geometry, material, 5000)
    this.instancedMesh.instanceMatrix.setUsage(35048) // DYNAMIC_DRAW
    this.agentGroup.add(this.instancedMesh)
  }

  addAgent(agent: Agent): void {
    if (this.config.agentModel === 'geometric') {
      this.createIndividualAgent(agent)
    }
    
    this.initializeTrail(agent)
    this.cache.cacheAgentState(agent.id, agent.currentState)
    this.lodSystem.updateAgent(agent)
  }

  updateAgent(agent: Agent): void {
    // Use batching for better performance
    this.updateBatcher.updateAgent(agent)
  }

  removeAgent(agentId: string): void {
    const mesh = this.agentMeshes.get(agentId)
    if (mesh) {
      this.agentGroup.remove(mesh)
      this.agentMeshes.delete(agentId)
    }

    const trail = this.trailMeshes.get(agentId)
    if (trail) {
      this.agentGroup.remove(trail)
      this.trailMeshes.delete(agentId)
    }

    this.agentPositions.delete(agentId)
  }

  private createIndividualAgent(agent: Agent): void {
    const geometry = new SphereGeometry(0.1, 16, 12)
    const material = new MeshLambertMaterial({ 
      color: this.getAgentColor(agent) 
    })
    
    const mesh = new Mesh(geometry, material)
    mesh.position.copy(agent.position)
    mesh.userData = { agentId: agent.id }
    
    this.agentGroup.add(mesh)
    this.agentMeshes.set(agent.id, mesh)
  }

  private updateIndividualAgent(agent: Agent): void {
    const mesh = this.agentMeshes.get(agent.id)
    if (mesh) {
      mesh.position.copy(agent.position)
      
      const material = mesh.material as MeshLambertMaterial
      material.color = this.getAgentColor(agent)
    }
  }

  private updateInstancedMesh(): void {
    if (!this.instancedMesh) return

    const agents = Array.from(this.agentMeshes.keys())
    const matrix = new Matrix4()
    
    agents.forEach((agentId, index) => {
      const mesh = this.agentMeshes.get(agentId)
      if (mesh && index < this.instancedMesh!.count) {
        matrix.setPosition(mesh.position)
        this.instancedMesh!.setMatrixAt(index, matrix)
      }
    })
    
    this.instancedMesh.instanceMatrix.needsUpdate = true
  }

  private initializeTrail(agent: Agent): void {
    if (this.config.trailLength === 0) return

    this.agentPositions.set(agent.id, [agent.position.clone()])
  }

  private updateTrail(agent: Agent): void {
    if (this.config.trailLength === 0) return

    const positions = this.agentPositions.get(agent.id) || []
    positions.push(agent.position.clone())
    
    if (positions.length > this.config.trailLength) {
      positions.shift()
    }
    
    if (positions.length > 1) {
      this.createTrailMesh(agent.id, positions)
    }
    
    this.agentPositions.set(agent.id, positions)
  }

  private createTrailMesh(agentId: string, positions: Vector3[]): void {
    const existingTrail = this.trailMeshes.get(agentId)
    if (existingTrail) {
      this.agentGroup.remove(existingTrail)
    }

    const geometry = new BufferGeometry().setFromPoints(positions)
    const material = new LineBasicMaterial({ 
      color: 0x666666,
      opacity: 0.6,
      transparent: true
    })
    
    const trail = new Line(geometry, material)
    this.agentGroup.add(trail)
    this.trailMeshes.set(agentId, trail)
  }

  private getAgentColor(agent: Agent): Color {
    switch (this.config.colorScheme) {
      case 'byState':
        return this.getStateColor(agent.currentState.status)
      case 'byType':
        return this.getTypeColor(agent.type)
      case 'byRole':
        return this.getRoleColor(agent.currentState.role)
      case 'byPerformance':
        return this.getPerformanceColor(agent.metrics.cpuMs)
      default:
        return new Color(0x00ff00)
    }
  }

  private getStateColor(status: string): Color {
    const colors = {
      active: 0x00ff00,
      idle: 0xffff00,
      error: 0xff0000,
      paused: 0x888888
    }
    return new Color(colors[status as keyof typeof colors] || 0x666666)
  }

  private getTypeColor(type: string): Color {
    const hash = this.stringToHash(type)
    return new Color().setHSL(hash % 360 / 360, 0.7, 0.5)
  }

  private getRoleColor(role: string): Color {
    const roleColors = {
      leader: 0xff6b00,
      worker: 0x00ff00,
      coordinator: 0x0066ff,
      scout: 0xff00ff
    }
    return new Color(roleColors[role as keyof typeof roleColors] || 0x666666)
  }

  private getPerformanceColor(cpuMs: number): Color {
    const normalized = Math.min(cpuMs / 100, 1) // Normalize to 0-1
    return new Color().setHSL((1 - normalized) * 0.33, 1, 0.5) // Green to red
  }

  private stringToHash(str: string): number {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash)
  }

  setVisualizationMode(mode: SwarmVisualizationConfig['colorScheme']): void {
    this.config.colorScheme = mode
    
    // Update all existing agents with new color scheme
    this.agentMeshes.forEach((mesh, agentId) => {
      // Would need agent data to update colors
      const material = mesh.material as MeshLambertMaterial
      material.color = new Color(0x00ff00) // Default color for now
    })
  }

  showTrails(enabled: boolean): void {
    this.trailMeshes.forEach(trail => {
      trail.visible = enabled
    })
  }

  highlightAgents(agentIds: string[]): void {
    this.agentMeshes.forEach((mesh, agentId) => {
      const material = mesh.material as MeshLambertMaterial
      if (agentIds.includes(agentId)) {
        material.emissive = new Color(0x444444)
      } else {
        material.emissive = new Color(0x000000)
      }
    })
  }

  private setupEventListeners(): void {
    this.lodSystem.on('lodChanged', ({ agentId, newLOD }) => {
      const agent = this.getAgentFromCache(agentId)
      if (agent) {
        this.updateAgentLOD(agent, newLOD)
      }
    })

    this.lodSystem.on('qualityAdjusted', ({ direction }) => {
      logger.info('SwarmVisualizer', `Quality adjusted ${direction}`)
    })
  }

  private async processBatchedUpdates(agents: Agent[]): Promise<void> {
    // Process agents in batches for better performance
    for (const agent of agents) {
      this.updateAgentInternal(agent)
    }
  }

  setCamera(camera: Camera): void {
    this.camera = camera
    this.lodSystem.setCamera(camera)
  }


  updateAgentBatch(agents: Agent[]): void {
    agents.forEach(agent => this.updateBatcher.updateAgent(agent))
  }

  private updateAgentInternal(agent: Agent): void {
    // Check cache first
    const cachedState = this.cache.getAgentState(agent.id)
    if (cachedState && this.statesEqual(cachedState, agent.currentState)) {
      return // No visual update needed
    }

    // Update LOD
    if (this.config.lodEnabled) {
      this.lodSystem.updateAgent(agent)
      
      // Skip rendering if agent is culled
      if (!this.lodSystem.shouldRenderAgent(agent.id, agent.position)) {
        return
      }
    }

    // Update visual representation
    if (this.config.agentModel === 'geometric') {
      this.updateIndividualAgent(agent)
    }
    
    this.updateTrail(agent)
    
    // Cache the new state
    this.cache.cacheAgentState(agent.id, agent.currentState)
    this.cache.cacheAgentMetrics(agent.id, agent.metrics)
  }

  private updateAgentLOD(agent: Agent, lodLevel: number): void {
    const lodConfig = this.lodSystem.getLODConfig(lodLevel)
    if (!lodConfig) return

    const mesh = this.agentMeshes.get(agent.id)
    if (!mesh) return

    // Update based on LOD level
    switch (lodConfig.model) {
      case 'high-poly':
        this.setHighPolyModel(mesh, agent)
        break
      case 'medium-poly':
        this.setMediumPolyModel(mesh, agent)
        break
      case 'low-poly':
        this.setLowPolyModel(mesh, agent)
        break
      case 'billboard':
        this.setBillboardModel(mesh, agent)
        break
      case 'culled':
        mesh.visible = false
        return
    }

    mesh.visible = true
  }

  private setHighPolyModel(mesh: Mesh, agent: Agent): void {
    // High quality rendering
    mesh.geometry = new SphereGeometry(0.1, 16, 12)
    this.updateMeshMaterial(mesh, agent, 1.0)
  }

  private setMediumPolyModel(mesh: Mesh, agent: Agent): void {
    // Medium quality rendering
    mesh.geometry = new SphereGeometry(0.1, 12, 8)
    this.updateMeshMaterial(mesh, agent, 0.8)
  }

  private setLowPolyModel(mesh: Mesh, agent: Agent): void {
    // Low quality rendering
    mesh.geometry = new SphereGeometry(0.1, 8, 6)
    this.updateMeshMaterial(mesh, agent, 0.6)
  }

  private setBillboardModel(mesh: Mesh, agent: Agent): void {
    // Very low quality billboard
    mesh.geometry = new SphereGeometry(0.1, 4, 3)
    this.updateMeshMaterial(mesh, agent, 0.4)
  }

  private updateMeshMaterial(mesh: Mesh, agent: Agent, quality: number): void {
    const material = mesh.material as MeshLambertMaterial
    material.color = this.getAgentColor(agent)
    
    // Adjust material quality based on LOD
    if (quality < 0.5) {
      material.flatShading = true
    } else {
      material.flatShading = false
    }
  }

  private statesEqual(state1: any, state2: any): boolean {
    return JSON.stringify(state1) === JSON.stringify(state2)
  }

  private getAgentFromCache(agentId: string): Agent | null {
    // This would need to be implemented based on your agent storage
    return null
  }

  adaptQuality(targetFPS: number, currentFPS: number): void {
    if (this.config.lodEnabled) {
      this.lodSystem.adaptQuality(targetFPS, currentFPS)
    }
  }

  getOptimizationStatistics(): {
    lodStats: any
    cacheStats: any
    batchStats: any
    visibleAgents: number
  } {
    return {
      lodStats: this.lodSystem.getStatistics(),
      cacheStats: this.cache.getStatistics(),
      batchStats: this.updateBatcher.getStatistics(),
      visibleAgents: this.lodSystem.getVisibleAgentCount()
    }
  }

  update(): void {
    const now = performance.now()
    
    // Throttle updates based on performance
    if (now - this.lastUpdateTime < 16) { // ~60fps max
      return
    }

    // Update any animations or time-based effects
    this.updateInstancedMesh()
    
    this.lastUpdateTime = now
  }

  dispose(): void {
    this.agentMeshes.clear()
    this.trailMeshes.clear()
    this.agentPositions.clear()
    this.scene.remove(this.agentGroup)
    
    // Dispose optimization systems
    this.lodSystem.dispose()
    this.cache.dispose()
    this.updateBatcher.dispose()
    
    logger.info('SwarmVisualizer', 'SwarmVisualizer disposed')
  }
}