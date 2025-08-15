// Core System
export { AgentMeshXR } from './core/AgentMeshXR'
export { XRManager } from './core/XRManager'
export { AgentMeshConnector } from './core/AgentMeshConnector'
export { SimpleGPUAccelerator } from './core/SimpleGPUAccelerator'

// Visualization
export { SimpleSwarmVisualizer as SwarmVisualizer } from './visualization/SimpleSwarmVisualizer'

// Debugging & Interaction
export { SpatialInspector } from './interaction/SpatialInspector'
export { CausalTracer } from './debugging/CausalTracer'
export { TimelineVR } from './debugging/TimelineVR'
export { TimeController } from './debugging/TimeController'

// Monitoring & Utils
export { PerformanceMonitor } from './monitoring/PerformanceMonitor'
export { SecurityManager } from './security/SecurityManager'
export { logger } from './utils/Logger'
export { Validator } from './utils/Validator'
export { errorHandler } from './utils/ErrorHandler'

// Type Definitions
export type { 
  AgentMeshXRConfig,
  Agent,
  AgentState,
  XRSessionConfig,
  SwarmVisualizationConfig 
} from './types'