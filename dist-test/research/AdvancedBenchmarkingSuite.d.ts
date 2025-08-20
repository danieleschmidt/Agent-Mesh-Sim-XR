import { EventEmitter } from 'eventemitter3';
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor';
import type { Agent } from '../types';
export interface BenchmarkConfig {
    name: string;
    description: string;
    duration: number;
    agentCounts: number[];
    scenarios: BenchmarkScenario[];
    metrics: BenchmarkMetric[];
    baseline?: BenchmarkResult;
    publishResults: boolean;
}
export interface BenchmarkScenario {
    name: string;
    description: string;
    setup: (agentCount: number) => Promise<Agent[]>;
    execute: (agents: Agent[]) => Promise<void>;
    cleanup: (agents: Agent[]) => Promise<void>;
    expectedPerformance?: {
        minFPS: number;
        maxMemoryMB: number;
        maxLatencyMs: number;
    };
}
export interface BenchmarkMetric {
    name: string;
    unit: string;
    measure: (context: BenchmarkContext) => Promise<number>;
    higherIsBetter: boolean;
    significanceThreshold?: number;
}
export interface BenchmarkContext {
    agents: Agent[];
    startTime: number;
    duration: number;
    performanceMonitor: PerformanceMonitor;
    additionalData: Record<string, any>;
}
export interface BenchmarkResult {
    configName: string;
    scenario: string;
    agentCount: number;
    metrics: Record<string, number>;
    performanceProfile: PerformanceProfile;
    timestamp: number;
    environment: EnvironmentInfo;
    statisticalSignificance: boolean;
    anomalies: BenchmarkAnomaly[];
}
export interface PerformanceProfile {
    avgFPS: number;
    minFPS: number;
    maxFPS: number;
    avgMemoryMB: number;
    peakMemoryMB: number;
    avgCPUPercent: number;
    peakCPUPercent: number;
    renderTimeMs: number;
    networkLatencyMs: number;
    throughputOpsPerSec: number;
}
export interface EnvironmentInfo {
    userAgent: string;
    platform: string;
    hardwareConcurrency: number;
    maxTouchPoints: number;
    webGL: {
        vendor: string;
        renderer: string;
        version: string;
        extensions: string[];
    };
    memory?: {
        totalJSHeapSize: number;
        usedJSHeapSize: number;
        jsHeapSizeLimit: number;
    };
}
export interface BenchmarkAnomaly {
    type: 'performance_spike' | 'memory_leak' | 'fps_drop' | 'latency_spike';
    severity: 'low' | 'medium' | 'high' | 'critical';
    timestamp: number;
    description: string;
    data: any;
}
/**
 * Advanced Benchmarking Suite for scientific performance analysis
 * Supports statistical analysis, baseline comparisons, and automated anomaly detection
 */
export declare class AdvancedBenchmarkingSuite extends EventEmitter {
    private performanceMonitor;
    private benchmarkResults;
    private activeMetrics;
    private environmentInfo;
    private statisticalAnalyzer;
    constructor(performanceMonitor: PerformanceMonitor);
    private initializeStandardMetrics;
    registerMetric(metric: BenchmarkMetric): void;
    runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult[]>;
    private runScenario;
    private createPerformanceProfile;
    private createEmptyPerformanceProfile;
    private detectAnomalies;
    private calculateStatisticalSignificance;
    private performStatisticalAnalysis;
    private generateBenchmarkReport;
    private calculateAverageMetrics;
    private calculatePerformanceTrends;
    private summarizeAnomalies;
    private generateRecommendations;
    private publishResults;
    private gatherEnvironmentInfo;
    private delay;
    getResults(filter?: {
        configName?: string;
        scenario?: string;
        since?: number;
    }): BenchmarkResult[];
    exportResults(format?: 'json' | 'csv' | 'html'): string;
    private exportToCSV;
    private exportToHTML;
    clearResults(): void;
    dispose(): void;
}
export interface StatisticalAnalysis {
    sampleSize: number;
    confidenceInterval: number;
    significantFindings: SignificantFinding[];
    trends?: PerformanceTrend[];
}
export interface SignificantFinding {
    metric: string;
    description: string;
    pValue: number;
    effect: 'positive' | 'negative' | 'neutral';
}
export interface PerformanceTrend {
    scenario: string;
    metric: string;
    slope: number;
    correlation: number;
    prediction: (x: number) => number;
    significance: 'low' | 'medium' | 'high';
}
export interface LinearTrend {
    slope: number;
    intercept: number;
    correlation: number;
    prediction: (x: number) => number;
}
export interface BenchmarkReport {
    configName: string;
    description: string;
    timestamp: number;
    environment: EnvironmentInfo;
    totalScenarios: number;
    totalResults: number;
    successfulResults: number;
    averageMetrics: Record<string, number>;
    performanceTrends: PerformanceTrend[];
    anomalySummary: AnomalySummary;
    statisticalAnalysis: StatisticalAnalysis;
    recommendations: Recommendation[];
}
export interface AnomalySummary {
    totalAnomalies: number;
    criticalAnomalies: number;
    anomaliesByType: Record<string, number>;
    anomaliesByScenario: Record<string, number>;
    commonPatterns: CommonPattern[];
}
export interface CommonPattern {
    type: string;
    description: string;
    frequency: number;
}
export interface Recommendation {
    type: 'performance' | 'memory' | 'rendering' | 'network';
    priority: 'low' | 'medium' | 'high' | 'critical';
    title: string;
    description: string;
    suggestedActions: string[];
}
