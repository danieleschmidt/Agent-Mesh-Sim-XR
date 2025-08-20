import { EventEmitter } from 'eventemitter3';
import { Vector3 } from 'three';
export interface SuperpositionState {
    id: string;
    amplitude: number;
    phase: number;
    probability: number;
    energy: number;
}
export interface QuantumSystem {
    id: string;
    states: Map<string, SuperpositionState>;
    entangled: string[];
    coherenceTime: number;
    decoherenceRate: number;
    lastMeasurement: number;
}
export interface QuantumMeasurement {
    systemId: string;
    collapsedState: string;
    probability: number;
    timestamp: number;
    measurementType: 'observation' | 'interaction' | 'decoherence';
}
export interface EntanglementPair {
    system1: string;
    system2: string;
    correlation: number;
    strength: number;
    type: 'spatial' | 'temporal' | 'functional';
}
export declare class QuantumSuperpositionManager extends EventEmitter {
    private systems;
    private entanglements;
    private measurements;
    private globalCoherence;
    private timeStep;
    constructor();
    createQuantumSystem(id: string, initialStates: Array<{
        state: string;
        amplitude: number;
        phase?: number;
    }>): void;
    applyQuantumGate(systemId: string, gateType: 'hadamard' | 'pauli-x' | 'pauli-y' | 'pauli-z' | 'phase' | 'rotation', parameters?: {
        angle?: number;
        axis?: Vector3;
    }): void;
    entangleSystems(system1Id: string, system2Id: string, type?: 'spatial' | 'temporal' | 'functional', strength?: number): void;
    measureSystem(systemId: string, measurementType?: 'observation' | 'interaction' | 'decoherence'): QuantumMeasurement;
    applyInterference(systemId: string, interferenceType?: 'constructive' | 'destructive' | 'mixed'): void;
    getSystemState(systemId: string): QuantumSystem | null;
    getSystemEntanglements(systemId: string): EntanglementPair[];
    calculateSystemCoherence(system: QuantumSystem): number;
    getMeasurementHistory(systemId?: string): QuantumMeasurement[];
    private applyHadamardGate;
    private applyPauliXGate;
    private applyPauliYGate;
    private applyPauliZGate;
    private applyPhaseGate;
    private applyRotationGate;
    private calculateStateEnergy;
    private calculateStateCorrelation;
    private applyEntanglementEffects;
    private propagateCollapse;
    private normalizeSystem;
    private applyDecoherence;
    private startQuantumEvolution;
    private evolveQuantumSystems;
    private updateGlobalCoherence;
    getGlobalQuantumState(): any;
}
