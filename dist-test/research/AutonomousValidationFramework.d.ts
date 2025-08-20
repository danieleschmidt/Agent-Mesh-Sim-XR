import { EventEmitter } from 'eventemitter3';
/**
 * Autonomous Research Validation Framework
 * Implements self-validating research capabilities with statistical rigor
 * Following Generation 4 BULLETPROOF PRODUCTION standards
 */
export interface ResearchHypothesis {
    id: string;
    title: string;
    description: string;
    measurable_criteria: MeasurableCriterion[];
    baseline_metrics: Record<string, number>;
    success_threshold: number;
    statistical_significance_required: number;
    experiment_design: ExperimentDesign;
    timestamp: number;
}
export interface MeasurableCriterion {
    metric_name: string;
    measurement_unit: string;
    target_value: number;
    tolerance: number;
    measurement_method: string;
}
export interface ExperimentDesign {
    control_group_size: number;
    experimental_group_size: number;
    randomization_method: string;
    confounding_variables: string[];
    measurement_intervals: number[];
    duration_ms: number;
}
export interface ValidationResult {
    hypothesis_id: string;
    validation_timestamp: number;
    statistical_results: StatisticalResults;
    reproducibility_score: number;
    peer_review_ready: boolean;
    publication_confidence: number;
    recommendations: string[];
    next_validation_steps: string[];
}
export interface StatisticalResults {
    p_value: number;
    effect_size: number;
    confidence_interval: [number, number];
    sample_size: number;
    power_analysis: PowerAnalysis;
    significance_achieved: boolean;
    test_type: string;
}
export interface PowerAnalysis {
    statistical_power: number;
    minimum_detectable_effect: number;
    recommended_sample_size: number;
    current_power: number;
}
export interface ResearchDataset {
    dataset_id: string;
    hypothesis_id: string;
    collection_timestamp: number;
    data_points: DataPoint[];
    metadata: DatasetMetadata;
    validation_status: 'raw' | 'cleaned' | 'validated' | 'published';
}
export interface DataPoint {
    measurement_id: string;
    timestamp: number;
    metrics: Record<string, number>;
    experimental_conditions: Record<string, unknown>;
    quality_score: number;
}
export interface DatasetMetadata {
    collection_method: string;
    sample_size: number;
    measurement_precision: number;
    environmental_factors: Record<string, unknown>;
    quality_indicators: QualityIndicator[];
}
export interface QualityIndicator {
    indicator_name: string;
    score: number;
    threshold: number;
    passed: boolean;
}
export declare class AutonomousValidationFramework extends EventEmitter {
    private activeHypotheses;
    private validationResults;
    private researchDatasets;
    private isValidating;
    private validationEngine;
    private reproducibilityEngine;
    private peerReviewPreparation;
    constructor();
    /**
     * Register a new research hypothesis for autonomous validation
     */
    registerHypothesis(hypothesis: ResearchHypothesis): Promise<string>;
    /**
     * Start autonomous validation process for all active hypotheses
     */
    startAutonomousValidation(): Promise<void>;
    /**
     * Stop autonomous validation process
     */
    stopValidation(): void;
    /**
     * Get validation results for a specific hypothesis
     */
    getValidationResults(hypothesisId: string): ValidationResult | undefined;
    /**
     * Get all publication-ready hypotheses
     */
    getPublicationReadyResults(): ValidationResult[];
    /**
     * Generate comprehensive research report for publication
     */
    generatePublicationReport(hypothesisId: string): Promise<PublicationReport>;
    private runValidationCycle;
    private validateHypothesisStructure;
    private initializeDataCollection;
    private hasSufficientData;
    private validateHypothesis;
    private isPeerReviewReady;
    private calculatePublicationConfidence;
    private generateRecommendations;
    private determineNextSteps;
    private sleep;
    dispose(): void;
}
export interface PublicationReport {
    title: string;
    abstract: string;
    methodology: string;
    results: string;
    discussion: string;
    conclusion: string;
    references: string[];
    supplementary_data: {
        raw_dataset: ResearchDataset;
        statistical_analysis: StatisticalResults;
        reproducibility_assessment: number;
    };
    publication_readiness_score: number;
    peer_review_checklist: PeerReviewChecklist;
}
export interface PeerReviewChecklist {
    methodology_clarity: boolean;
    statistical_rigor: boolean;
    reproducibility_documented: boolean;
    sample_size_adequate: boolean;
    conclusions_supported: boolean;
    ethical_considerations: boolean;
    conflict_of_interest: boolean;
    data_availability: boolean;
    code_availability: boolean;
    overall_recommendation: 'accept' | 'minor_revisions' | 'major_revisions' | 'reject';
}
