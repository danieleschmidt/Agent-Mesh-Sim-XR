import { Vector3 } from 'three'

export interface Agent {
  id: string
  type: string
  position: Vector3
  velocity: Vector3
  currentState: AgentState
  metadata: Record<string, unknown>
  activeGoals: string[]
  connectedPeers: string[]
  metrics: AgentMetrics
  lastUpdate: number
}

export interface AgentState {
  status: 'active' | 'idle' | 'error' | 'paused'
  behavior: string
  role: string
  energy: number
  priority: number
  goals?: string[]
}

export interface AgentMetrics {
  cpuMs: number
  memoryMB: number
  msgPerSec: number
  uptime: number
}

export interface AgentMeshXRConfig {
  maxAgents: number
  physicsEngine: 'rapier' | 'cannon' | 'matter'
  renderMode: 'instanced' | 'individual'
  vrSupport: boolean
  arSupport: boolean
  networkConfig?: NetworkConfig
}

export interface NetworkConfig {
  endpoint: string
  reconnectAttempts: number
  heartbeatInterval: number
  retryAttempts?: number
  timeout?: number
}

export interface XRSessionConfig {
  mode: 'immersive-vr' | 'immersive-ar' | 'inline'
  referenceSpace: 'local-floor' | 'bounded-floor' | 'unbounded'
  controllers: boolean
  handTracking: boolean
}

export interface SwarmVisualizationConfig {
  agentModel: 'geometric' | 'avatar' | 'particle'
  colorScheme: 'byState' | 'byType' | 'byRole' | 'byPerformance'
  trailLength: number
  clusterDetection: boolean
  lodEnabled: boolean
}

export interface CausalEvent {
  id: string
  timestamp: number
  type: 'message' | 'stateChange' | 'decision'
  agentId: string
  causedBy?: string[]
  data: Record<string, unknown>
}

export interface TimeControlConfig {
  maxRewind: number
  recordInterval: number
  causalTracking: boolean
}