import { EventEmitter } from 'eventemitter3';
import { Vector3 } from 'three';
import { Task } from './QuantumInspiredPlanner';
export interface InterferencePattern {
    id: string;
    type: 'constructive' | 'destructive' | 'mixed';
    strength: number;
    frequency: number;
    phase: number;
    spatialRange: number;
    temporalRange: number;
}
export interface TaskWave {
    taskId: string;
    amplitude: number;
    frequency: number;
    phase: number;
    position: Vector3;
    velocity: Vector3;
    wavelength: number;
    damping: number;
}
export interface InterferenceResult {
    taskId: string;
    originalPriority: number;
    modifiedPriority: number;
    interferenceContribution: number;
    dominantPatterns: string[];
    phaseShift: number;
}
export interface WaveInteraction {
    wave1Id: string;
    wave2Id: string;
    interactionType: 'constructive' | 'destructive' | 'resonance' | 'beating';
    amplitude: number;
    resultantFrequency: number;
    coherenceLength: number;
}
export declare class QuantumInterferenceEngine extends EventEmitter {
    private taskWaves;
    private interferencePatterns;
    private waveInteractions;
    private spatialGrid;
    private timeStep;
    private gridResolution;
    constructor(gridResolution?: number);
    createTaskWaves(tasks: Task[]): void;
    calculateInterference(tasks: Task[]): InterferenceResult[];
    createInterferencePattern(type: 'constructive' | 'destructive' | 'mixed', center: Vector3, strength?: number, frequency?: number, spatialRange?: number, temporalRange?: number): string;
    propagateWaves(deltaTime: number): void;
    applyQuantumResonance(taskId1: string, taskId2: string, resonanceStrength?: number): void;
    createStandingWave(taskId1: string, taskId2: string, nodePositions: Vector3[]): string;
    calculateQuantumBeating(taskId1: string, taskId2: string): number;
    getInterferenceVisualization(): any;
    private convertTaskToWave;
    private findNearbyWaves;
    private calculateSuperposition;
    private applyInterferencePatterns;
    private calculatePatternInfluence;
    private calculatePriorityModification;
    private addToSpatialGrid;
    private updateSpatialGrid;
    private getGridKey;
    private updateWaveInteractions;
    private calculateWaveInteraction;
    private calculateCoherenceLength;
    private initializeInterferencePatterns;
    private startWaveEvolution;
}
