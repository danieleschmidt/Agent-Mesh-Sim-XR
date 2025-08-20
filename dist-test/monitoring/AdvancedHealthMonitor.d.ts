/**
 * Advanced Health Monitoring System
 * Comprehensive system health monitoring with predictive failure detection
 */
import { EventEmitter } from 'eventemitter3';
interface HealthMetric {
    name: string;
    value: number;
    threshold: number;
    status: 'healthy' | 'warning' | 'critical';
    timestamp: number;
    trend: 'improving' | 'stable' | 'degrading';
    prediction?: number;
}
interface SystemHealthReport {
    overall: 'healthy' | 'degraded' | 'critical';
    timestamp: number;
    metrics: HealthMetric[];
    checks: {
        name: string;
        status: boolean;
        lastRun: number;
    }[];
    predictions: {
        metric: string;
        predictedIssue: string;
        timeToIssue: number;
    }[];
    recommendations: string[];
    uptime: number;
}
export declare class AdvancedHealthMonitor extends EventEmitter {
    private metrics;
    private healthChecks;
    private monitoringInterval?;
    private checkInterval?;
    private isMonitoring;
    private startTime;
    private circuitBreakers;
    private predictions;
    constructor();
    private initializeDefaultChecks;
    private initializeDefaultMetrics;
    addHealthCheck(name: string, check: () => Promise<boolean>, interval?: number, timeout?: number, retries?: number): void;
    removeHealthCheck(name: string): boolean;
    startMonitoring(): void;
    stopMonitoring(): void;
    recordMetric(name: string, value: number, threshold?: number): void;
    private collectMetrics;
    private calculateTrend;
    private getDefaultThreshold;
    private runHealthChecks;
    private analyzeMetrics;
    private findMetricCorrelations;
    private calculateCorrelation;
    private detectAnomalies;
    private generatePredictions;
    private predictMetricIssue;
    private handleCriticalMetric;
    private handleFailedHealthCheck;
    private attemptAutoRemediation;
    private attemptHealthCheckRecovery;
    private checkCircuitBreaker;
    private getRecentErrorCount;
    private calculateErrorRate;
    getHealthReport(): SystemHealthReport;
    private generateRecommendations;
    dispose(): void;
}
export {};
