import type { Task } from './QuantumInspiredPlanner';
import type { QuantumPlanningConfig, QuantumTaskResult, QuantumPlanningMetrics } from './QuantumPlanningIntegration';
import type { InterferencePattern } from './QuantumInterferenceEngine';
import type { QuantumOptimizationConfig } from './QuantumPerformanceOptimizer';
import { QuantumPlanningIntegration } from './QuantumPlanningIntegration';
import { QuantumPerformanceOptimizer } from './QuantumPerformanceOptimizer';
import { QuantumErrorHandler } from './QuantumErrorHandler';
import { QuantumMonitor } from './QuantumMonitor';
import { QuantumSecurityManager } from './QuantumSecurityManager';
import { QuantumValidator } from './QuantumValidator';
export { QuantumInspiredPlanner } from './QuantumInspiredPlanner';
export type { Task, TaskConstraint, QuantumTaskState } from './QuantumInspiredPlanner';
export { QuantumPlanningIntegration } from './QuantumPlanningIntegration';
export type { QuantumPlanningConfig, QuantumTaskResult, QuantumPlanningMetrics } from './QuantumPlanningIntegration';
export { QuantumSuperpositionManager } from './QuantumSuperpositionManager';
export type { SuperpositionState, QuantumSystem, QuantumMeasurement, EntanglementPair } from './QuantumSuperpositionManager';
export { QuantumAnnealingOptimizer } from './QuantumAnnealingOptimizer';
export type { AnnealingConfig, OptimizationState, QuantumMove, AnnealingResult } from './QuantumAnnealingOptimizer';
export { QuantumInterferenceEngine } from './QuantumInterferenceEngine';
export type { InterferencePattern, TaskWave, InterferenceResult, WaveInteraction } from './QuantumInterferenceEngine';
export { QuantumErrorHandler } from './QuantumErrorHandler';
export type { QuantumError, QuantumErrorType, QuantumErrorSeverity, QuantumRecoveryStrategy, QuantumErrorMetrics } from './QuantumErrorHandler';
export { QuantumValidator } from './QuantumValidator';
export type { QuantumValidationError, ValidationResult, QuantumValidationRules } from './QuantumValidator';
export { QuantumSecurityManager } from './QuantumSecurityManager';
export type { QuantumSecurityThreat, QuantumSecurityPolicy, QuantumPermission, QuantumSecurityEvent, QuantumAuditLog } from './QuantumSecurityManager';
export { QuantumMonitor } from './QuantumMonitor';
export type { QuantumSystemHealth, QuantumComponentHealth, QuantumMetrics, QuantumAlert, QuantumThresholds } from './QuantumMonitor';
export { QuantumPerformanceOptimizer } from './QuantumPerformanceOptimizer';
export type { QuantumComputationCache, QuantumResourcePool, QuantumWorkerTask, QuantumPerformanceMetrics, QuantumOptimizationConfig } from './QuantumPerformanceOptimizer';
export declare const QuantumPlanningUtils: {
    /**
     * Create a simple quantum task from basic parameters
     */
    createSimpleTask: (id: string, description: string, priority: number, requiredAgents: number, estimatedDuration: number) => Task;
    /**
     * Calculate quantum entanglement strength between two tasks
     */
    calculateEntanglementStrength: (task1: Task, task2: Task) => number;
    /**
     * Generate quantum interference pattern for task prioritization
     */
    generateInterferencePattern: (tasks: Task[], patternType?: "constructive" | "destructive" | "mixed") => InterferencePattern;
    /**
     * Validate quantum planning configuration
     */
    validateQuantumConfig: (config: Partial<QuantumPlanningConfig>) => boolean;
    /**
     * Calculate quantum planning efficiency score
     */
    calculatePlanningEfficiency: (originalPlan: Map<string, string[]>, quantumPlan: Map<string, string[]>, tasks: Task[]) => number;
    /**
     * Generate quantum planning report
     */
    generatePlanningReport: (results: Map<string, QuantumTaskResult>, metrics: QuantumPlanningMetrics) => string;
};
export declare function createQuantumPlanningSystem(agentMeshXR: any, // AgentMeshXR instance
config?: Partial<QuantumPlanningConfig>): QuantumPlanningIntegration;
export declare function createQuantumOptimizer(config?: Partial<QuantumOptimizationConfig>): QuantumPerformanceOptimizer;
export declare function createQuantumMonitor(): {
    errorHandler: QuantumErrorHandler;
    monitor: QuantumMonitor;
    security: QuantumSecurityManager;
    validator: QuantumValidator;
};
