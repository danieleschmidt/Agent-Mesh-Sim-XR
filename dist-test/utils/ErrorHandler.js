"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorHandler = exports.ErrorHandler = exports.ErrorSeverity = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("./Logger");
var ErrorSeverity;
(function (ErrorSeverity) {
    ErrorSeverity["LOW"] = "low";
    ErrorSeverity["MEDIUM"] = "medium";
    ErrorSeverity["HIGH"] = "high";
    ErrorSeverity["CRITICAL"] = "critical";
})(ErrorSeverity || (exports.ErrorSeverity = ErrorSeverity = {}));
class ErrorHandler extends eventemitter3_1.EventEmitter {
    static instance;
    errorReports = new Map();
    retryStrategies = new Map();
    circuitBreakers = new Map();
    constructor() {
        super();
        this.setupGlobalErrorHandling();
    }
    static getInstance() {
        if (!ErrorHandler.instance) {
            ErrorHandler.instance = new ErrorHandler();
        }
        return ErrorHandler.instance;
    }
    setupGlobalErrorHandling() {
        // Handle unhandled promise rejections
        if (typeof window !== 'undefined') {
            window.addEventListener('unhandledrejection', (event) => {
                this.handleError(new Error(`Unhandled Promise Rejection: ${event.reason}`), ErrorSeverity.HIGH, { module: 'global', function: 'unhandledrejection', timestamp: Date.now() });
            });
            // Handle general errors
            window.addEventListener('error', (event) => {
                this.handleError(new Error(event.message), ErrorSeverity.MEDIUM, {
                    module: 'global',
                    function: event.filename || 'unknown',
                    timestamp: Date.now(),
                    additionalData: {
                        line: event.lineno,
                        column: event.colno
                    }
                });
            });
        }
    }
    handleError(error, severity, context, options = {}) {
        const errorId = this.generateErrorId();
        const report = {
            id: errorId,
            error,
            severity,
            context: {
                ...context,
                stackTrace: error.stack
            },
            handled: false,
            retryCount: 0,
            timestamp: Date.now()
        };
        this.errorReports.set(errorId, report);
        // Log error
        Logger_1.logger.error(context.module, error.message, error, {
            errorId,
            severity,
            context
        });
        // Emit error event
        this.emit('error', report);
        // Handle based on severity
        switch (severity) {
            case ErrorSeverity.CRITICAL:
                this.handleCriticalError(report);
                break;
            case ErrorSeverity.HIGH:
                this.handleHighSeverityError(report);
                break;
            case ErrorSeverity.MEDIUM:
                this.handleMediumSeverityError(report);
                break;
            case ErrorSeverity.LOW:
                this.handleLowSeverityError(report);
                break;
        }
        // Auto retry if configured
        if (options.retry && this.canRetry(report)) {
            this.scheduleRetry(report);
        }
        // Auto recovery attempt
        if (options.autoRecover) {
            this.attemptRecovery(report);
        }
        // Report to user if needed
        if (options.reportToUser) {
            this.reportToUser(report);
        }
        return errorId;
    }
    handleCriticalError(report) {
        // Critical errors should halt operation
        Logger_1.logger.error('ErrorHandler', 'CRITICAL ERROR - System may be unstable', report.error, report);
        // Notify all listeners
        this.emit('criticalError', report);
        // Consider circuit breaker activation
        this.activateCircuitBreaker(report.context.module);
    }
    handleHighSeverityError(report) {
        Logger_1.logger.error('ErrorHandler', 'HIGH SEVERITY ERROR', report.error, report);
        this.emit('highSeverityError', report);
    }
    handleMediumSeverityError(report) {
        Logger_1.logger.warn('ErrorHandler', 'MEDIUM SEVERITY ERROR', report);
        this.emit('mediumSeverityError', report);
    }
    handleLowSeverityError(report) {
        Logger_1.logger.info('ErrorHandler', 'LOW SEVERITY ERROR', report);
        this.emit('lowSeverityError', report);
    }
    registerRetryStrategy(errorType, strategy) {
        this.retryStrategies.set(errorType, strategy);
    }
    canRetry(report) {
        return report.retryCount < 3 &&
            report.severity !== ErrorSeverity.CRITICAL &&
            !this.isCircuitBreakerOpen(report.context.module);
    }
    async scheduleRetry(report) {
        const delay = Math.pow(2, report.retryCount) * 1000; // Exponential backoff
        setTimeout(async () => {
            report.retryCount++;
            const strategy = this.retryStrategies.get(report.error.constructor.name);
            if (strategy) {
                try {
                    const success = await strategy(report.error, report.context);
                    if (success) {
                        report.handled = true;
                        Logger_1.logger.info('ErrorHandler', `Error ${report.id} resolved after ${report.retryCount} retries`);
                        this.emit('errorResolved', report);
                    }
                    else if (this.canRetry(report)) {
                        this.scheduleRetry(report);
                    }
                }
                catch (retryError) {
                    Logger_1.logger.error('ErrorHandler', 'Retry strategy failed', retryError, { originalReport: report });
                }
            }
        }, delay);
    }
    async attemptRecovery(report) {
        try {
            // Module-specific recovery strategies
            switch (report.context.module) {
                case 'AgentMeshConnector':
                    await this.recoverNetworkConnection(report);
                    break;
                case 'XRManager':
                    await this.recoverXRSession(report);
                    break;
                case 'SwarmVisualizer':
                    await this.recoverVisualization(report);
                    break;
                default:
                    Logger_1.logger.debug('ErrorHandler', `No recovery strategy for module: ${report.context.module}`);
            }
        }
        catch (recoveryError) {
            Logger_1.logger.error('ErrorHandler', 'Recovery attempt failed', recoveryError, { originalReport: report });
        }
    }
    async recoverNetworkConnection(report) {
        Logger_1.logger.info('ErrorHandler', 'Attempting network connection recovery');
        // Implementation would depend on the specific connector
        this.emit('recoveryAttempt', { type: 'network', report });
    }
    async recoverXRSession(report) {
        Logger_1.logger.info('ErrorHandler', 'Attempting XR session recovery');
        // Implementation would depend on the XR manager
        this.emit('recoveryAttempt', { type: 'xr', report });
    }
    async recoverVisualization(report) {
        Logger_1.logger.info('ErrorHandler', 'Attempting visualization recovery');
        // Implementation would depend on the visualizer
        this.emit('recoveryAttempt', { type: 'visualization', report });
    }
    reportToUser(report) {
        const userMessage = this.generateUserFriendlyMessage(report);
        this.emit('userNotification', {
            type: 'error',
            severity: report.severity,
            message: userMessage,
            errorId: report.id
        });
    }
    generateUserFriendlyMessage(report) {
        switch (report.severity) {
            case ErrorSeverity.CRITICAL:
                return 'A critical error occurred. The application may not function properly. Please restart.';
            case ErrorSeverity.HIGH:
                return 'An important feature is not working correctly. We\'re trying to fix it automatically.';
            case ErrorSeverity.MEDIUM:
                return 'A minor issue was detected. The application should continue to work normally.';
            case ErrorSeverity.LOW:
                return 'A small issue was logged for debugging purposes.';
            default:
                return 'An error occurred.';
        }
    }
    activateCircuitBreaker(module) {
        if (!this.circuitBreakers.has(module)) {
            this.circuitBreakers.set(module, new CircuitBreaker());
        }
        const breaker = this.circuitBreakers.get(module);
        breaker.open();
        Logger_1.logger.warn('ErrorHandler', `Circuit breaker activated for module: ${module}`);
    }
    isCircuitBreakerOpen(module) {
        const breaker = this.circuitBreakers.get(module);
        return breaker ? breaker.isOpenNow() : false;
    }
    generateErrorId() {
        return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    getErrorReport(errorId) {
        return this.errorReports.get(errorId);
    }
    getErrorReports(filter) {
        let reports = Array.from(this.errorReports.values());
        if (filter) {
            if (filter.severity) {
                reports = reports.filter(r => r.severity === filter.severity);
            }
            if (filter.module) {
                reports = reports.filter(r => r.context.module === filter.module);
            }
            if (filter.handled !== undefined) {
                reports = reports.filter(r => r.handled === filter.handled);
            }
            if (filter.since) {
                reports = reports.filter(r => r.timestamp >= filter.since);
            }
        }
        return reports.sort((a, b) => b.timestamp - a.timestamp);
    }
    clearErrorReports() {
        this.errorReports.clear();
        Logger_1.logger.info('ErrorHandler', 'Error reports cleared');
    }
    exportErrorReports() {
        const reports = Array.from(this.errorReports.values());
        return JSON.stringify(reports, null, 2);
    }
}
exports.ErrorHandler = ErrorHandler;
class CircuitBreaker {
    isOpen = false;
    timeout = 60000; // 1 minute
    open() {
        this.isOpen = true;
        // Auto-close after timeout
        setTimeout(() => {
            this.close();
        }, this.timeout);
    }
    close() {
        this.isOpen = false;
    }
    isOpenNow() {
        return this.isOpen;
    }
}
exports.errorHandler = ErrorHandler.getInstance();
