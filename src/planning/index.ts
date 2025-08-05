// Quantum-Inspired Task Planning System
// Export all quantum planning components

import type { Task } from './QuantumInspiredPlanner'
import type { QuantumPlanningConfig, QuantumTaskResult, QuantumPlanningMetrics } from './QuantumPlanningIntegration'
import type { InterferencePattern } from './QuantumInterferenceEngine'
import type { QuantumOptimizationConfig } from './QuantumPerformanceOptimizer'
import { QuantumPlanningIntegration } from './QuantumPlanningIntegration'
import { QuantumPerformanceOptimizer } from './QuantumPerformanceOptimizer'
import { QuantumErrorHandler } from './QuantumErrorHandler'
import { QuantumMonitor } from './QuantumMonitor'
import { QuantumSecurityManager } from './QuantumSecurityManager'
import { QuantumValidator } from './QuantumValidator'

// Core Quantum Planning
export { QuantumInspiredPlanner } from './QuantumInspiredPlanner'
export type { Task, TaskConstraint, QuantumTaskState } from './QuantumInspiredPlanner'
export { QuantumPlanningIntegration } from './QuantumPlanningIntegration'
export type { QuantumPlanningConfig, QuantumTaskResult, QuantumPlanningMetrics } from './QuantumPlanningIntegration'

// Quantum State Management
export { QuantumSuperpositionManager } from './QuantumSuperpositionManager'
export type { 
  SuperpositionState, 
  QuantumSystem, 
  QuantumMeasurement, 
  EntanglementPair 
} from './QuantumSuperpositionManager'

// Quantum Optimization
export { QuantumAnnealingOptimizer } from './QuantumAnnealingOptimizer'
export type { 
  AnnealingConfig, 
  OptimizationState, 
  QuantumMove, 
  AnnealingResult 
} from './QuantumAnnealingOptimizer'

// Quantum Interference
export { QuantumInterferenceEngine } from './QuantumInterferenceEngine'
export type { 
  InterferencePattern, 
  TaskWave, 
  InterferenceResult, 
  WaveInteraction 
} from './QuantumInterferenceEngine'

// Error Handling and Recovery
export { QuantumErrorHandler } from './QuantumErrorHandler'
export type { 
  QuantumError, 
  QuantumErrorType, 
  QuantumErrorSeverity, 
  QuantumRecoveryStrategy, 
  QuantumErrorMetrics 
} from './QuantumErrorHandler'

// Validation and Security
export { QuantumValidator } from './QuantumValidator'
export type { 
  QuantumValidationError, 
  ValidationResult, 
  QuantumValidationRules 
} from './QuantumValidator'

export { QuantumSecurityManager } from './QuantumSecurityManager'
export type { 
  QuantumSecurityThreat, 
  QuantumSecurityPolicy, 
  QuantumPermission, 
  QuantumSecurityEvent, 
  QuantumAuditLog 
} from './QuantumSecurityManager'

// Monitoring and Health
export { QuantumMonitor } from './QuantumMonitor'
export type { 
  QuantumSystemHealth, 
  QuantumComponentHealth, 
  QuantumMetrics, 
  QuantumAlert, 
  QuantumThresholds 
} from './QuantumMonitor'

// Performance Optimization
export { QuantumPerformanceOptimizer } from './QuantumPerformanceOptimizer'
export type { 
  QuantumComputationCache, 
  QuantumResourcePool, 
  QuantumWorkerTask, 
  QuantumPerformanceMetrics, 
  QuantumOptimizationConfig 
} from './QuantumPerformanceOptimizer'

// Utility functions for quantum planning
export const QuantumPlanningUtils = {
  /**
   * Create a simple quantum task from basic parameters
   */
  createSimpleTask: (
    id: string,
    description: string,
    priority: number,
    requiredAgents: number,
    estimatedDuration: number
  ): Task => {
    return {
      id,
      description,
      priority,
      dependencies: [],
      estimatedDuration,
      requiredAgents,
      constraints: [],
      quantumState: {
        superposition: new Map([
          ['waiting', 0.8],
          ['ready', 0.2]
        ]),
        entangled: [],
        coherence: 1.0,
        interference: 0.0
      }
    }
  },

  /**
   * Calculate quantum entanglement strength between two tasks
   */
  calculateEntanglementStrength: (task1: Task, task2: Task): number => {
    let strength = 0

    // Dependency relationship
    if (task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)) {
      strength += 0.8
    }

    // Priority similarity
    const priorityDiff = Math.abs(task1.priority - task2.priority)
    strength += (10 - priorityDiff) / 10 * 0.3

    // Duration compatibility
    const durationRatio = Math.min(task1.estimatedDuration, task2.estimatedDuration) / 
                         Math.max(task1.estimatedDuration, task2.estimatedDuration)
    strength += durationRatio * 0.2

    // Spatial proximity (if positions exist)
    if (task1.position && task2.position) {
      const distance = task1.position.distanceTo(task2.position)
      const proximityFactor = Math.exp(-distance / 10) // Exponential decay
      strength += proximityFactor * 0.4
    }

    return Math.min(1.0, strength)
  },

  /**
   * Generate quantum interference pattern for task prioritization
   */
  generateInterferencePattern: (
    tasks: Task[],
    patternType: 'constructive' | 'destructive' | 'mixed' = 'mixed'
  ): InterferencePattern => {
    const avgPriority = tasks.reduce((sum, task) => sum + task.priority, 0) / tasks.length
    const frequency = avgPriority * 0.1
    
    return {
      id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: patternType,
      strength: 1.0 + Math.random() * 0.5,
      frequency,
      phase: Math.random() * 2 * Math.PI,
      spatialRange: 5.0 + Math.random() * 5.0,
      temporalRange: 10.0 + Math.random() * 10.0
    }
  },

  /**
   * Validate quantum planning configuration
   */
  validateQuantumConfig: (config: Partial<QuantumPlanningConfig>): boolean => {
    const validator = QuantumValidator.getInstance()
    
    // Basic validation
    if (config.maxQuantumStates && config.maxQuantumStates <= 0) return false
    if (config.coherenceThreshold && (config.coherenceThreshold < 0 || config.coherenceThreshold > 1)) return false
    if (config.interferenceRange && config.interferenceRange <= 0) return false
    
    return true
  },

  /**
   * Calculate quantum planning efficiency score
   */
  calculatePlanningEfficiency: (
    originalPlan: Map<string, string[]>,
    quantumPlan: Map<string, string[]>,
    tasks: Task[]
  ): number => {
    let efficiencyGain = 0
    let totalTasks = tasks.length

    // Compare assignment quality
    tasks.forEach(task => {
      const originalAssignment = originalPlan.get(task.id) || []
      const quantumAssignment = quantumPlan.get(task.id) || []
      
      // Perfect assignment score
      const originalScore = Math.abs(originalAssignment.length - task.requiredAgents)
      const quantumScore = Math.abs(quantumAssignment.length - task.requiredAgents)
      
      if (quantumScore < originalScore) {
        efficiencyGain += (originalScore - quantumScore) / Math.max(1, originalScore)
      }
    })

    return totalTasks > 0 ? efficiencyGain / totalTasks : 0
  },

  /**
   * Generate quantum planning report
   */
  generatePlanningReport: (
    results: Map<string, QuantumTaskResult>,
    metrics: QuantumPlanningMetrics
  ): string => {
    const totalTasks = results.size
    const enhancedTasks = Array.from(results.values())
      .filter(result => result.quantumPriority !== result.originalPriority).length
    
    const avgCoherence = Array.from(results.values())
      .reduce((sum, result) => sum + result.coherenceLevel, 0) / totalTasks
    
    const avgExecutionProbability = Array.from(results.values())
      .reduce((sum, result) => sum + result.executionProbability, 0) / totalTasks

    return `
# Quantum Planning Report

## Overview
- **Total Tasks**: ${totalTasks}
- **Quantum Enhanced**: ${enhancedTasks} (${((enhancedTasks / totalTasks) * 100).toFixed(1)}%)
- **Average Coherence**: ${avgCoherence.toFixed(3)}
- **Average Execution Probability**: ${avgExecutionProbability.toFixed(3)}

## Performance Metrics
- **Planning Time**: ${metrics.planningTime}ms
- **Optimization Gain**: ${(metrics.optimizationGain * 100).toFixed(1)}%
- **Interference Events**: ${metrics.interferenceEvents}
- **Annealing Convergence**: ${(metrics.annealingConvergence * 100).toFixed(1)}%

## Quantum Effects
- **Entangled Tasks**: ${metrics.quantumEnhancedTasks}
- **Entanglement Ratio**: ${((metrics.quantumEnhancedTasks / metrics.totalTasks) * 100).toFixed(1)}%
- **Average Coherence**: ${metrics.averageCoherence.toFixed(3)}

## Task Distribution
${Array.from(results.values())
  .sort((a, b) => b.quantumPriority - a.quantumPriority)
  .slice(0, 10)
  .map(result => `- **${result.taskId}**: Priority ${result.originalPriority} → ${result.quantumPriority.toFixed(2)} (${result.assignedAgents.length} agents)`)
  .join('\n')}
    `.trim()
  }
}

// Factory function for creating integrated quantum planning system
export function createQuantumPlanningSystem(
  agentMeshXR: any, // AgentMeshXR instance
  config: Partial<QuantumPlanningConfig> = {}
): QuantumPlanningIntegration {
  return new QuantumPlanningIntegration(agentMeshXR, config)
}

// Factory function for creating quantum performance optimizer
export function createQuantumOptimizer(
  config: Partial<QuantumOptimizationConfig> = {}
): QuantumPerformanceOptimizer {
  return new QuantumPerformanceOptimizer(config)
}

// Factory function for creating quantum monitoring system
export function createQuantumMonitor(): {
  errorHandler: QuantumErrorHandler
  monitor: QuantumMonitor
  security: QuantumSecurityManager
  validator: QuantumValidator
} {
  const errorHandler = new QuantumErrorHandler()
  const monitor = new QuantumMonitor(errorHandler)
  const security = QuantumSecurityManager.getInstance()
  const validator = QuantumValidator.getInstance()

  return {
    errorHandler,
    monitor,
    security,
    validator
  }
}

// Types are already exported above via the main export statements