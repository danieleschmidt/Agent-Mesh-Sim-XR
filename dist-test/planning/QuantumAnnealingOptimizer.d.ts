import { EventEmitter } from 'eventemitter3';
import { Task } from './QuantumInspiredPlanner';
export interface AnnealingConfig {
    initialTemperature: number;
    finalTemperature: number;
    coolingSchedule: 'linear' | 'exponential' | 'logarithmic' | 'adaptive';
    maxIterations: number;
    convergenceThreshold: number;
    quantumTunnelingProbability: number;
    parallelChains: number;
}
export interface OptimizationState {
    solution: Map<string, any>;
    energy: number;
    temperature: number;
    iteration: number;
    accepted: boolean;
    tunneled: boolean;
}
export interface QuantumMove {
    type: 'classical' | 'tunneling' | 'superposition';
    changes: Map<string, any>;
    energyDelta: number;
    probability: number;
}
export interface AnnealingResult {
    bestSolution: Map<string, any>;
    bestEnergy: number;
    convergenceIteration: number;
    finalTemperature: number;
    quantumEffects: {
        tunnelingEvents: number;
        superpositionCollapses: number;
        coherentTransitions: number;
    };
    energyTrace: number[];
    temperatureTrace: number[];
}
export declare class QuantumAnnealingOptimizer extends EventEmitter {
    private config;
    private currentState;
    private bestState;
    private energyFunction;
    private neighborFunction;
    private quantumEffects;
    constructor(config: Partial<AnnealingConfig>, energyFunction: (solution: Map<string, any>) => number, neighborFunction: (solution: Map<string, any>) => Map<string, any>[]);
    optimize(initialSolution: Map<string, any>): Promise<AnnealingResult>;
    private runAnnealingChain;
    private generateQuantumMove;
    private generateClassicalMove;
    private generateTunnelingMove;
    private generateSuperpositionMove;
    private generateExtendedNeighborhood;
    private calculateQuantumAcceptanceProbability;
    private calculateTemperature;
    private applyMove;
    private calculateChanges;
    private weightedRandomSelect;
    private solutionEquals;
    private adaptCoolingRate;
    private calculateRecentAcceptanceRate;
    private initializeState;
    getOptimizationStats(): any;
    optimizeTaskSchedule(tasks: Task[], agents: string[], constraints: any[]): Promise<Map<string, string[]>>;
}
