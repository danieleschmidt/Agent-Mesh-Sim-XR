import { EventEmitter } from 'eventemitter3';
export interface PerformanceMetrics {
    fps: number;
    renderTime: number;
    updateTime: number;
    memoryUsage: number;
    agentCount: number;
    triangleCount: number;
    drawCalls: number;
    cpuUsage: number;
    gpuUsage?: number;
    networkLatency?: number;
    timestamp: number;
}
export interface PerformanceThresholds {
    minFPS: number;
    maxRenderTime: number;
    maxMemoryUsage: number;
    maxCPUUsage: number;
}
export interface PerformanceBudget {
    targetFPS: number;
    maxAgents: number;
    maxTriangles: number;
    maxDrawCalls: number;
}
export declare class PerformanceMonitor extends EventEmitter {
    private metrics;
    private currentMetrics;
    private thresholds;
    private budget;
    private monitoringInterval?;
    private isMonitoring;
    private lastFrameTime;
    private frameCount;
    private maxHistorySize;
    private performanceObserver?;
    private memoryCheckInterval?;
    constructor(thresholds?: PerformanceThresholds, budget?: PerformanceBudget);
    startMonitoring(intervalMs?: number): void;
    stopMonitoring(): void;
    private setupPerformanceObserver;
    private handlePerformanceMeasure;
    private collectMetrics;
    private calculateFPS;
    private getMemoryUsage;
    private estimateCPUUsage;
    private checkMemoryUsage;
    private addMetrics;
    private checkThresholds;
    private optimizeIfNeeded;
    measurePerformance<T>(name: string, fn: () => T): T;
    measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T>;
    updateAgentCount(count: number): void;
    updateRenderStats(stats: {
        triangleCount?: number;
        drawCalls?: number;
        gpuUsage?: number;
    }): void;
    updateNetworkLatency(latency: number): void;
    getCurrentMetrics(): PerformanceMetrics | null;
    getMetricsHistory(since?: number): PerformanceMetrics[];
    getAverageMetrics(windowSize?: number): Partial<PerformanceMetrics>;
    getPerformanceReport(): {
        current: PerformanceMetrics | null;
        average: Partial<PerformanceMetrics>;
        thresholds: PerformanceThresholds;
        budget: PerformanceBudget;
        isHealthy: boolean;
    };
    exportMetrics(): string;
    clearMetrics(): void;
    dispose(): void;
}
