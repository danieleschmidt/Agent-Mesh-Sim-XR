/**
 * Smart Error Recovery System
 * Advanced error recovery with learning capabilities and adaptive strategies
 */
import { EventEmitter } from 'eventemitter3';
import { ErrorSeverity } from './ErrorHandler';
interface RecoveryStrategy {
    id: string;
    name: string;
    errorTypes: string[];
    severity: ErrorSeverity[];
    strategy: () => Promise<boolean>;
    cost: number;
    successRate: number;
    lastUsed: number;
    cooldown: number;
    maxRetries: number;
    currentRetries: number;
}
export declare class SmartErrorRecovery extends EventEmitter {
    private strategies;
    private recoveryHistory;
    private errorPatterns;
    private isEnabled;
    private maxHistorySize;
    private learningEnabled;
    private adaptationThreshold;
    constructor();
    private initializeDefaultStrategies;
    addRecoveryStrategy(strategy: Omit<RecoveryStrategy, 'currentRetries'>): void;
    attemptRecovery(error: Error, context?: unknown): Promise<boolean>;
    private selectRecoveryStrategies;
    private rankStrategies;
    private calculateEffectivenessScore;
    private executeStrategy;
    private onRecoverySuccess;
    private onRecoveryFailure;
    private learnFromSuccess;
    private learnFromFailure;
    private updateErrorPattern;
    private findErrorPatternByAttempt;
    private recordRecoveryAttempt;
    private determineSeverity;
    private exponentialBackoff;
    private testNetworkConnectivity;
    private performMemoryCleanup;
    private resetXRSession;
    private reloadConfiguration;
    private restartComponent;
    private reallocateResources;
    private generateErrorId;
    private generateAttemptId;
    private setupHistoryCleanup;
    private cleanupHistory;
    getRecoveryReport(): unknown;
    enableRecovery(): void;
    disableRecovery(): void;
    enableLearning(): void;
    disableLearning(): void;
    dispose(): void;
}
export {};
