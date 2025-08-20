export { AutonomousResearchEngine } from './AutonomousResearchEngine';
export type { ResearchHypothesis, ResearchResults, ExperimentalFramework, BenchmarkSuite, BenchmarkScenario, StatisticalAnalysis, NovelAlgorithmCandidate } from './AutonomousResearchEngine';
export { AutonomousValidationFramework } from './AutonomousValidationFramework';
export { AutonomousBenchmarkingSystem } from './AutonomousBenchmarkingSystem';
export type { ResearchHypothesis as ValidationHypothesis, ValidationResult, PublicationReport, StatisticalResults, ResearchDataset } from './AutonomousValidationFramework';
export type { Benchmark, BenchmarkReport, BenchmarkingStatus, BenchmarkResults as BenchmarkingResults } from './AutonomousBenchmarkingSystem';
export { AdaptiveIntelligenceSystem } from './AdaptiveIntelligenceSystem';
export type { IntelligenceProfile, AdaptationEvent, EvolutionCandidate, LearningPattern, SelfImprovementMetrics } from './AdaptiveIntelligenceSystem';
export { QuantumSwarmIntelligence } from './QuantumSwarmIntelligence';
export type { QuantumSwarmState, AgentSuperposition, PositionState, ActionState, EntanglementNetwork, EntanglementPair, QuantumCluster, MeasurementOutcome, QuantumAdvantage } from './QuantumSwarmIntelligence';
export { BenchmarkingFramework } from './BenchmarkingFramework';
export type { BenchmarkResult, ResourceMetrics, ComparativeStudy, PublicationMetrics, AlgorithmConfiguration } from './BenchmarkingFramework';
export { PublicationGenerator } from './PublicationGenerator';
export type { ResearchPublication, PublicationMetadata, CitationEntry } from './PublicationGenerator';
export declare const ResearchUtils: {
    /**
     * Generate comprehensive research hypothesis from basic parameters
     */
    generateResearchHypothesis: (title: string, domain: string, expectedImprovement: number, methodology: string) => ResearchHypothesis;
    /**
     * Create experimental framework for comparative studies
     */
    createExperimentalFramework: (name: string, baseline: string, novel: string, scenarios: string[], metrics: string[]) => ExperimentalFramework;
    /**
     * Generate benchmark scenario for algorithm testing
     */
    createBenchmarkScenario: (name: string, description: string, agentCount: number, environmentParams: Record<string, any>, duration?: number) => BenchmarkScenario;
    /**
     * Validate research results for publication standards
     */
    validateResearchResults: (results: ResearchResults) => ValidationReport;
    /**
     * Calculate research quality score
     */
    calculateQualityScore: (results: ResearchResults, issueCount: number, warningCount: number) => number;
    /**
     * Generate improvement recommendations
     */
    generateRecommendations: (results: ResearchResults, issues: string[], warnings: string[]) => string[];
    /**
     * Create adaptive intelligence profile
     */
    createIntelligenceProfile: (name: string, domain: string, specializations: string[], learningRate?: number) => IntelligenceProfile;
    /**
     * Generate quantum swarm configuration
     */
    createQuantumSwarmConfig: (agentCount: number, entanglementDensity?: number, coherenceTime?: number) => QuantumSwarmConfig;
    /**
     * Calculate theoretical quantum advantage upper bound
     */
    calculateQuantumAdvantageUpperBound: (problemSize: number, classicalComplexity: string, quantumComplexity: string) => number;
    /**
     * Estimate research resource requirements
     */
    estimateResearchResources: (hypothesis: ResearchHypothesis, framework: ExperimentalFramework, scenarios: BenchmarkScenario[]) => ResourceEstimate;
};
export declare function createResearchSystem(config?: ResearchSystemConfig): IntegratedResearchSystem;
export interface ResearchSystemConfig {
    max_concurrent_hypotheses?: number;
    statistical_significance_threshold?: number;
    min_effect_size?: number;
    auto_publish_threshold?: number;
    resource_budget?: ResourceBudget;
}
export interface ResourceBudget {
    compute_hours: number;
    memory_gb: number;
    storage_gb: number;
    development_weeks: number;
}
export interface ValidationReport {
    publication_ready: boolean;
    quality_score: number;
    issues: string[];
    warnings: string[];
    recommendations: string[];
}
export interface ResourceEstimate {
    estimated_compute_hours: number;
    memory_requirements_gb: number;
    storage_requirements_gb: number;
    development_weeks: number;
    validation_runs: number;
    total_test_scenarios: number;
    confidence_level: number;
    expected_duration_days: number;
}
export interface QuantumSwarmConfig {
    max_agents: number;
    quantum_dimension: number;
    entanglement_density: number;
    coherence_time: number;
    decoherence_rate: number;
    measurement_rate: number;
    quantum_gates: string[];
    error_correction: boolean;
    evolution_timestep: number;
}
export interface IntegratedResearchSystem {
    research: AutonomousResearchEngine;
    intelligence: AdaptiveIntelligenceSystem;
    quantum: QuantumSwarmIntelligence;
    config: ResearchSystemConfig;
    startIntegratedResearch(agents: Agent[], environment: any): Promise<void>;
    generateComprehensiveReport(): Promise<ComprehensiveResearchReport>;
    analyzeSystemIntegration(): IntegrationInsights;
    identifyPublicationOpportunities(): PublicationOpportunity[];
    suggestFutureResearch(): string[];
    dispose(): void;
}
export interface ComprehensiveResearchReport {
    timestamp: number;
    research_discoveries: NovelAlgorithmCandidate[];
    intelligence_adaptations: SelfImprovementMetrics;
    quantum_advantages: QuantumAdvantage[];
    integration_insights: IntegrationInsights;
    publication_opportunities: PublicationOpportunity[];
    future_research_directions: string[];
}
export interface IntegrationInsights {
    synergy_score: number;
    cross_system_benefits: string[];
    integration_challenges: string[];
    optimization_opportunities: string[];
}
export interface PublicationOpportunity {
    title: string;
    venue: string;
    readiness_score: number;
    estimated_impact: string;
}
import type { Agent } from '../types';
import type { ResearchHypothesis, ExperimentalFramework, BenchmarkScenario, ResearchResults, NovelAlgorithmCandidate } from './AutonomousResearchEngine';
import type { SelfImprovementMetrics, IntelligenceProfile } from './AdaptiveIntelligenceSystem';
import type { QuantumAdvantage } from './QuantumSwarmIntelligence';
