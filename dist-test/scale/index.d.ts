export { HyperScaleEngine } from './HyperScaleEngine';
export type { HyperScaleConfig, PerformanceTargets, ResourceLimits, AutoScalingPolicy, OptimizationStrategy, ScalingMetrics, PerformanceBottleneck, ComputeNode, NodeCapabilities, ScalingResult, HyperScaleReport } from './HyperScaleEngine';
export { QuantumPerformanceBooster } from './QuantumPerformanceBooster';
export type { QuantumBoostConfig, QuantumAlgorithmConfig, QuantumPerformanceGain, QuantumComputationTask, QuantumCircuit, QuantumExecutionResult, QuantumAccelerationResult, QuantumPerformanceReport } from './QuantumPerformanceBooster';
export declare const ScalingUtils: {
    /**
     * Calculate optimal scaling configuration for target performance
     */
    calculateOptimalScalingConfig: (targetAgents: number, performanceRequirements: PerformanceTargets) => HyperScaleConfig;
    /**
     * Design quantum acceleration configuration
     */
    createQuantumAccelerationConfig: (computationalComplexity: "low" | "medium" | "high" | "extreme", problemDomains: string[]) => QuantumBoostConfig;
    /**
     * Calculate theoretical performance limits and scaling boundaries
     */
    calculateScalingLimits: (currentConfig: HyperScaleConfig, hardwareConstraints: HardwareConstraints) => ScalingLimits;
    /**
     * Optimize resource allocation across compute nodes
     */
    optimizeResourceAllocation: (nodes: ComputeNode[], workload: WorkloadRequirements) => ResourceAllocationPlan;
    /**
     * Generate performance benchmarking suite for scaling validation
     */
    createScalingBenchmarkSuite: (maxAgents: number, performanceTargets: PerformanceTargets) => BenchmarkSuite;
};
export declare function createHyperScaleSystem(config?: HyperScaleSystemConfig): IntegratedHyperScaleSystem;
export interface HyperScaleSystemConfig {
    scaling?: HyperScaleConfig;
    quantum?: QuantumBoostConfig;
}
export interface ScalingLimits {
    theoretical_max_agents: number;
    practical_max_agents: number;
    recommended_max_agents: number;
    max_sustainable_fps: number;
    min_achievable_latency_ms: number;
    bottleneck_analysis: {
        primary_bottleneck: string;
        scaling_recommendations: string[];
    };
    quantum_advantage_domains: string[];
    estimated_scaling_cost: ScalingCost;
}
export interface HardwareConstraints {
    total_cpu_cores: number;
    total_memory_gb: number;
    total_gpu_memory_gb: number;
    network_bandwidth_gbps: number;
    network_latency_ms: number;
}
export interface ScalingCost {
    monthly_compute_cost: number;
    monthly_memory_cost: number;
    monthly_gpu_cost: number;
    monthly_network_cost: number;
    total_monthly_cost: number;
    cost_per_agent_per_month: number;
}
export interface WorkloadRequirements {
    agent_count: number;
    performance_requirements: PerformanceRequirements;
}
export interface PerformanceRequirements {
    min_fps: number;
    max_latency_ms: number;
    min_throughput: number;
    quality_level: 'low' | 'medium' | 'high' | 'ultra';
}
export interface ResourceAllocationPlan {
    total_nodes_used: number;
    total_agents_allocated: number;
    allocation_efficiency: number;
    expected_performance: number;
    cost_estimate: number;
    node_allocations: NodeAllocation[];
    scaling_headroom: number;
}
export interface NodeAllocation {
    node_id: string;
    allocated_agents: number;
    cpu_allocation: number;
    memory_allocation: number;
    gpu_allocation: number;
    expected_performance: number;
    resource_utilization: number;
}
export interface BenchmarkSuite {
    suite_name: string;
    total_scenarios: number;
    estimated_duration_hours: number;
    scenarios: BenchmarkScenario[];
    hardware_requirements: any;
    success_thresholds: any;
}
export interface BenchmarkScenario {
    name: string;
    description: string;
    agent_counts: number[];
    duration_ms: number;
    metrics_to_measure: string[];
    success_criteria: any;
}
export interface IntegratedHyperScaleSystem {
    hyperScale: HyperScaleEngine;
    quantum: QuantumPerformanceBooster;
    config: HyperScaleSystemConfig;
    scaleToExtremePerformance(targetAgents: number): Promise<ExtremeScalingResult>;
    generateUltraPerformanceReport(): Promise<UltraPerformanceReport>;
    calculateCombinedPerformanceScore(hyperScale: HyperScaleReport, quantum: QuantumPerformanceReport): number;
    projectUltraScalability(report: HyperScaleReport): ScalabilityProjection;
    identifyQuantumOpportunities(report: QuantumPerformanceReport): QuantumOpportunity[];
    suggestNextGenImprovements(): string[];
    dispose(): void;
}
export interface ExtremeScalingResult {
    classical_scaling: ScalingResult;
    quantum_acceleration_active: boolean;
    combined_performance_factor: number;
    total_agents_supported: number;
    extreme_performance_achieved: boolean;
}
export interface UltraPerformanceReport {
    timestamp: number;
    hyperscale_report: HyperScaleReport;
    quantum_report: QuantumPerformanceReport;
    combined_performance_score: number;
    scalability_projection: ScalabilityProjection;
    quantum_advantage_opportunities: QuantumOpportunity[];
    next_generation_recommendations: string[];
}
export interface ScalabilityProjection {
    next_milestone_agents: number;
    estimated_timeline_months: number;
    required_infrastructure_upgrades: string[];
    projected_performance_gain: number;
}
export interface QuantumOpportunity {
    domain: string;
    potential_speedup: number;
    readiness: string;
}
import type { HyperScaleConfig, PerformanceTargets, ComputeNode, ScalingResult, HyperScaleReport } from './HyperScaleEngine';
import type { QuantumBoostConfig, QuantumPerformanceReport } from './QuantumPerformanceBooster';
