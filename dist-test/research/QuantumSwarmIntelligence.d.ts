import { EventEmitter } from 'eventemitter3';
import type { Agent } from '../types';
/**
 * Quantum Swarm Intelligence - Revolutionary Multi-Agent Coordination
 * Applies quantum computing principles to achieve unprecedented swarm coordination
 */
export interface QuantumSwarmState {
    id: string;
    agent_superpositions: Map<string, AgentSuperposition>;
    entanglement_network: EntanglementNetwork;
    coherence_level: number;
    quantum_advantage_factor: number;
    measurement_outcomes: MeasurementOutcome[];
    temporal_evolution: TemporalEvolution;
}
export interface AgentSuperposition {
    agent_id: string;
    position_states: PositionState[];
    action_states: ActionState[];
    probability_amplitudes: Complex[];
    coherence_time: number;
    decoherence_rate: number;
    entangled_with: string[];
}
export interface PositionState {
    position: {
        x: number;
        y: number;
        z: number;
    };
    probability: number;
    momentum: {
        x: number;
        y: number;
        z: number;
    };
    phase: number;
}
export interface ActionState {
    action: string;
    parameters: Record<string, any>;
    probability: number;
    utility_expectation: number;
    phase: number;
}
export interface EntanglementNetwork {
    pairs: EntanglementPair[];
    clusters: QuantumCluster[];
    entanglement_strength: number;
    network_coherence: number;
    information_flow_rate: number;
}
export interface EntanglementPair {
    agent_a: string;
    agent_b: string;
    entanglement_strength: number;
    correlation_type: 'position' | 'momentum' | 'action' | 'mixed';
    bell_state: BellState;
    last_measurement: number;
}
export interface QuantumCluster {
    id: string;
    member_agents: string[];
    collective_state: CollectiveQuantumState;
    cluster_coherence: number;
    emergent_properties: EmergentProperty[];
}
export interface CollectiveQuantumState {
    total_entanglement: number;
    coherent_superposition: boolean;
    collective_phase: number;
    shared_information: SharedQuantumInformation;
}
export interface MeasurementOutcome {
    timestamp: number;
    measured_agents: string[];
    measurement_basis: string;
    outcomes: Record<string, any>;
    state_collapse: StateCollapse;
    information_gain: number;
}
export interface StateCollapse {
    collapsed_agents: string[];
    new_classical_states: Record<string, any>;
    preserved_entanglements: string[];
    coherence_loss: number;
}
export interface TemporalEvolution {
    time_step: number;
    evolution_operator: QuantumOperator;
    hamiltonian: SystemHamiltonian;
    evolution_coherence: number;
    quantum_speedup: number;
}
export interface QuantumAdvantage {
    classical_benchmark: number;
    quantum_performance: number;
    advantage_factor: number;
    confidence_interval: [number, number];
    statistical_significance: number;
}
export declare class QuantumSwarmIntelligence extends EventEmitter {
    private quantumState;
    private quantumProcessor;
    private entanglementManager;
    private coherenceController;
    private quantumGates;
    private classicalAgents;
    private quantumCircuit;
    private evolutionHistory;
    private isQuantumActive;
    constructor(initialAgents?: Agent[]);
    /**
     * Initialize quantum superposition state for all agents
     */
    private initializeQuantumState;
    /**
     * Create quantum superposition state for an individual agent
     */
    private createAgentSuperposition;
    /**
     * Generate position superposition states for spatial quantum coordination
     */
    private generatePositionSuperposition;
    /**
     * Generate action superposition states for behavioral quantum coordination
     */
    private generateActionSuperposition;
    /**
     * Create quantum entanglement between agents for coordinated behavior
     */
    entangleAgents(agentIds: string[], entanglementType?: 'position' | 'momentum' | 'action' | 'mixed'): Promise<void>;
    /**
     * Perform quantum measurement and collapse superposition
     */
    measureQuantumState(agentIds: string[], measurementBasis?: string): Promise<MeasurementOutcome>;
    /**
     * Evolve quantum state according to Schrödinger equation
     */
    evolveQuantumState(timeStep?: number): Promise<void>;
    /**
     * Calculate quantum advantage over classical algorithms
     */
    calculateQuantumAdvantage(classicalBenchmark: number, tasks: any[]): Promise<QuantumAdvantage>;
    /**
     * Start quantum swarm intelligence processing
     */
    startQuantumProcessing(): Promise<void>;
    /**
     * Stop quantum processing and return to classical mode
     */
    stopQuantumProcessing(): void;
    private calculateQuantumDimension;
    private setupQuantumGates;
    private createEvolutionOperator;
    private createSystemHamiltonian;
    private calculateProbabilityAmplitudes;
    private calculateQuantumMomentum;
    private getPossibleActions;
    private calculateActionUtility;
    private softmax;
    private generateBellState;
    private createQuantumCluster;
    private adjustAmplitudesForEntanglement;
    private performSingleAgentMeasurement;
    private collapseAgentSuperposition;
    private handleEntanglementCollapse;
    private calculateInformationGain;
    private evolveAgentSuperposition;
    private evolveEntanglementNetwork;
    private updateSystemCoherence;
    private calculateQuantumSpeedup;
    private resetQuantumState;
    private runQuantumAlgorithm;
    private evaluateQuantumPerformance;
    private calculatePValue;
    private manageDecoherence;
    private maintainEntanglement;
    private performQuantumErrorCorrection;
    dispose(): void;
}
declare class Complex {
    real: number;
    imaginary: number;
    constructor(real: number, imaginary: number);
}
declare class QuantumOperator {
    type: string;
    constructor(type: string);
}
declare class SystemHamiltonian {
    agents: Agent[];
    constructor(agents: Agent[]);
}
declare class BellState {
    state: string;
    constructor(state: string);
}
declare class SharedQuantumInformation {
    constructor();
}
interface EmergentProperty {
    name: string;
    value: any;
}
export {};
