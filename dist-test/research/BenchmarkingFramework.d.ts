import { EventEmitter } from 'eventemitter3';
import { BenchmarkScenario, StatisticalAnalysis } from './AutonomousResearchEngine';
/**
 * Comprehensive Benchmarking Framework for Multi-Agent Systems
 * Provides rigorous performance evaluation with statistical validation
 */
export interface BenchmarkResult {
    scenario_id: string;
    algorithm_name: string;
    performance_metrics: Record<string, number>;
    execution_time: number;
    convergence_time: number | null;
    success_rate: number;
    resource_usage: ResourceMetrics;
    error_count: number;
    timestamp: number;
}
export interface ResourceMetrics {
    cpu_time_ms: number;
    memory_peak_mb: number;
    message_count: number;
    computational_ops: number;
}
export interface ComparativeStudy {
    id: string;
    baseline_algorithm: string;
    novel_algorithm: string;
    scenarios: BenchmarkScenario[];
    baseline_results: BenchmarkResult[];
    novel_results: BenchmarkResult[];
    statistical_analysis: StatisticalAnalysis;
    publication_metrics: PublicationMetrics;
}
export interface PublicationMetrics {
    statistical_power: number;
    effect_size_interpretation: string;
    practical_significance: boolean;
    reproducibility_score: number;
    novelty_assessment: number;
    research_impact_score: number;
}
export interface AlgorithmConfiguration {
    name: string;
    type: 'baseline' | 'novel' | 'hybrid';
    implementation: string;
    parameters: Record<string, any>;
    theoretical_complexity: string;
    expected_performance_characteristics: string[];
}
export declare class BenchmarkingFramework extends EventEmitter {
    private scenarios;
    private algorithms;
    private benchmarkResults;
    private comparativeStudies;
    private researchEngine;
    private quantumPlanner;
    constructor();
    /**
     * Run comprehensive benchmarks comparing quantum-inspired vs classical algorithms
     */
    runComprehensiveBenchmarks(): Promise<ComparativeStudy[]>;
    /**
     * Conduct rigorous comparative study between two algorithms
     */
    conductComparativeStudy(baselineAlg: string, novelAlg: string, runs?: number): Promise<ComparativeStudy>;
    /**
     * Execute a single benchmark run with detailed metrics collection
     */
    private executeBenchmark;
    /**
     * Advanced statistical analysis with publication standards
     */
    private performAdvancedStatisticalAnalysis;
    /**
     * Calculate publication-quality metrics
     */
    private calculatePublicationMetrics;
    /**
     * Initialize comprehensive benchmark scenarios
     */
    private initializeBenchmarkSuites;
    /**
     * Initialize baseline algorithms for comparison
     */
    private initializeBaselineAlgorithms;
    private calculateMean;
    private calculateStandardDeviation;
    private calculatePooledStandardDeviation;
    private calculateWelchsTStatistic;
    private calculateWelchsDegreesOfFreedom;
    private calculatePValue;
    private calculateStatisticalPower;
    private normalCDF;
    private generateTestAgents;
    private executeAlgorithm;
    private generateTasksFromScenario;
    private calculatePerformanceMetrics;
    private analyzeConvergence;
    private calculateAverageImprovement;
    private calculateReproducibilityScore;
    private assessNoveltyScore;
    private calculateResearchImpactScore;
    private getBaselineAlgorithms;
    private getNovelAlgorithms;
    private generateBenchmarkPublication;
    dispose(): void;
}
