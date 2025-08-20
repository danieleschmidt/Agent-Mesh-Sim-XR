import { EventEmitter } from 'eventemitter3';
/**
 * Quantum Performance Booster - Quantum Computing Integration for Ultra Performance
 * Leverages quantum algorithms for exponential performance gains in specific domains
 */
export interface QuantumBoostConfig {
    quantum_backend: 'simulator' | 'real_hardware' | 'hybrid';
    max_qubits: number;
    quantum_algorithms: QuantumAlgorithmConfig[];
    error_correction: boolean;
    noise_mitigation: boolean;
    quantum_advantage_threshold: number;
    classical_fallback: boolean;
}
export interface QuantumAlgorithmConfig {
    algorithm_name: string;
    problem_domain: string;
    qubit_requirement: number;
    quantum_speedup_factor: number;
    success_probability: number;
    error_tolerance: number;
    use_cases: string[];
}
export interface QuantumPerformanceGain {
    algorithm: string;
    problem_size: number;
    classical_time_ms: number;
    quantum_time_ms: number;
    speedup_factor: number;
    confidence_level: number;
    quantum_advantage: boolean;
    resource_efficiency: number;
}
export interface QuantumComputationTask {
    task_id: string;
    algorithm_type: string;
    input_data: any;
    qubit_requirements: number;
    circuit_depth: number;
    error_budget: number;
    priority: number;
    deadline: number;
}
export interface QuantumCircuit {
    circuit_id: string;
    gates: QuantumGate[];
    qubit_count: number;
    depth: number;
    fidelity: number;
    execution_time_estimate: number;
}
export interface QuantumGate {
    gate_type: string;
    target_qubits: number[];
    control_qubits: number[];
    parameters: number[];
    error_rate: number;
}
export interface QuantumExecutionResult {
    task_id: string;
    circuit_id: string;
    measurement_results: number[];
    probability_distribution: Map<string, number>;
    quantum_state_fidelity: number;
    execution_time_ms: number;
    error_count: number;
    success: boolean;
}
export interface QuantumOptimizationProblem {
    problem_id: string;
    problem_type: 'optimization' | 'search' | 'simulation' | 'machine_learning';
    objective_function: string;
    constraints: Constraint[];
    search_space_size: number;
    classical_complexity: string;
    quantum_complexity: string;
}
export declare class QuantumPerformanceBooster extends EventEmitter {
    private config;
    private quantumProcessor;
    private algorithmLibrary;
    private errorCorrection;
    private noiseMitigator;
    private classicalFallback;
    private quantumTasks;
    private activeCircuits;
    private performanceMetrics;
    private isQuantumActive;
    constructor(config: QuantumBoostConfig);
    /**
     * Accelerate computation using quantum algorithms with exponential speedup
     */
    accelerateWithQuantum(problem: QuantumOptimizationProblem, inputData: any): Promise<QuantumAccelerationResult>;
    /**
     * Solve optimization problems using quantum annealing
     */
    solveOptimizationWithQuantumAnnealing(problem: OptimizationProblem, parameters: AnnealingParameters): Promise<QuantumAnnealingResult>;
    /**
     * Perform quantum machine learning for pattern recognition
     */
    executeQuantumMachineLearning(trainingData: MLTrainingData, algorithm: QuantumMLAlgorithm): Promise<QuantumMLResult>;
    /**
     * Simulate quantum systems for scientific computation
     */
    simulateQuantumSystem(system: QuantumSystemDescription, simulationParameters: SimulationParameters): Promise<QuantumSimulationResult>;
    /**
     * Generate comprehensive quantum performance report
     */
    generateQuantumPerformanceReport(): QuantumPerformanceReport;
    private initializeQuantumAlgorithms;
    private analyzeQuantumAdvantage;
    private selectOptimalQuantumAlgorithm;
    private prepareQuantumComputation;
    private compileOptimizedQuantumCircuit;
    private executeClassicalFallback;
    private applyQuantumErrorCorrection;
    private executeQuantumCircuit;
    private postProcessQuantumResults;
    private validateQuantumPerformance;
    private updatePerformanceMetrics;
    private formulateAsQUBO;
    private mapToAnnealerTopology;
    private createOptimalAnnealingSchedule;
    private executeMultipleAnnealingRuns;
    private analyzeAnnealingResults;
    private applyClassicalPostProcessing;
    private calculateAnnealingAdvantage;
    private encodeDataToQuantumStates;
    private createQuantumFeatureMap;
    private initializeParameterizedQuantumCircuit;
    private executeVariationalQuantumTraining;
    private validateQuantumModel;
    private prepareHamiltonianEvolution;
    private prepareInitialQuantumState;
    private executeTimeEvolutionSimulation;
    private measureQuantumObservables;
    private calculatePhysicalProperties;
    private calculateSimulationSpeedup;
    private parseComplexity;
    private calculateProblemSizeThreshold;
    private recommendQuantumAlgorithm;
    private analyzeQuantumAdvantageAchieved;
    private analyzeAlgorithmEfficiency;
    private calculateSuccessRate;
    private getMaximumSpeedupAchieved;
    private calculateQuantumResourceUtilization;
    private generateQuantumOptimizationRecommendations;
    startQuantumProcessing(): void;
    stopQuantumProcessing(): void;
    dispose(): void;
}
export interface QuantumAccelerationResult {
    success: boolean;
    problem_id: string;
    algorithm_used: string;
    quantum_speedup: number;
    quantum_advantage_achieved: boolean;
    execution_time_ms: number;
    classical_time_estimate: number;
    fidelity: number;
    error_rate: number;
    results: any;
    confidence_level: number;
}
interface Constraint {
    type: string;
    parameters: any;
}
interface OptimizationProblem {
    problem_id: string;
    objective: string;
    variables: any[];
    constraints: Constraint[];
}
interface AnnealingParameters {
    num_runs: number;
    annealing_time: number;
    temperature_schedule: any;
}
interface QuantumAnnealingResult {
    success: boolean;
    problem_id: string;
    optimal_solution: any;
    objective_value: number;
    probability_of_optimality: number;
    annealing_time_ms: number;
    total_runs: number;
    success_rate: number;
    quantum_advantage_factor: number;
}
interface MLTrainingData {
    samples: any[];
    labels: any[];
    features: any[];
    validation_set: any;
}
interface QuantumMLAlgorithm {
    name: string;
    hyperparameters: any;
}
interface QuantumMLResult {
    success: boolean;
    model_id: string;
    algorithm_name: string;
    trained_parameters: any[];
    training_accuracy: number;
    validation_accuracy: number;
    quantum_advantage_factor: number;
    training_time_ms: number;
    circuit_depth: number;
    qubit_count: number;
}
interface QuantumSystemDescription {
    system_id: string;
    system_type: string;
    particle_count: number;
    observables_of_interest: string[];
}
interface SimulationParameters {
    time_steps: number;
    dt: number;
    total_time: number;
}
interface QuantumSimulationResult {
    success: boolean;
    system_id: string;
    simulation_time_steps: number;
    final_state_fidelity: number;
    observable_measurements: any;
    physical_properties: any;
    quantum_speedup_achieved: number;
    computation_time_ms: number;
}
export interface QuantumPerformanceReport {
    timestamp: number;
    quantum_backend: string;
    total_quantum_computations: number;
    successful_computations: number;
    success_rate: number;
    average_quantum_speedup: number;
    maximum_quantum_speedup: number;
    quantum_advantage_instances: number;
    total_time_saved_hours: number;
    algorithm_performance: any;
    error_correction_overhead: number;
    quantum_resource_utilization: number;
    noise_mitigation_effectiveness: number;
    recommendations: string[];
}
export {};
