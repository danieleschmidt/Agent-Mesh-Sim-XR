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

// Fallback system types
export interface ResearchResult {
  id: string
  name: string
  description: string
  performance_gain: number
  expected_performance_gain: number
  research_merit: number
  complexity: string
  type: string
  novelty_score: number
  readiness_score: number
  confidence: number
  implementation: string
}

export interface IntelligenceReport {
  improvement_cycles: number
  performance_gains: number[]
  adaptation_success_rate: number
  learning_efficiency: number
  learning_velocity: number
  stability_score: number
  evolution_candidates: number
}

export interface QuantumResult {
  quantum_advantage_active: boolean
  fallback_mode: boolean
  classical_performance: number
}

export interface QuantumAccelerationResult {
  success: boolean
  quantum_advantage_achieved: boolean
  quantum_speedup: number
  classical_result: unknown
  quantum_result: unknown
  fallback_mode: boolean
}

export interface ScaleConfig {
  scaling?: unknown
}

export interface ScaleResult {
  success: boolean
  agents_achieved: number
  scaling_efficiency: number
  performance_impact: number
  fallback_mode: boolean
}

export interface ScaleReport {
  timestamp: number
  target_achievement: number
  scaling_efficiency: number
  current_scale: {
    agent_count: number
    performance_score: number
  }
  fallback_active: boolean
}

export interface QuantumConfig {
  quantum?: unknown
}

export interface QuantumProcessingResult {
  quantum_acceleration: boolean
  classical_fallback: boolean
}

export interface QuantumPerformanceReport {
  timestamp: number
  average_quantum_speedup: number
  quantum_algorithms_active: number
  fallback_mode: boolean
}

export interface ResearchConfig {
  [key: string]: unknown
}

export interface ResearchSystem {
  research: unknown
  intelligence: unknown
  quantum: unknown
  config: ResearchConfig
  fallback_active: boolean
  startIntegratedResearch(agents: Agent[], environment: unknown): Promise<void>
  generateComprehensiveReport(): Promise<unknown>
  analyzeSystemIntegration(): unknown
  identifyPublicationOpportunities(): unknown[]
  suggestFutureResearch(): string[]
  dispose(): void
}

export interface HyperScaleConfig {
  scaling?: unknown
  quantum?: unknown
}

export interface HyperScaleSystem {
  hyperScale: unknown
  quantum: unknown
  config: HyperScaleConfig
  fallback_active: boolean
  scaleToExtremePerformance(targetAgents: number): Promise<unknown>
  generateUltraPerformanceReport(): Promise<unknown>
  calculateCombinedPerformanceScore(): number
  projectUltraScalability(): unknown
  identifyQuantumOpportunities(): unknown[]
  suggestNextGenImprovements(): string[]
  dispose(): void
}