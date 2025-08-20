import { EventEmitter } from 'eventemitter3';
export interface QuantumComputationCache {
    key: string;
    result: any;
    timestamp: number;
    hitCount: number;
    computationTime: number;
    expirationTime: number;
    size: number;
}
export interface QuantumResourcePool {
    id: string;
    type: 'superposition' | 'entanglement' | 'interference' | 'annealing';
    available: any[];
    inUse: any[];
    maxSize: number;
    currentSize: number;
    creationTime: number;
    lastAccess: number;
}
export interface QuantumWorkerTask {
    id: string;
    type: 'planning' | 'annealing' | 'interference' | 'measurement';
    priority: number;
    payload: any;
    createdAt: number;
    startedAt?: number;
    completedAt?: number;
    workerId?: string;
    retries: number;
}
export interface QuantumPerformanceMetrics {
    cacheHitRate: number;
    averageComputationTime: number;
    memoryUsage: number;
    poolUtilization: Map<string, number>;
    workerUtilization: number;
    throughput: number;
    concurrentOperations: number;
    optimizationGain: number;
}
export interface QuantumOptimizationConfig {
    cacheSize: number;
    cacheTTL: number;
    poolSizes: {
        superposition: number;
        entanglement: number;
        interference: number;
        annealing: number;
    };
    workerPoolSize: number;
    adaptiveOptimization: boolean;
    memoryLimit: number;
    performanceTargets: {
        cacheHitRate: number;
        averageResponseTime: number;
        throughput: number;
    };
}
export declare class QuantumPerformanceOptimizer extends EventEmitter {
    private cache;
    private resourcePools;
    private workerQueue;
    private activeWorkers;
    private config;
    private metrics;
    private optimizationActive;
    private memoryMonitor;
    constructor(config?: Partial<QuantumOptimizationConfig>);
    computeWithCache<T>(key: string, computationFn: () => Promise<T>, ttl?: number): Promise<T>;
    borrowResource<T>(poolType: keyof QuantumOptimizationConfig['poolSizes']): T | null;
    returnResource<T>(poolType: keyof QuantumOptimizationConfig['poolSizes'], resource: T): void;
    executeParallel<T>(tasks: Array<{
        id: string;
        type: QuantumWorkerTask['type'];
        priority: number;
        payload: any;
    }>): Promise<Map<string, T>>;
    selectOptimalAlgorithm(problemType: 'planning' | 'optimization' | 'measurement', problemSize: number, constraints: Record<string, any>): string;
    optimizeMemoryUsage(): void;
    getPerformanceMetrics(): QuantumPerformanceMetrics;
    getDetailedCacheStats(): any;
    getResourcePoolStats(): any;
    updateConfiguration(updates: Partial<QuantumOptimizationConfig>): void;
    enableAdaptiveOptimization(): void;
    disableAdaptiveOptimization(): void;
    private initializeResourcePools;
    private createPooledResource;
    private resetPooledResource;
    private processWorkerTask;
    private executeQuantumPlanning;
    private executeQuantumAnnealing;
    private executeInterferenceCalculation;
    private executeQuantumMeasurement;
    private addToCache;
    private clearExpiredCache;
    private shrinkResourcePools;
    private resizeCache;
    private resizeResourcePools;
    private updateAllMetrics;
    private updateCacheMetrics;
    private updatePoolMetrics;
    private updateWorkerMetrics;
    private updateMemoryMetrics;
    private getCurrentMemoryUsage;
    private estimateObjectSize;
    private getAvailableAlgorithms;
    private analyzeProblemComplexity;
    private analyzeResourceConstraints;
    private getAlgorithmPerformanceHistory;
    private calculateAlgorithmScore;
    private startOptimization;
    private startAdaptiveOptimization;
    startMonitoring(): void;
    stopMonitoring(): void;
    dispose(): void;
}
