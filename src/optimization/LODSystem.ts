import { Vector3, Camera, Object3D } from 'three'
import { EventEmitter } from 'eventemitter3'
import type { Agent } from '../types'

export interface LODLevel {
  distance: number
  model: 'high-poly' | 'medium-poly' | 'low-poly' | 'billboard' | 'culled'
  animations: boolean
  trails: boolean
  stateIndicators: boolean
  updateRate: number // Hz
  geometryComplexity: number // 0-1
  textureResolution: number // pixels
}

export interface LODSystemConfig {
  levels: LODLevel[]
  updateInterval: number // ms
  frustumCulling: boolean
  occlusionCulling: boolean
  adaptiveQuality: boolean
  priorityFunction?: (agent: Agent, camera: Camera) => number
}

export class LODSystem extends EventEmitter {
  private config: LODSystemConfig
  private agentLODs: Map<string, number> = new Map()
  private lastUpdateTime = 0
  private updateInterval: ReturnType<typeof setInterval> | null = null
  private camera: Camera | null = null
  private priorityCache: Map<string, { priority: number; timestamp: number }> = new Map()
  private readonly PRIORITY_CACHE_DURATION = 1000 // 1 second

  constructor(config: LODSystemConfig) {
    super()
    this.config = {
      updateInterval: config.updateInterval ?? 100, // 10 Hz default
      frustumCulling: config.frustumCulling ?? true,
      occlusionCulling: config.occlusionCulling ?? false,
      adaptiveQuality: config.adaptiveQuality ?? true,
      levels: config.levels,
      priorityFunction: config.priorityFunction
    }

    // Sort LOD levels by distance
    this.config.levels.sort((a, b) => a.distance - b.distance)
    
    this.startUpdateLoop()
  }

  private startUpdateLoop(): void {
    this.updateInterval = setInterval(() => {
      if (this.camera) {
        this.updateLODs()
      }
    }, this.config.updateInterval)
  }

  setCamera(camera: Camera): void {
    this.camera = camera
  }

  updateAgent(agent: Agent): void {
    if (!this.camera) return

    const distance = this.calculateDistance(agent.position)
    const priority = this.calculatePriority(agent)
    const lodLevel = this.determineLODLevel(distance, priority)
    
    const currentLOD = this.agentLODs.get(agent.id)
    
    if (currentLOD !== lodLevel) {
      this.agentLODs.set(agent.id, lodLevel)
      this.emit('lodChanged', {
        agentId: agent.id,
        previousLOD: currentLOD,
        newLOD: lodLevel,
        distance,
        priority
      })
    }
  }

  private updateLODs(): void {
    const now = performance.now()
    
    // Skip if too frequent
    if (now - this.lastUpdateTime < this.config.updateInterval) {
      return
    }

    this.lastUpdateTime = now
    this.emit('lodUpdateCycle', { timestamp: now })
  }

  private calculateDistance(position: Vector3): number {
    if (!this.camera) return Infinity
    
    const cameraPosition = new Vector3()
    this.camera.getWorldPosition(cameraPosition)
    
    return position.distanceTo(cameraPosition)
  }

  private calculatePriority(agent: Agent): number {
    const cacheKey = agent.id
    const cached = this.priorityCache.get(cacheKey)
    
    // Use cached priority if still valid
    if (cached && (Date.now() - cached.timestamp) < this.PRIORITY_CACHE_DURATION) {
      return cached.priority
    }

    let priority = 1.0

    // Use custom priority function if provided
    if (this.config.priorityFunction && this.camera) {
      priority = this.config.priorityFunction(agent, this.camera)
    } else {
      // Default priority calculation
      priority = this.calculateDefaultPriority(agent)
    }

    // Cache the result
    this.priorityCache.set(cacheKey, {
      priority,
      timestamp: Date.now()
    })

    return priority
  }

  private calculateDefaultPriority(agent: Agent): number {
    let priority = 1.0

    // Higher priority for active agents
    if (agent.currentState.status === 'active') {
      priority *= 1.5
    }

    // Higher priority for leaders
    if (agent.currentState.role === 'leader') {
      priority *= 2.0
    }

    // Higher priority for agents with high activity
    if (agent.metrics.msgPerSec > 10) {
      priority *= 1.3
    }

    // Lower priority for idle agents
    if (agent.currentState.status === 'idle') {
      priority *= 0.5
    }

    // Priority based on energy (low energy = higher visual priority for debugging)
    if (agent.currentState.energy < 20) {
      priority *= 1.8
    }

    return Math.max(0.1, Math.min(10.0, priority))
  }

  private determineLODLevel(distance: number, priority: number): number {
    // Adjust distance based on priority (higher priority = appears closer)
    const adjustedDistance = distance / priority

    // Find appropriate LOD level
    for (let i = 0; i < this.config.levels.length; i++) {
      if (adjustedDistance <= this.config.levels[i].distance) {
        return i
      }
    }

    // Return highest (lowest quality) LOD if beyond all distances
    return this.config.levels.length - 1
  }

  getLODLevel(agentId: string): number {
    return this.agentLODs.get(agentId) ?? this.config.levels.length - 1
  }

  getLODConfig(lodLevel: number): LODLevel | null {
    return this.config.levels[lodLevel] || null
  }

  shouldRenderAgent(agentId: string, agentPosition: Vector3): boolean {
    const lodLevel = this.getLODLevel(agentId)
    const lodConfig = this.getLODConfig(lodLevel)
    
    if (!lodConfig || lodConfig.model === 'culled') {
      return false
    }

    // Frustum culling
    if (this.config.frustumCulling && this.camera) {
      if (!this.isInFrustum(agentPosition)) {
        return false
      }
    }

    // Occlusion culling (simplified)
    if (this.config.occlusionCulling && this.camera) {
      if (this.isOccluded(agentPosition)) {
        return false
      }
    }

    return true
  }

  private isInFrustum(position: Vector3): boolean {
    if (!this.camera) return true
    
    // Simplified frustum check - in a real implementation,
    // you would use the camera's frustum
    const distance = this.calculateDistance(position)
    const far = (this.camera as any).far
    return distance <= (far || 1000)
  }

  private isOccluded(position: Vector3): boolean {
    // Simplified occlusion check
    // In a real implementation, you would use occlusion queries or raycasting
    return false
  }

  getVisibleAgentCount(): number {
    let count = 0
    this.agentLODs.forEach((lodLevel, agentId) => {
      const lodConfig = this.getLODConfig(lodLevel)
      if (lodConfig && lodConfig.model !== 'culled') {
        count++
      }
    })
    return count
  }

  adaptQuality(targetFPS: number, currentFPS: number): void {
    if (!this.config.adaptiveQuality) return

    const fpsRatio = currentFPS / targetFPS
    
    if (fpsRatio < 0.8) {
      // Performance is poor, reduce quality
      this.adjustQualityDown()
    } else if (fpsRatio > 1.2) {
      // Performance is good, increase quality
      this.adjustQualityUp()
    }
  }

  private adjustQualityDown(): void {
    // Increase distances for LOD transitions (lower quality at closer distances)
    this.config.levels.forEach(level => {
      level.distance *= 0.9
      level.updateRate = Math.max(1, level.updateRate * 0.8)
    })

    this.emit('qualityAdjusted', { direction: 'down', levels: this.config.levels })
  }

  private adjustQualityUp(): void {
    // Decrease distances for LOD transitions (higher quality at further distances)
    this.config.levels.forEach(level => {
      level.distance *= 1.1
      level.updateRate = Math.min(60, level.updateRate * 1.2)
    })

    this.emit('qualityAdjusted', { direction: 'up', levels: this.config.levels })
  }

  getBatchingGroups(): Map<number, string[]> {
    const groups = new Map<number, string[]>()
    
    this.agentLODs.forEach((lodLevel, agentId) => {
      if (!groups.has(lodLevel)) {
        groups.set(lodLevel, [])
      }
      groups.get(lodLevel)!.push(agentId)
    })

    return groups
  }

  getStatistics(): {
    totalAgents: number
    visibleAgents: number
    lodDistribution: Record<number, number>
    averageDistance: number
    priorityCacheHitRate: number
  } {
    const lodDistribution: Record<number, number> = {}
    let totalDistance = 0
    let visibleCount = 0

    this.agentLODs.forEach((lodLevel) => {
      lodDistribution[lodLevel] = (lodDistribution[lodLevel] || 0) + 1
      
      const lodConfig = this.getLODConfig(lodLevel)
      if (lodConfig && lodConfig.model !== 'culled') {
        visibleCount++
        totalDistance += lodConfig.distance
      }
    })

    const priorityCacheSize = this.priorityCache.size
    const validCacheEntries = Array.from(this.priorityCache.values())
      .filter(entry => (Date.now() - entry.timestamp) < this.PRIORITY_CACHE_DURATION)
      .length

    return {
      totalAgents: this.agentLODs.size,
      visibleAgents: visibleCount,
      lodDistribution,
      averageDistance: visibleCount > 0 ? totalDistance / visibleCount : 0,
      priorityCacheHitRate: priorityCacheSize > 0 ? validCacheEntries / priorityCacheSize : 0
    }
  }

  clearCache(): void {
    this.priorityCache.clear()
    this.emit('cacheCleared')
  }

  dispose(): void {
    if (this.updateInterval) {
      clearInterval(this.updateInterval)
      this.updateInterval = null
    }

    this.agentLODs.clear()
    this.priorityCache.clear()
    this.removeAllListeners()
  }
}