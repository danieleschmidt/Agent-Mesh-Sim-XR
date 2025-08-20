import { EventEmitter } from 'eventemitter3';
import type { ComparativeStudy } from './BenchmarkingFramework';
/**
 * Publication Generator for Academic Research Papers
 * Automatically generates publication-quality research documents
 */
export interface ResearchPublication {
    id: string;
    title: string;
    abstract: string;
    full_manuscript: string;
    metadata: PublicationMetadata;
    statistical_appendix: string;
    code_repository: string;
    reproducibility_package: string;
    peer_review_readiness: number;
}
export interface PublicationMetadata {
    authors: string[];
    keywords: string[];
    methodology: string;
    statistical_tests: string[];
    sample_size: number;
    effect_size: number;
    p_value: number;
    confidence_level: number;
    publication_date: string;
    journal_target: string;
    impact_factor_estimate: number;
}
export interface CitationEntry {
    id: string;
    title: string;
    authors: string[];
    journal: string;
    year: number;
    doi?: string;
    relevance_score: number;
}
export declare class PublicationGenerator extends EventEmitter {
    private citationDatabase;
    private templateLibrary;
    constructor();
    /**
     * Generate a complete research publication from comparative studies
     */
    generateResearchPublication(studies: ComparativeStudy[], researchTitle?: string): Promise<ResearchPublication>;
    /**
     * Generate abstract section
     */
    private generateAbstract;
    /**
     * Generate introduction section
     */
    private generateIntroduction;
    /**
     * Generate methodology section
     */
    private generateMethodology;
    /**
     * Generate results section
     */
    private generateResults;
    /**
     * Generate discussion section
     */
    private generateDiscussion;
    /**
     * Generate conclusion section
     */
    private generateConclusion;
    /**
     * Assemble complete manuscript
     */
    private assembleManuscript;
    /**
     * Generate references section
     */
    private generateReferences;
    private aggregateStatisticalResults;
    private calculatePublicationMetrics;
    private calculateTotalSampleSize;
    private calculatePeerReviewReadiness;
    private calculateAverageAgentCount;
    private interpretEffectSize;
    private initializeCitationDatabase;
    private initializeTemplates;
    private generateStatisticalAppendix;
    private generateCodeRepository;
    private generateReproducibilityPackage;
    dispose(): void;
}
