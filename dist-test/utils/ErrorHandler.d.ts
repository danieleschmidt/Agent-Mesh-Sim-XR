import { EventEmitter } from 'eventemitter3';
export declare enum ErrorSeverity {
    LOW = "low",
    MEDIUM = "medium",
    HIGH = "high",
    CRITICAL = "critical"
}
export interface ErrorContext {
    module: string;
    function?: string;
    userId?: string;
    sessionId?: string;
    timestamp: number;
    stackTrace?: string;
    additionalData?: Record<string, any>;
}
export interface ErrorReport {
    id: string;
    error: Error;
    severity: ErrorSeverity;
    context: ErrorContext;
    handled: boolean;
    retryCount: number;
    timestamp: number;
}
export declare class ErrorHandler extends EventEmitter {
    private static instance;
    private errorReports;
    private retryStrategies;
    private circuitBreakers;
    private constructor();
    static getInstance(): ErrorHandler;
    private setupGlobalErrorHandling;
    handleError(error: Error, severity: ErrorSeverity, context: ErrorContext, options?: {
        retry?: boolean;
        reportToUser?: boolean;
        autoRecover?: boolean;
    }): string;
    private handleCriticalError;
    private handleHighSeverityError;
    private handleMediumSeverityError;
    private handleLowSeverityError;
    registerRetryStrategy(errorType: string, strategy: (error: Error, context: ErrorContext) => Promise<boolean>): void;
    private canRetry;
    private scheduleRetry;
    private attemptRecovery;
    private recoverNetworkConnection;
    private recoverXRSession;
    private recoverVisualization;
    private reportToUser;
    private generateUserFriendlyMessage;
    private activateCircuitBreaker;
    private isCircuitBreakerOpen;
    private generateErrorId;
    getErrorReport(errorId: string): ErrorReport | undefined;
    getErrorReports(filter?: {
        severity?: ErrorSeverity;
        module?: string;
        handled?: boolean;
        since?: number;
    }): ErrorReport[];
    clearErrorReports(): void;
    exportErrorReports(): string;
}
export declare const errorHandler: ErrorHandler;
