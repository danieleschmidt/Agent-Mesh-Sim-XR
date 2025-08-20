import { EventEmitter } from 'eventemitter3';
export declare enum QuantumErrorType {
    COHERENCE_LOSS = "COHERENCE_LOSS",
    SUPERPOSITION_COLLAPSE = "SUPERPOSITION_COLLAPSE",
    ENTANGLEMENT_BREAK = "ENTANGLEMENT_BREAK",
    INTERFERENCE_OVERFLOW = "INTERFERENCE_OVERFLOW",
    ANNEALING_DIVERGENCE = "ANNEALING_DIVERGENCE",
    QUANTUM_STATE_CORRUPTION = "QUANTUM_STATE_CORRUPTION",
    PLANNING_TIMEOUT = "PLANNING_TIMEOUT",
    RESOURCE_EXHAUSTION = "RESOURCE_EXHAUSTION",
    CONFIGURATION_ERROR = "CONFIGURATION_ERROR",
    COMPUTATION_ERROR = "COMPUTATION_ERROR"
}
export declare enum QuantumErrorSeverity {
    LOW = "LOW",
    MEDIUM = "MEDIUM",
    HIGH = "HIGH",
    CRITICAL = "CRITICAL"
}
export interface QuantumError {
    id: string;
    type: QuantumErrorType;
    severity: QuantumErrorSeverity;
    message: string;
    timestamp: number;
    context: {
        component: string;
        operation: string;
        quantumState?: any;
        systemId?: string;
        additionalData?: Record<string, any>;
    };
    stackTrace?: string;
    recoveryAttempts: number;
    resolved: boolean;
}
export interface QuantumRecoveryStrategy {
    errorType: QuantumErrorType;
    canHandle: (error: QuantumError) => boolean;
    recover: (error: QuantumError) => Promise<boolean>;
    fallback?: (error: QuantumError) => Promise<void>;
    maxAttempts: number;
    cooldownMs: number;
}
export interface QuantumErrorMetrics {
    totalErrors: number;
    errorsByType: Map<QuantumErrorType, number>;
    errorsBySeverity: Map<QuantumErrorSeverity, number>;
    recoveryRate: number;
    averageRecoveryTime: number;
    criticalErrorsToday: number;
}
export declare class QuantumErrorHandler extends EventEmitter {
    private errors;
    private recoveryStrategies;
    private activeRecoveries;
    private errorMetrics;
    private circuitBreakers;
    private maxErrorHistory;
    constructor();
    handleQuantumError(error: Error | QuantumError, type: QuantumErrorType, severity: QuantumErrorSeverity, context: {
        component: string;
        operation: string;
        quantumState?: any;
        systemId?: string;
        additionalData?: Record<string, any>;
    }): Promise<string>;
    private attemptRecovery;
    private performRecovery;
    private handleCriticalError;
    private triggerEmergencyStateReset;
    getError(errorId: string): QuantumError | undefined;
    getErrorsForComponent(component: string): QuantumError[];
    getUnresolvedErrors(): QuantumError[];
    getErrorMetrics(): QuantumErrorMetrics;
    private isCircuitBreakerOpen;
    private updateCircuitBreaker;
    private initializeRecoveryStrategies;
    private isQuantumError;
    private generateErrorId;
    private updateErrorMetrics;
    private updateRecoveryMetrics;
    private startMetricsCollection;
    getErrorTrends(hours?: number): any;
    private groupErrorsByType;
    private groupErrorsBySeverity;
    dispose(): void;
}
