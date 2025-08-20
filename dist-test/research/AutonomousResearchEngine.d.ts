import { EventEmitter } from 'eventemitter3';
import type { Agent } from '../types';
/**
 * Autonomous Research Engine for Emergent Intelligence Discovery
 * Uses multi-agent systems to discover novel algorithmic patterns and behaviors
 */
export interface ResearchHypothesis {
    id: string;
    title: string;
    description: string;
    measurableOutcomes: string[];
    successCriteria: Record<string, number>;
    status: 'pending' | 'running' | 'completed' | 'failed';
    startTime?: number;
    endTime?: number;
    results?: ResearchResults;
}
export interface ResearchResults {
    metrics: Record<string, number>;
    statistically_significant: boolean;
    p_value: number;
    effect_size: number;
    confidence_interval: [number, number];
    novelty_score: number;
    reproducibility_score: number;
    findings: string[];
    visualizations: string[];
    publication_readiness: number;
}
export interface ExperimentalFramework {
    id: string;
    name: string;
    baseline_algorithm: string;
    novel_algorithm: string;
    test_scenarios: string[];
    metrics_to_collect: string[];
    statistical_tests: string[];
}
export interface BenchmarkSuite {
    name: string;
    scenarios: BenchmarkScenario[];
    baseline_results: Map<string, number>;
    comparative_results: Map<string, number>;
    statistical_analysis: StatisticalAnalysis;
}
export interface BenchmarkScenario {
    id: string;
    name: string;
    description: string;
    agent_count: number;
    environment_parameters: Record<string, any>;
    success_metrics: string[];
    duration: number;
}
export interface StatisticalAnalysis {
    mean_improvement: number;
    std_deviation: number;
    p_value: number;
    effect_size: number;
    statistical_power: number;
    multiple_comparison_correction: string;
}
export interface NovelAlgorithmCandidate {
    id: string;
    name: string;
    algorithm_type: 'optimization' | 'coordination' | 'planning' | 'learning';
    mathematical_foundation: string;
    implementation: string;
    theoretical_complexity: string;
    expected_performance_gain: number;
    research_merit: number;
}
export declare class AutonomousResearchEngine extends EventEmitter {
    private activeHypotheses;
    private experimentalFrameworks;
    private benchmarkSuites;
    private novelAlgorithms;
    private researchDatabase;
    private isResearching;
    constructor();
    /**
     * Discover novel algorithmic approaches through emergent behavior analysis
     */
    discoverNovelAlgorithms(swarm: Agent[], duration?: number): Promise<NovelAlgorithmCandidate[]>;
    /**
     * Conduct comparative studies with statistical rigor
     */
    conductComparativeStudy(baseline: string, novel: NovelAlgorithmCandidate, scenarios: BenchmarkScenario[], runs?: number): Promise<StatisticalAnalysis>;
    /**
     * Generate publication-ready research documentation
     */
    generateResearchPublication(hypothesis: ResearchHypothesis, results: ResearchResults, analysis: StatisticalAnalysis): Promise<string>;
    /**
     * Analyze emergent behaviors in agent swarms
     */
    private analyzeEmergentBehaviors;
    /**
     * Statistical analysis with publication standards
     */
    private performStatisticalAnalysis;
    /**
     * Advanced mathematical foundation derivation
     */
    private deriveMathematicalFoundation;
    private calculateNoveltyScore;
    private calculateResearchMerit;
    private calculatePValue;
    private calculateStatisticalPower;
    private normalCDF;
    private initializeResearchCapabilities;
    private detectBehavioralPatterns;
    private patternsAreSimilar;
    private getBaselinePerformance;
    private getKnownPatterns;
    private calculatePatternSimilarity;
    private assessTheoreticalInterest;
    private assessPracticalApplicability;
    private classifyAlgorithmType;
    private synthesizeImplementation;
    private analyzeComplexity;
    private runBenchmark;
    private runNovelAlgorithm;
    private calculateOverallScore;
    private inferComplexity;
    private getBaselineAlgorithms;
    private getTotalScenarios;
    private getMaxAgentCount;
    private interpretEffectSize;
    private calculateAverageResearchMerit;
    private getDominantScenarioTypes;
    private extractCoordinationMatrix;
    private deriveOptimizationFunction;
    private analyzeConvergenceProperties;
    private matrixToString;
    dispose(): void;
}
