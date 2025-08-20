"use strict";
/**
 * Smart Error Recovery System
 * Advanced error recovery with learning capabilities and adaptive strategies
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.SmartErrorRecovery = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("./Logger");
const ErrorHandler_1 = require("./ErrorHandler");
class SmartErrorRecovery extends eventemitter3_1.EventEmitter {
    strategies = new Map();
    recoveryHistory = [];
    errorPatterns = new Map();
    isEnabled = true;
    maxHistorySize = 1000;
    learningEnabled = true;
    adaptationThreshold = 0.7;
    constructor() {
        super();
        this.initializeDefaultStrategies();
        this.setupHistoryCleanup();
        Logger_1.logger.info('SmartErrorRecovery', 'Smart error recovery system initialized');
    }
    initializeDefaultStrategies() {
        // Network error recovery
        this.addRecoveryStrategy({
            id: 'network_retry',
            name: 'Network Retry with Exponential Backoff',
            errorTypes: ['NetworkError', 'ConnectionError', 'TimeoutError'],
            severity: [ErrorHandler_1.ErrorSeverity.MEDIUM, ErrorHandler_1.ErrorSeverity.HIGH],
            strategy: async () => {
                await this.exponentialBackoff();
                return await this.testNetworkConnectivity();
            },
            cost: 1,
            successRate: 0.8,
            lastUsed: 0,
            cooldown: 5000,
            maxRetries: 3
        });
        // Memory pressure recovery
        this.addRecoveryStrategy({
            id: 'memory_cleanup',
            name: 'Memory Cleanup and Optimization',
            errorTypes: ['OutOfMemoryError', 'MemoryPressureError'],
            severity: [ErrorHandler_1.ErrorSeverity.HIGH, ErrorHandler_1.ErrorSeverity.CRITICAL],
            strategy: async () => {
                return await this.performMemoryCleanup();
            },
            cost: 2,
            successRate: 0.9,
            lastUsed: 0,
            cooldown: 30000,
            maxRetries: 2
        });
        // XR session recovery
        this.addRecoveryStrategy({
            id: 'xr_session_reset',
            name: 'XR Session Reset',
            errorTypes: ['XRError', 'WebXRError', 'SessionError'],
            severity: [ErrorHandler_1.ErrorSeverity.MEDIUM, ErrorHandler_1.ErrorSeverity.HIGH],
            strategy: async () => {
                return await this.resetXRSession();
            },
            cost: 3,
            successRate: 0.7,
            lastUsed: 0,
            cooldown: 10000,
            maxRetries: 2
        });
        // Configuration reload
        this.addRecoveryStrategy({
            id: 'config_reload',
            name: 'Configuration Reload',
            errorTypes: ['ConfigurationError', 'ValidationError'],
            severity: [ErrorHandler_1.ErrorSeverity.LOW, ErrorHandler_1.ErrorSeverity.MEDIUM],
            strategy: async () => {
                return await this.reloadConfiguration();
            },
            cost: 1,
            successRate: 0.95,
            lastUsed: 0,
            cooldown: 0,
            maxRetries: 1
        });
        // Component restart
        this.addRecoveryStrategy({
            id: 'component_restart',
            name: 'Component Restart',
            errorTypes: ['ComponentError', 'StateError', 'InitializationError'],
            severity: [ErrorHandler_1.ErrorSeverity.MEDIUM, ErrorHandler_1.ErrorSeverity.HIGH],
            strategy: async () => {
                return await this.restartComponent();
            },
            cost: 4,
            successRate: 0.85,
            lastUsed: 0,
            cooldown: 15000,
            maxRetries: 1
        });
        // Resource allocation recovery
        this.addRecoveryStrategy({
            id: 'resource_reallocation',
            name: 'Resource Reallocation',
            errorTypes: ['ResourceError', 'AllocationError'],
            severity: [ErrorHandler_1.ErrorSeverity.MEDIUM],
            strategy: async () => {
                return await this.reallocateResources();
            },
            cost: 2,
            successRate: 0.75,
            lastUsed: 0,
            cooldown: 20000,
            maxRetries: 2
        });
    }
    addRecoveryStrategy(strategy) {
        const fullStrategy = {
            ...strategy,
            currentRetries: 0
        };
        this.strategies.set(strategy.id, fullStrategy);
        Logger_1.logger.info('SmartErrorRecovery', 'Recovery strategy added', {
            id: strategy.id,
            name: strategy.name,
            errorTypes: strategy.errorTypes
        });
    }
    async attemptRecovery(error, context = {}) {
        if (!this.isEnabled) {
            Logger_1.logger.debug('SmartErrorRecovery', 'Recovery disabled, skipping');
            return false;
        }
        const errorType = error.constructor.name;
        const errorMessage = error.message;
        const errorId = this.generateErrorId(error, context);
        // Update error patterns
        this.updateErrorPattern(errorType, errorMessage, context);
        // Find suitable recovery strategies
        const strategies = this.selectRecoveryStrategies(error, context);
        if (strategies.length === 0) {
            Logger_1.logger.warn('SmartErrorRecovery', 'No recovery strategies found', { errorType, errorMessage });
            return false;
        }
        // Sort strategies by effectiveness
        const rankedStrategies = this.rankStrategies(strategies, errorType);
        for (const strategy of rankedStrategies) {
            try {
                const recoveryAttempt = await this.executeStrategy(strategy, errorId, error, context);
                if (recoveryAttempt.success) {
                    this.onRecoverySuccess(strategy, recoveryAttempt);
                    return true;
                }
                else {
                    this.onRecoveryFailure(strategy, recoveryAttempt);
                }
            }
            catch (recoveryError) {
                Logger_1.logger.error('SmartErrorRecovery', 'Recovery strategy failed', {
                    strategyId: strategy.id,
                    error: recoveryError.message
                });
            }
        }
        Logger_1.logger.warn('SmartErrorRecovery', 'All recovery strategies failed', { errorType, errorId });
        return false;
    }
    selectRecoveryStrategies(error, context) {
        const errorType = error.constructor.name;
        const severity = this.determineSeverity(error, context);
        const currentTime = Date.now();
        return Array.from(this.strategies.values()).filter(strategy => {
            // Check if strategy applies to this error type
            const typeMatch = strategy.errorTypes.includes(errorType) ||
                strategy.errorTypes.some(pattern => errorType.includes(pattern));
            if (!typeMatch)
                return false;
            // Check severity compatibility
            if (!strategy.severity.includes(severity))
                return false;
            // Check cooldown period
            if (currentTime - strategy.lastUsed < strategy.cooldown)
                return false;
            // Check retry limit
            if (strategy.currentRetries >= strategy.maxRetries)
                return false;
            return true;
        });
    }
    rankStrategies(strategies, errorType) {
        return strategies.sort((a, b) => {
            // Calculate effectiveness score
            const scoreA = this.calculateEffectivenessScore(a, errorType);
            const scoreB = this.calculateEffectivenessScore(b, errorType);
            return scoreB - scoreA; // Higher score first
        });
    }
    calculateEffectivenessScore(strategy, errorType) {
        // Base score from success rate
        let score = strategy.successRate * 100;
        // Adjust for cost (lower cost is better)
        score -= strategy.cost * 5;
        // Adjust for pattern-specific success
        const pattern = this.errorPatterns.get(errorType);
        if (pattern && pattern.successfulRecoveries.includes(strategy.id)) {
            score += 20;
        }
        if (pattern && pattern.failedRecoveries.includes(strategy.id)) {
            score -= 30;
        }
        // Adjust for recent usage (diversity bonus)
        const timeSinceLastUse = Date.now() - strategy.lastUsed;
        if (timeSinceLastUse > strategy.cooldown * 2) {
            score += 10;
        }
        // Adjust for retry count
        score -= strategy.currentRetries * 15;
        return Math.max(score, 0);
    }
    async executeStrategy(strategy, errorId, error, context) {
        const startTime = Date.now();
        const attemptId = this.generateAttemptId();
        Logger_1.logger.info('SmartErrorRecovery', 'Executing recovery strategy', {
            strategyId: strategy.id,
            strategyName: strategy.name,
            errorId,
            attempt: strategy.currentRetries + 1
        });
        try {
            strategy.currentRetries++;
            strategy.lastUsed = startTime;
            const success = await Promise.race([
                strategy.strategy(),
                new Promise((_, reject) => setTimeout(() => reject(new Error('Recovery strategy timeout')), 30000))
            ]);
            const duration = Date.now() - startTime;
            const attempt = {
                id: attemptId,
                errorId,
                strategyId: strategy.id,
                timestamp: startTime,
                success,
                duration,
                context
            };
            this.recordRecoveryAttempt(attempt);
            if (success) {
                strategy.currentRetries = 0; // Reset on success
            }
            return attempt;
        }
        catch (strategyError) {
            const duration = Date.now() - startTime;
            const attempt = {
                id: attemptId,
                errorId,
                strategyId: strategy.id,
                timestamp: startTime,
                success: false,
                duration,
                context
            };
            this.recordRecoveryAttempt(attempt);
            return attempt;
        }
    }
    onRecoverySuccess(strategy, attempt) {
        // Update strategy success rate using exponential moving average
        const alpha = 0.1;
        strategy.successRate = strategy.successRate * (1 - alpha) + alpha;
        this.emit('recovery_success', {
            strategyId: strategy.id,
            attemptId: attempt.id,
            duration: attempt.duration
        });
        Logger_1.logger.info('SmartErrorRecovery', 'Recovery successful', {
            strategyId: strategy.id,
            duration: attempt.duration,
            newSuccessRate: strategy.successRate
        });
        // Learn from success
        if (this.learningEnabled) {
            this.learnFromSuccess(strategy, attempt);
        }
    }
    onRecoveryFailure(strategy, attempt) {
        // Update strategy success rate
        const alpha = 0.1;
        strategy.successRate = strategy.successRate * (1 - alpha);
        this.emit('recovery_failure', {
            strategyId: strategy.id,
            attemptId: attempt.id,
            duration: attempt.duration
        });
        Logger_1.logger.warn('SmartErrorRecovery', 'Recovery failed', {
            strategyId: strategy.id,
            duration: attempt.duration,
            newSuccessRate: strategy.successRate,
            retriesLeft: strategy.maxRetries - strategy.currentRetries
        });
        // Learn from failure
        if (this.learningEnabled) {
            this.learnFromFailure(strategy, attempt);
        }
    }
    learnFromSuccess(strategy, attempt) {
        // Reduce cooldown for successful strategies
        if (strategy.successRate > this.adaptationThreshold) {
            strategy.cooldown = Math.max(strategy.cooldown * 0.9, 1000);
        }
        // Update error patterns
        const errorPattern = this.findErrorPatternByAttempt(attempt);
        if (errorPattern && !errorPattern.successfulRecoveries.includes(strategy.id)) {
            errorPattern.successfulRecoveries.push(strategy.id);
            // Remove from failed recoveries if present
            const failedIndex = errorPattern.failedRecoveries.indexOf(strategy.id);
            if (failedIndex > -1) {
                errorPattern.failedRecoveries.splice(failedIndex, 1);
            }
        }
    }
    learnFromFailure(strategy, attempt) {
        // Increase cooldown for failing strategies
        if (strategy.successRate < this.adaptationThreshold) {
            strategy.cooldown = Math.min(strategy.cooldown * 1.2, 60000);
        }
        // Update error patterns
        const errorPattern = this.findErrorPatternByAttempt(attempt);
        if (errorPattern && !errorPattern.failedRecoveries.includes(strategy.id)) {
            errorPattern.failedRecoveries.push(strategy.id);
        }
    }
    updateErrorPattern(errorType, errorMessage, context) {
        const patternKey = errorType;
        const currentTime = Date.now();
        if (!this.errorPatterns.has(patternKey)) {
            this.errorPatterns.set(patternKey, {
                pattern: errorType,
                frequency: 1,
                lastSeen: currentTime,
                successfulRecoveries: [],
                failedRecoveries: [],
                context: [context]
            });
        }
        else {
            const pattern = this.errorPatterns.get(patternKey);
            pattern.frequency++;
            pattern.lastSeen = currentTime;
            pattern.context.push(context);
            // Keep context history manageable
            if (pattern.context.length > 10) {
                pattern.context.shift();
            }
        }
    }
    findErrorPatternByAttempt(attempt) {
        // This is a simplified lookup - in practice, you'd need to track the error type
        // that triggered each attempt
        return Array.from(this.errorPatterns.values())[0];
    }
    recordRecoveryAttempt(attempt) {
        this.recoveryHistory.push(attempt);
        if (this.recoveryHistory.length > this.maxHistorySize) {
            this.recoveryHistory.shift();
        }
    }
    determineSeverity(error, context) {
        // This could be more sophisticated based on error analysis
        if (error.message.includes('critical') || error.message.includes('fatal')) {
            return ErrorHandler_1.ErrorSeverity.CRITICAL;
        }
        if (error.message.includes('network') || error.message.includes('timeout')) {
            return ErrorHandler_1.ErrorSeverity.MEDIUM;
        }
        return ErrorHandler_1.ErrorSeverity.LOW;
    }
    // Recovery strategy implementations
    async exponentialBackoff() {
        const delays = [1000, 2000, 4000, 8000];
        for (const delay of delays) {
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
    async testNetworkConnectivity() {
        try {
            if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
                return navigator.onLine;
            }
            return true;
        }
        catch {
            return false;
        }
    }
    async performMemoryCleanup() {
        try {
            // Trigger garbage collection if available
            if (typeof window !== 'undefined' && window.gc) {
                window.gc();
            }
            // Clear caches
            this.emit('memory_cleanup_requested');
            return true;
        }
        catch {
            return false;
        }
    }
    async resetXRSession() {
        try {
            this.emit('xr_reset_requested');
            return true;
        }
        catch {
            return false;
        }
    }
    async reloadConfiguration() {
        try {
            this.emit('config_reload_requested');
            return true;
        }
        catch {
            return false;
        }
    }
    async restartComponent() {
        try {
            this.emit('component_restart_requested');
            return true;
        }
        catch {
            return false;
        }
    }
    async reallocateResources() {
        try {
            this.emit('resource_reallocation_requested');
            return true;
        }
        catch {
            return false;
        }
    }
    generateErrorId(error, context) {
        const contextStr = JSON.stringify(context).substring(0, 100);
        return `err_${Date.now()}_${error.constructor.name}_${contextStr.length}`;
    }
    generateAttemptId() {
        return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    }
    setupHistoryCleanup() {
        setInterval(() => {
            this.cleanupHistory();
        }, 3600000); // Every hour
    }
    cleanupHistory() {
        const cutoffTime = Date.now() - 86400000; // 24 hours
        this.recoveryHistory = this.recoveryHistory.filter(attempt => attempt.timestamp > cutoffTime);
        // Clean up old error patterns
        for (const [key, pattern] of this.errorPatterns) {
            if (pattern.lastSeen < cutoffTime) {
                this.errorPatterns.delete(key);
            }
        }
    }
    getRecoveryReport() {
        const totalAttempts = this.recoveryHistory.length;
        const successfulAttempts = this.recoveryHistory.filter(a => a.success).length;
        const successRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0;
        const strategiesReport = Array.from(this.strategies.values()).map(strategy => ({
            id: strategy.id,
            name: strategy.name,
            successRate: strategy.successRate,
            lastUsed: strategy.lastUsed,
            currentRetries: strategy.currentRetries,
            cooldown: strategy.cooldown
        }));
        const errorPatternsReport = Array.from(this.errorPatterns.entries()).map(([key, pattern]) => ({
            pattern: key,
            frequency: pattern.frequency,
            lastSeen: pattern.lastSeen,
            successfulRecoveries: pattern.successfulRecoveries.length,
            failedRecoveries: pattern.failedRecoveries.length
        }));
        return {
            timestamp: Date.now(),
            enabled: this.isEnabled,
            learningEnabled: this.learningEnabled,
            totalAttempts,
            successfulAttempts,
            overallSuccessRate: successRate,
            strategies: strategiesReport,
            errorPatterns: errorPatternsReport,
            recentAttempts: this.recoveryHistory.slice(-10)
        };
    }
    enableRecovery() {
        this.isEnabled = true;
        Logger_1.logger.info('SmartErrorRecovery', 'Error recovery enabled');
    }
    disableRecovery() {
        this.isEnabled = false;
        Logger_1.logger.info('SmartErrorRecovery', 'Error recovery disabled');
    }
    enableLearning() {
        this.learningEnabled = true;
        Logger_1.logger.info('SmartErrorRecovery', 'Learning enabled');
    }
    disableLearning() {
        this.learningEnabled = false;
        Logger_1.logger.info('SmartErrorRecovery', 'Learning disabled');
    }
    dispose() {
        this.disableRecovery();
        this.strategies.clear();
        this.recoveryHistory.length = 0;
        this.errorPatterns.clear();
        this.removeAllListeners();
        Logger_1.logger.info('SmartErrorRecovery', 'Smart error recovery disposed');
    }
}
exports.SmartErrorRecovery = SmartErrorRecovery;
