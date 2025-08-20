import { EventEmitter } from 'eventemitter3';
import type { Agent } from '../types';
/**
 * Adaptive Intelligence System - Self-Improving AI Architecture
 * Continuously evolves and optimizes algorithms based on real-world performance
 */
export interface IntelligenceProfile {
    id: string;
    name: string;
    domain: string;
    current_performance: number;
    learning_rate: number;
    adaptation_history: AdaptationEvent[];
    specializations: string[];
    confidence_level: number;
    last_evolution: number;
}
export interface AdaptationEvent {
    timestamp: number;
    trigger: 'performance_drop' | 'new_pattern' | 'environmental_change' | 'user_feedback';
    adaptation_type: 'parameter_tuning' | 'algorithm_switch' | 'hybrid_approach' | 'novel_synthesis';
    performance_before: number;
    performance_after: number;
    confidence: number;
    permanent: boolean;
}
export interface EvolutionCandidate {
    id: string;
    parent_algorithm: string;
    mutation_type: string;
    parameters: Record<string, any>;
    predicted_performance: number;
    validation_score: number;
    resource_cost: number;
    implementation_complexity: number;
}
export interface LearningPattern {
    pattern_id: string;
    frequency: number;
    success_rate: number;
    context_conditions: Record<string, any>;
    optimal_parameters: Record<string, number>;
    generalization_potential: number;
}
export interface SelfImprovementMetrics {
    total_adaptations: number;
    successful_adaptations: number;
    average_performance_gain: number;
    learning_velocity: number;
    stability_score: number;
    innovation_index: number;
    resource_efficiency: number;
}
export declare class AdaptiveIntelligenceSystem extends EventEmitter {
    private intelligenceProfiles;
    private learningPatterns;
    private evolutionCandidates;
    private performanceHistory;
    private adaptationEngine;
    private knowledgeBase;
    private isLearning;
    private learningCycles;
    constructor();
    /**
     * Continuously adapt and improve system performance
     */
    startAdaptiveLearning(agents: Agent[], environment: any): Promise<void>;
    /**
     * Detect when system should adapt or evolve
     */
    private detectAdaptationOpportunities;
    /**
     * Generate candidate adaptations using multiple strategies
     */
    private generateEvolutionCandidates;
    /**
     * Safely evaluate candidates in isolated sandbox
     */
    private evaluateCandidates;
    /**
     * Select optimal adaptations using multi-objective optimization
     */
    private selectOptimalAdaptations;
    /**
     * Implement adaptations with careful rollback capability
     */
    private implementAdaptations;
    /**
     * Generate comprehensive self-improvement report
     */
    private generateSelfImprovementReport;
    private initializeBaseIntelligence;
    private measurePerformance;
    private detectNovelPatterns;
    private detectResourceInefficiencies;
    private generateParameterOptimizationCandidates;
    private generateAlgorithmEvolutionCandidates;
    private generateHybridCandidates;
    private generateNovelSynthesisCandidates;
    private rankAndFilterCandidates;
    private createSandboxEnvironment;
    private runCandidateInSandbox;
    private measureCandidatePerformance;
    private assessCandidateStability;
    private assessCandidateSafety;
    private estimateImplementationCost;
    private calculateNetBenefit;
    private getAvailableResourceBudget;
    private checkCompatibility;
    private calculateAdaptationPriority;
    private createRollbackPlan;
    private createSystemCheckpoint;
    private applyAdaptation;
    private monitorAdaptationEffect;
    private commitAdaptation;
    private updateIntelligenceProfile;
    private rollbackAdaptation;
    private calculateOptimalLearningInterval;
    private updateKnowledgeBase;
    private calculateLearningVelocity;
    private calculateSystemStabilityScore;
    private calculateInnovationIndex;
    private calculateResourceEfficiency;
    private getTopPerformingProfiles;
    private getRecentBreakthroughs;
    private identifyFutureOpportunities;
    stopAdaptiveLearning(): void;
    dispose(): void;
}
