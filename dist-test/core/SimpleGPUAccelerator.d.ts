/**
 * Simplified GPU Acceleration for Agent Updates
 * Provides batch processing capabilities without complex WebGL compute shaders
 */
import type { Agent } from '../types';
interface GPUAcceleratorConfig {
    maxBatchSize: number;
    enableInstancing: boolean;
    useWebWorkers: boolean;
    workerCount: number;
}
interface BatchUpdateResult {
    processed: number;
    timeMs: number;
    errors: number;
}
export declare class SimpleGPUAccelerator {
    private config;
    private workers;
    private batchQueue;
    private processing;
    private stats;
    constructor(config?: Partial<GPUAcceleratorConfig>);
    private initializeWorkers;
    processAgentBatch(agents: Agent[]): Promise<BatchUpdateResult>;
    private processWithWorkers;
    private processOnMainThread;
    private processAgentsSync;
    optimizeBatchSize(currentFPS: number, targetFPS?: number): number;
    getStatistics(): {
        workersActive: number;
        configuration: GPUAcceleratorConfig;
        totalProcessed: number;
        totalTime: number;
        averageTime: number;
        errorCount: number;
    };
    dispose(): void;
}
export {};
