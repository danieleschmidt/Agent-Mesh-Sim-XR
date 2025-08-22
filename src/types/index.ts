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
  memory?: Map<any, any>
  timestamp?: number
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

export interface ErrorContext {
  timestamp: number
  module: string
  function: string
  sessionId?: string
  additionalData?: Record<string, unknown>
  severity?: 'low' | 'medium' | 'high' | 'critical'
  cycle?: number
  adaptation_id?: string
  algorithm?: string
  target?: string
}

export interface StatisticalResults {
  significance: number
  pValue: number
  confidenceInterval: [number, number]
  effect_size?: number
  statistical_power?: number
}

export interface ThroughputMetric {
  timestamp: number
  value: number
  agents_per_second?: number
  messages_per_second?: number
  operations_per_second?: number
  peak_throughput?: number
}

export interface LatencyMetric {
  timestamp: number
  value: number
  average_latency_ms?: number
  p95_latency_ms?: number
  p99_latency_ms?: number
  max_latency_ms?: number
}

export interface CacheConfig {
  maxSize: number
  defaultTTL: number
  evictionPolicy: 'lru' | 'lfu' | 'fifo'
  cleanupInterval: number
}

export interface BatchItem<T> {
  id: string
  data: T
  priority?: number
  timestamp?: number
}