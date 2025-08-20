import { EventEmitter } from 'eventemitter3';
/**
 * HyperScale Engine - Extreme Performance & Scalability System
 * Handles millions of agents with GPU acceleration and distributed computing
 */
export interface HyperScaleConfig {
    max_agents: number;
    gpu_acceleration: boolean;
    distributed_computing: boolean;
    edge_computing_nodes: string[];
    auto_scaling_policies: AutoScalingPolicy[];
    performance_targets: PerformanceTargets;
    resource_limits: ResourceLimits;
    optimization_strategies: OptimizationStrategy[];
}
export interface PerformanceTargets {
    target_fps: number;
    max_latency_ms: number;
    min_throughput_ops_per_sec: number;
    memory_efficiency_target: number;
    cpu_utilization_target: number;
    gpu_utilization_target: number;
}
export interface ResourceLimits {
    max_memory_gb: number;
    max_cpu_cores: number;
    max_gpu_memory_gb: number;
    max_network_bandwidth_mbps: number;
    max_storage_iops: number;
}
export interface AutoScalingPolicy {
    metric: string;
    threshold_up: number;
    threshold_down: number;
    scale_up_factor: number;
    scale_down_factor: number;
    cooldown_period_ms: number;
    max_instances: number;
    min_instances: number;
}
export interface OptimizationStrategy {
    name: string;
    priority: number;
    conditions: string[];
    actions: OptimizationAction[];
    performance_impact: number;
    resource_cost: number;
}
export interface OptimizationAction {
    action: string;
    parameters: Record<string, any>;
    estimated_improvement: number;
    resource_requirement: number;
}
export interface ScalingMetrics {
    current_agents: number;
    active_compute_nodes: number;
    total_processing_power: number;
    memory_utilization: number;
    network_utilization: number;
    gpu_utilization: number;
    performance_score: number;
    bottlenecks: PerformanceBottleneck[];
}
export interface PerformanceBottleneck {
    component: string;
    bottleneck_type: string;
    severity: number;
    impact_on_performance: number;
    resolution_strategies: string[];
    estimated_resolution_time: number;
}
export interface ComputeNode {
    node_id: string;
    node_type: 'cpu' | 'gpu' | 'edge' | 'quantum';
    capabilities: NodeCapabilities;
    current_load: NodeLoad;
    performance_metrics: NodePerformanceMetrics;
    health_status: 'healthy' | 'degraded' | 'offline';
    assigned_workloads: WorkloadAssignment[];
}
export interface NodeCapabilities {
    cpu_cores: number;
    memory_gb: number;
    gpu_count: number;
    gpu_memory_gb: number;
    network_bandwidth_mbps: number;
    storage_iops: number;
    specialized_units: string[];
}
export interface NodeLoad {
    cpu_utilization: number;
    memory_utilization: number;
    gpu_utilization: number;
    network_utilization: number;
    agent_count: number;
    operations_per_second: number;
}
export interface WorkloadAssignment {
    workload_id: string;
    workload_type: string;
    agent_ids: string[];
    resource_allocation: ResourceAllocation;
    performance_requirements: PerformanceRequirements;
    priority: number;
}
export interface ResourceAllocation {
    cpu_cores: number;
    memory_gb: number;
    gpu_memory_gb: number;
    network_bandwidth_mbps: number;
}
export interface PerformanceRequirements {
    min_fps: number;
    max_latency_ms: number;
    min_throughput: number;
    quality_level: 'low' | 'medium' | 'high' | 'ultra';
}
export declare class HyperScaleEngine extends EventEmitter {
    private config;
    private computeNodes;
    private workloadScheduler;
    private performanceOptimizer;
    private autoScaler;
    private gpuAccelerator;
    private distributedCoordinator;
    private edgeOrchestrator;
    private isScaling;
    private performanceHistory;
    constructor(config: HyperScaleConfig);
    /**
     * Scale to handle massive agent populations with optimal performance
     */
    scaleToAgentCount(targetAgentCount: number): Promise<ScalingResult>;
    /**
     * Enable massive GPU parallelization for extreme performance
     */
    private enableMassiveGPUParallelization;
    /**
     * Distribute processing across edge computing nodes
     */
    private activateEdgeComputing;
    /**
     * Apply advanced performance optimizations
     */
    private applyAdvancedOptimizations;
    /**
     * Monitor and maintain extreme performance at scale
     */
    maintainHyperScale(): Promise<void>;
    /**
     * Generate comprehensive scaling performance report
     */
    generateHyperScaleReport(): HyperScaleReport;
    private initializeComputeNodes;
    private setupPerformanceMonitoring;
    private getCurrentAgentCount;
    private analyzeScalingRequirements;
    private planResourceAllocation;
    private scaleComputeInfrastructure;
    private distributeWorkloads;
    private validateScalingSuccess;
    private calculateScalingCostOptimization;
    private isGPUAcceleratable;
    private optimizeMemoryPools;
    private optimizeCPUAffinity;
    private optimizeNetworkTopology;
    private enableIntelligentCaching;
    private optimizeDynamicBatching;
    private enableAdaptiveLoadBalancing;
    private calculateOptimizationImpact;
    private collectComprehensiveMetrics;
    private detectPerformanceBottlenecks;
    private resolvePerformanceBottleneck;
    private performDynamicResourceOptimization;
    private calculateSystemEfficiency;
    private createEmptyNodeLoad;
    private createEmptyPerformanceMetrics;
    private getCurrentScalingMetrics;
    private analyzePerformanceTrends;
    private calculateTargetAchievement;
    private calculateScalingEfficiency;
    private analyzeResourceOptimization;
    private analyzeBottleneckPatterns;
    private analyzeCostOptimization;
    private projectScalabilityLimits;
    private generateScalingRecommendations;
    private estimatePerformanceImpact;
    private predictBottlenecks;
    dispose(): void;
}
export interface ScalingResult {
    success: boolean;
    target_agents: number;
    achieved_agents: number;
    scaling_time_ms: number;
    performance_impact: number;
    resource_utilization: number;
    bottlenecks_resolved: number;
    scaling_efficiency: number;
    cost_optimization: number;
}
interface NodePerformanceMetrics {
    throughput: number;
    latency_ms: number;
    error_rate: number;
    uptime_percentage: number;
}
export interface HyperScaleReport {
    timestamp: number;
    current_scale: any;
    performance_targets: PerformanceTargets;
    target_achievement: number;
    scaling_efficiency: number;
    resource_optimization: any;
    bottleneck_analysis: any;
    cost_optimization: any;
    scalability_projections: any;
    recommendations: string[];
}
export {};
