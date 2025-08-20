import { EventEmitter } from 'eventemitter3';
import { Vector3 } from 'three';
import { Agent } from '../types';
export interface Task {
    id: string;
    description: string;
    priority: number;
    dependencies: string[];
    estimatedDuration: number;
    requiredAgents: number;
    position?: Vector3;
    constraints: TaskConstraint[];
    quantumState: QuantumTaskState;
}
export interface TaskConstraint {
    type: 'time' | 'resource' | 'dependency' | 'spatial';
    value: any;
    weight: number;
}
export interface QuantumTaskState {
    superposition: Map<string, number>;
    entangled: string[];
    coherence: number;
    interference: number;
}
export interface PlanningNode {
    taskId: string;
    state: string;
    probability: number;
    energy: number;
    neighbors: string[];
}
export interface QuantumPlanningConfig {
    annealingSteps: number;
    initialTemperature: number;
    coolingRate: number;
    coherenceThreshold: number;
    maxSuperpositionStates: number;
}
export declare class QuantumInspiredPlanner extends EventEmitter {
    private tasks;
    private agents;
    private planningGraph;
    private config;
    private temperature;
    private currentStep;
    constructor(config?: Partial<QuantumPlanningConfig>);
    planTasks(tasks: Task[], agents: Agent[]): Promise<Map<string, string[]>>;
    private initializeQuantumState;
    private buildPlanningGraph;
    private createQuantumEntanglement;
    private applyQuantumInterference;
    private calculateTaskPhase;
    private quantumAnnealing;
    private quantumTunnel;
    private selectTaskByCoherence;
    private selectAgentsByQuantumProbability;
    private weightedRandomSelect;
    private weightedRandomSelectIndex;
    private calculateStateEnergy;
    private calculateSystemEnergy;
    private calculateEntanglementEnergy;
    private hasTemporalConflict;
    private generateRandomAssignment;
    private updateQuantumStates;
    private applyDecoherence;
    private collapseQuantumState;
    private normalizeQuantumAmplitudes;
    private evaluateConstraintViolation;
    private areDependenciesMet;
    private calculatePlanningMetrics;
    getQuantumStateVisualization(): any;
}
