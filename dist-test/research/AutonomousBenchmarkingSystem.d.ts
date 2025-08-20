import { EventEmitter } from 'eventemitter3';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
/**
 * Autonomous Benchmarking System
 * Implements continuous performance benchmarking with automatic comparison
 * and publication-ready performance analysis for Generation 4 BULLETPROOF PRODUCTION
 */
export interface BenchmarkSuite {
    id: string;
    name: string;
    description: string;
    benchmarks: Benchmark[];
    baseline_results: BenchmarkResults;
    comparison_targets: ComparisonTarget[];
    publication_metadata: PublicationMetadata;
}
export interface Benchmark {
    id: string;
    name: string;
    description: string;
    category: 'performance' | 'scalability' | 'accuracy' | 'resource_efficiency';
    measurement_unit: string;
    target_metric: string;
    test_configuration: TestConfiguration;
    success_criteria: SuccessCriteria;
    statistical_requirements: StatisticalRequirements;
}
export interface TestConfiguration {
    agent_counts: number[];
    simulation_duration_ms: number;
    measurement_intervals: number[];
    environmental_conditions: EnvironmentalCondition[];
    hardware_requirements: HardwareRequirement[];
    randomization_seed?: number;
}
export interface EnvironmentalCondition {
    name: string;
    value: unknown;
    impact_factor: number;
}
export interface HardwareRequirement {
    component: 'cpu' | 'memory' | 'gpu' | 'network';
    minimum_specification: string;
    recommended_specification: string;
}
export interface SuccessCriteria {
    target_value: number;
    improvement_threshold: number;
    regression_threshold: number;
    statistical_significance: number;
}
export interface StatisticalRequirements {
    minimum_runs: number;
    confidence_level: number;
    acceptable_variance: number;
    outlier_detection: boolean;
}
export interface BenchmarkResults {
    benchmark_id: string;
    execution_timestamp: number;
    test_runs: TestRun[];
    statistical_summary: StatisticalSummary;
    performance_profile: PerformanceProfile;
    resource_utilization: ResourceUtilization;
    comparison_analysis: ComparisonAnalysis;
    quality_assessment: QualityAssessment;
}
export interface TestRun {
    run_id: string;
    timestamp: number;
    configuration: TestConfiguration;
    measurements: Measurement[];
    execution_time_ms: number;
    success: boolean;
    notes?: string;
}
export interface Measurement {
    metric_name: string;
    value: number;
    unit: string;
    timestamp: number;
    confidence: number;
}
export interface StatisticalSummary {
    mean: number;
    median: number;
    standard_deviation: number;
    confidence_interval: [number, number];
    percentiles: Record<number, number>;
    outliers_detected: number;
    statistical_significance: number;
}
export interface PerformanceProfile {
    throughput_metrics: ThroughputMetric[];
    latency_metrics: LatencyMetric[];
    scalability_analysis: ScalabilityAnalysis;
    bottleneck_identification: BottleneckAnalysis[];
}
export interface ThroughputMetric {
    agents_per_second: number;
    messages_per_second: number;
    operations_per_second: number;
    peak_throughput: number;
}
export interface LatencyMetric {
    average_latency_ms: number;
    p95_latency_ms: number;
    p99_latency_ms: number;
    max_latency_ms: number;
}
export interface ScalabilityAnalysis {
    scaling_factor: number;
    linear_scaling_range: [number, number];
    degradation_point: number;
    theoretical_maximum: number;
}
export interface BottleneckAnalysis {
    component: string;
    utilization_percentage: number;
    impact_score: number;
    recommendations: string[];
}
export interface ResourceUtilization {
    cpu_usage: ResourceMetric;
    memory_usage: ResourceMetric;
    gpu_usage: ResourceMetric;
    network_usage: ResourceMetric;
    storage_usage: ResourceMetric;
}
export interface ResourceMetric {
    average: number;
    peak: number;
    efficiency_score: number;
    trend: 'increasing' | 'stable' | 'decreasing';
}
export interface ComparisonAnalysis {
    baseline_comparison: BaselineComparison;
    peer_comparisons: PeerComparison[];
    improvement_trends: ImprovementTrend[];
    competitive_positioning: CompetitivePosition;
}
export interface BaselineComparison {
    performance_change: number;
    statistical_significance: number;
    improvement_achieved: boolean;
    regression_detected: boolean;
}
export interface PeerComparison {
    target_system: string;
    performance_ratio: number;
    advantage_areas: string[];
    disadvantage_areas: string[];
    overall_ranking: number;
}
export interface ImprovementTrend {
    time_period: string;
    improvement_rate: number;
    trend_confidence: number;
    projected_future_performance: number;
}
export interface CompetitivePosition {
    market_rank: number;
    performance_percentile: number;
    unique_advantages: string[];
    improvement_opportunities: string[];
}
export interface QualityAssessment {
    measurement_accuracy: number;
    test_reliability: number;
    reproducibility_score: number;
    statistical_validity: number;
    publication_readiness: number;
}
export interface ComparisonTarget {
    name: string;
    description: string;
    baseline_metrics: Record<string, number>;
    reference_publication?: string;
}
export interface PublicationMetadata {
    intended_venue: string;
    research_area: string;
    keywords: string[];
    novelty_claims: string[];
    contribution_type: 'algorithm' | 'system' | 'methodology' | 'benchmark';
}
export declare class AutonomousBenchmarkingSystem extends EventEmitter {
    private benchmarkSuites;
    private benchmarkResults;
    private performanceMonitor;
    private isRunning;
    private currentExecution;
    constructor(performanceMonitor: PerformanceMonitor);
    /**
     * Register a new benchmark suite for continuous execution
     */
    registerBenchmarkSuite(suite: BenchmarkSuite): Promise<void>;
    /**
     * Start autonomous benchmarking execution
     */
    startAutonomousBenchmarking(): Promise<void>;
    /**
     * Stop autonomous benchmarking
     */
    stopBenchmarking(): void;
    /**
     * Execute a specific benchmark suite
     */
    executeBenchmarkSuite(suiteId: string): Promise<BenchmarkResults[]>;
    /**
     * Generate comprehensive benchmark report for publication
     */
    generateBenchmarkReport(suiteId: string): Promise<BenchmarkReport>;
    /**
     * Get current benchmarking status
     */
    getBenchmarkingStatus(): BenchmarkingStatus;
    private runBenchmarkCycle;
    private validateBenchmarkSuite;
    private executeBenchmark;
    private calculateStatisticalSummary;
    private generatePerformanceProfile;
    private calculateResourceUtilization;
    private performComparisonAnalysis;
    private assessQuality;
    private detectOutliers;
    private calculatePercentile;
    private calculateSignificance;
    private analyzeScalability;
    private identifyBottlenecks;
    private generateExecutionSummary;
    private generatePerformanceAnalysis;
    private generateComparativeAnalysis;
    private generateStatisticalValidation;
    private generatePublicationSummary;
    private generateRecommendations;
    private generateFutureWork;
    private getPerformanceTrends;
    private getQualityMetrics;
    private sleep;
    dispose(): void;
}
export interface BenchmarkReport {
    suite_metadata: BenchmarkSuite;
    execution_summary: ExecutionSummary;
    performance_analysis: PerformanceAnalysisReport;
    comparative_analysis: ComparativeAnalysisReport;
    statistical_validation: StatisticalValidationReport;
    publication_summary: PublicationSummaryReport;
    recommendations: string[];
    future_work: string[];
}
export interface ExecutionSummary {
    total_benchmarks: number;
    successful_executions: number;
    average_execution_time: number;
    overall_quality_score: number;
}
export interface PerformanceAnalysisReport {
    performance_summary: string;
    key_findings: string[];
    performance_improvements: string[];
    competitive_advantages: string[];
}
export interface ComparativeAnalysisReport {
    baseline_performance_change: string;
    peer_system_comparisons: string[];
    industry_positioning: string;
    statistical_significance: string;
}
export interface StatisticalValidationReport {
    sample_sizes_adequate: boolean;
    statistical_power: number;
    confidence_levels: number;
    multiple_testing_corrections: string;
    reproducibility_confirmed: boolean;
}
export interface PublicationSummaryReport {
    publication_readiness: number;
    key_contributions: string[];
    statistical_rigor: string;
    reproducibility_documentation: string;
    peer_review_recommendations: string[];
}
export interface BenchmarkingStatus {
    is_running: boolean;
    registered_suites: number;
    total_benchmarks: number;
    completed_runs: number;
    current_execution: ExecutionStatus | null;
    performance_trends: PerformanceTrendSummary;
    quality_metrics: QualityMetricsSummary;
}
export interface ExecutionStatus {
    benchmark_id: string;
    status: 'pending' | 'running' | 'completed' | 'failed';
    progress: number;
    estimated_completion: number;
}
export interface PerformanceTrendSummary {
    overall_trend: 'improving' | 'stable' | 'degrading';
    performance_change_30d: string;
    key_metrics_trends: Record<string, string>;
}
export interface QualityMetricsSummary {
    average_reproducibility: number;
    statistical_validity: number;
    measurement_accuracy: number;
    publication_readiness: number;
}
