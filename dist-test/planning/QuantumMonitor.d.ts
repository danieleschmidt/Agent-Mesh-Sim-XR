import { EventEmitter } from 'eventemitter3';
import { QuantumError, QuantumErrorHandler } from './QuantumErrorHandler';
export interface QuantumSystemHealth {
    systemId: string;
    overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
    coherenceLevel: number;
    entanglementStability: number;
    interferenceNoise: number;
    computationalLoad: number;
    errorRate: number;
    lastUpdate: number;
    components: {
        superposition: QuantumComponentHealth;
        interference: QuantumComponentHealth;
        annealing: QuantumComponentHealth;
        planner: QuantumComponentHealth;
    };
}
export interface QuantumComponentHealth {
    status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE';
    performance: number;
    errorCount: number;
    lastError?: QuantumError;
    uptime: number;
    memoryUsage: number;
    cpuUsage: number;
}
export interface QuantumMetrics {
    timestamp: number;
    systemId: string;
    coherenceMetrics: {
        averageCoherence: number;
        coherenceStability: number;
        decoherenceRate: number;
        quantumVolume: number;
    };
    performanceMetrics: {
        planningTime: number;
        convergenceRate: number;
        optimizationGain: number;
        throughput: number;
    };
    errorMetrics: {
        totalErrors: number;
        errorRate: number;
        criticalErrors: number;
        recoveryRate: number;
    };
    resourceMetrics: {
        memoryUsage: number;
        cpuUsage: number;
        networkLatency: number;
        storageUsage: number;
    };
}
export interface QuantumAlert {
    id: string;
    type: 'PERFORMANCE' | 'COHERENCE' | 'ERROR' | 'SECURITY' | 'RESOURCE';
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    systemId: string;
    component: string;
    message: string;
    details: Record<string, any>;
    timestamp: number;
    acknowledged: boolean;
    resolved: boolean;
    resolutionTime?: number;
}
export interface QuantumThresholds {
    coherence: {
        warning: number;
        critical: number;
    };
    errorRate: {
        warning: number;
        critical: number;
    };
    performance: {
        warning: number;
        critical: number;
    };
    memoryUsage: {
        warning: number;
        critical: number;
    };
    cpuUsage: {
        warning: number;
        critical: number;
    };
    interferenceNoise: {
        warning: number;
        critical: number;
    };
}
export declare class QuantumMonitor extends EventEmitter {
    private monitoredSystems;
    private metricsHistory;
    private activeAlerts;
    private thresholds;
    private errorHandler;
    private monitoringActive;
    private monitoringInterval;
    private metricsRetentionPeriod;
    constructor(errorHandler: QuantumErrorHandler);
    startMonitoring(intervalMs?: number): void;
    stopMonitoring(): void;
    registerQuantumSystem(systemId: string): void;
    unregisterQuantumSystem(systemId: string): void;
    updateSystemMetrics(systemId: string, metrics: Partial<QuantumMetrics>): void;
    reportComponentError(systemId: string, component: string, error: QuantumError): void;
    getSystemHealth(systemId: string): QuantumSystemHealth | null;
    getAllSystemsHealth(): QuantumSystemHealth[];
    getMetricsHistory(systemId: string, hours?: number): QuantumMetrics[];
    getActiveAlerts(systemId?: string): QuantumAlert[];
    acknowledgeAlert(alertId: string, userId: string): boolean;
    resolveAlert(alertId: string, userId: string, resolution: string): boolean;
    getMonitoringStats(): any;
    private collectMetrics;
    private evaluateSystemHealth;
    private checkThresholds;
    private createAlert;
    private setupErrorHandlerIntegration;
    private createInitialComponentHealth;
    private getLatestMetrics;
    private cleanupOldMetrics;
    private calculateAverageCoherence;
    private calculateAverageErrorRate;
    private generateAlertId;
    updateThresholds(thresholds: Partial<QuantumThresholds>): void;
    getThresholds(): QuantumThresholds;
    dispose(): void;
}
