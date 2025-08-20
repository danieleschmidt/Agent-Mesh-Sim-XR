import { EventEmitter } from 'eventemitter3';
import { Vector3 } from 'three';
import { AgentMeshXR } from '../core/AgentMeshXR';
import { Task, TaskConstraint } from './QuantumInspiredPlanner';
import { AnnealingConfig } from './QuantumAnnealingOptimizer';
export interface QuantumPlanningConfig {
    enableSuperposition: boolean;
    enableInterference: boolean;
    enableAnnealing: boolean;
    maxQuantumStates: number;
    coherenceThreshold: number;
    interferenceRange: number;
    annealingConfig: Partial<AnnealingConfig>;
}
export interface QuantumTaskResult {
    taskId: string;
    assignedAgents: string[];
    quantumPriority: number;
    originalPriority: number;
    coherenceLevel: number;
    interferencePatterns: string[];
    executionProbability: number;
    estimatedStartTime: number;
    estimatedCompletionTime: number;
}
export interface QuantumPlanningMetrics {
    totalTasks: number;
    quantumEnhancedTasks: number;
    averageCoherence: number;
    interferenceEvents: number;
    annealingConvergence: number;
    planningTime: number;
    optimizationGain: number;
}
export declare class QuantumPlanningIntegration extends EventEmitter {
    private agentMeshXR;
    private quantumPlanner;
    private superpositionManager;
    private interferenceEngine;
    private annealingOptimizer?;
    private config;
    private activeTasks;
    private planningResults;
    private planningActive;
    constructor(agentMeshXR: AgentMeshXR, config?: Partial<QuantumPlanningConfig>);
    createQuantumTask(taskData: {
        id: string;
        description: string;
        priority: number;
        requiredAgents: number;
        estimatedDuration: number;
        dependencies?: string[];
        position?: Vector3;
        constraints?: TaskConstraint[];
    }): Task;
    planTasks(taskIds: string[], availableAgents?: string[]): Promise<Map<string, QuantumTaskResult>>;
    executeQuantumPlan(planResults: Map<string, QuantumTaskResult>): Promise<void>;
    getQuantumVisualizationData(): any;
    getQuantumMetrics(): QuantumPlanningMetrics;
    evolveQuantumStates(deltaTime: number): void;
    private initializeQuantumComponents;
    private setupEventListeners;
    private createTaskSuperposition;
    private addTaskToInterference;
    private applyInterferenceResults;
    private calculateExecutionProbability;
    private calculateStartTime;
    private calculateCompletionTime;
    private calculateAgentAvailability;
    private calculateAgentEfficiency;
    private updateQuantumStatesFromPlanning;
    private calculatePlanningMetrics;
    private calculateOptimizationGain;
    private executeQuantumTask;
    private calculatePlanningEnergy;
    private generatePlanningNeighbors;
    private startQuantumEvolution;
    private onAgentAdded;
    private onAgentUpdated;
    private onAgentRemoved;
    private onQuantumMeasurement;
    private onInterferenceCalculated;
    private handleAgentError;
    private handleAgentRemoval;
    dispose(): void;
}
