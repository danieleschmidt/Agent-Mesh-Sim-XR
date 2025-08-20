"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumMonitor = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("../utils/Logger");
const QuantumErrorHandler_1 = require("./QuantumErrorHandler");
class QuantumMonitor extends eventemitter3_1.EventEmitter {
    monitoredSystems = new Map();
    metricsHistory = new Map();
    activeAlerts = new Map();
    thresholds;
    errorHandler;
    monitoringActive = false;
    monitoringInterval = null;
    metricsRetentionPeriod = 24 * 60 * 60 * 1000; // 24 hours
    constructor(errorHandler) {
        super();
        this.errorHandler = errorHandler;
        this.thresholds = {
            coherence: { warning: 0.5, critical: 0.3 },
            errorRate: { warning: 0.1, critical: 0.25 },
            performance: { warning: 60, critical: 30 },
            memoryUsage: { warning: 70, critical: 90 },
            cpuUsage: { warning: 80, critical: 95 },
            interferenceNoise: { warning: 2.0, critical: 5.0 }
        };
        this.setupErrorHandlerIntegration();
    }
    // Start monitoring quantum systems
    startMonitoring(intervalMs = 5000) {
        if (this.monitoringActive) {
            Logger_1.logger.warn('QuantumMonitor', 'Monitoring already active');
            return;
        }
        this.monitoringActive = true;
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.evaluateSystemHealth();
            this.checkThresholds();
            this.cleanupOldMetrics();
        }, intervalMs);
        Logger_1.logger.info('QuantumMonitor', 'Quantum monitoring started', { intervalMs });
        this.emit('monitoringStarted', { intervalMs });
    }
    // Stop monitoring
    stopMonitoring() {
        if (!this.monitoringActive)
            return;
        this.monitoringActive = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
        Logger_1.logger.info('QuantumMonitor', 'Quantum monitoring stopped');
        this.emit('monitoringStopped');
    }
    // Register a quantum system for monitoring
    registerQuantumSystem(systemId) {
        if (this.monitoredSystems.has(systemId)) {
            Logger_1.logger.warn('QuantumMonitor', 'System already registered', { systemId });
            return;
        }
        const health = {
            systemId,
            overallHealth: 'HEALTHY',
            coherenceLevel: 1.0,
            entanglementStability: 1.0,
            interferenceNoise: 0.0,
            computationalLoad: 0.0,
            errorRate: 0.0,
            lastUpdate: Date.now(),
            components: {
                superposition: this.createInitialComponentHealth(),
                interference: this.createInitialComponentHealth(),
                annealing: this.createInitialComponentHealth(),
                planner: this.createInitialComponentHealth()
            }
        };
        this.monitoredSystems.set(systemId, health);
        this.metricsHistory.set(systemId, []);
        Logger_1.logger.info('QuantumMonitor', 'Quantum system registered for monitoring', { systemId });
        this.emit('systemRegistered', { systemId });
    }
    // Unregister a quantum system
    unregisterQuantumSystem(systemId) {
        if (!this.monitoredSystems.has(systemId))
            return;
        this.monitoredSystems.delete(systemId);
        this.metricsHistory.delete(systemId);
        // Remove associated alerts
        const systemAlerts = Array.from(this.activeAlerts.values())
            .filter(alert => alert.systemId === systemId);
        systemAlerts.forEach(alert => {
            this.activeAlerts.delete(alert.id);
        });
        Logger_1.logger.info('QuantumMonitor', 'Quantum system unregistered', { systemId });
        this.emit('systemUnregistered', { systemId });
    }
    // Update system metrics
    updateSystemMetrics(systemId, metrics) {
        const system = this.monitoredSystems.get(systemId);
        if (!system) {
            Logger_1.logger.warn('QuantumMonitor', 'Cannot update metrics for unregistered system', { systemId });
            return;
        }
        // Update system health based on new metrics
        if (metrics.coherenceMetrics) {
            system.coherenceLevel = metrics.coherenceMetrics.averageCoherence;
        }
        if (metrics.errorMetrics) {
            system.errorRate = metrics.errorMetrics.errorRate;
        }
        if (metrics.performanceMetrics) {
            system.computationalLoad = 100 - metrics.performanceMetrics.throughput;
        }
        system.lastUpdate = Date.now();
        // Store full metrics
        const fullMetrics = {
            timestamp: Date.now(),
            systemId,
            coherenceMetrics: {
                averageCoherence: 0.8,
                coherenceStability: 0.9,
                decoherenceRate: 0.01,
                quantumVolume: 100,
                ...metrics.coherenceMetrics
            },
            performanceMetrics: {
                planningTime: 0,
                convergenceRate: 0.85,
                optimizationGain: 0.2,
                throughput: 80,
                ...metrics.performanceMetrics
            },
            errorMetrics: {
                totalErrors: 0,
                errorRate: 0.01,
                criticalErrors: 0,
                recoveryRate: 0.95,
                ...metrics.errorMetrics
            },
            resourceMetrics: {
                memoryUsage: 30,
                cpuUsage: 40,
                networkLatency: 50,
                storageUsage: 20,
                ...metrics.resourceMetrics
            }
        };
        let history = this.metricsHistory.get(systemId) || [];
        history.push(fullMetrics);
        // Keep only recent metrics
        const cutoff = Date.now() - this.metricsRetentionPeriod;
        history = history.filter(m => m.timestamp > cutoff);
        this.metricsHistory.set(systemId, history);
        this.emit('metricsUpdated', { systemId, metrics: fullMetrics });
    }
    // Report component error
    reportComponentError(systemId, component, error) {
        const system = this.monitoredSystems.get(systemId);
        if (!system)
            return;
        const componentHealth = system.components[component];
        if (componentHealth) {
            componentHealth.errorCount++;
            componentHealth.lastError = error;
            // Update component status based on error severity
            switch (error.severity) {
                case QuantumErrorHandler_1.QuantumErrorSeverity.CRITICAL:
                    componentHealth.status = 'CRITICAL';
                    break;
                case QuantumErrorHandler_1.QuantumErrorSeverity.HIGH:
                    componentHealth.status = 'DEGRADED';
                    break;
                default:
                    if (componentHealth.errorCount > 10) {
                        componentHealth.status = 'DEGRADED';
                    }
                    break;
            }
            this.evaluateSystemHealth();
            this.createAlert('ERROR', 'HIGH', systemId, component, `Component error: ${error.message}`, {
                errorId: error.id,
                errorType: error.type,
                severity: error.severity
            });
        }
    }
    // Get system health
    getSystemHealth(systemId) {
        return this.monitoredSystems.get(systemId) || null;
    }
    // Get all monitored systems
    getAllSystemsHealth() {
        return Array.from(this.monitoredSystems.values());
    }
    // Get system metrics history
    getMetricsHistory(systemId, hours = 1) {
        const history = this.metricsHistory.get(systemId) || [];
        const cutoff = Date.now() - (hours * 60 * 60 * 1000);
        return history.filter(metrics => metrics.timestamp > cutoff);
    }
    // Get active alerts
    getActiveAlerts(systemId) {
        const alerts = Array.from(this.activeAlerts.values());
        if (systemId) {
            return alerts.filter(alert => alert.systemId === systemId);
        }
        return alerts.filter(alert => !alert.resolved);
    }
    // Acknowledge alert
    acknowledgeAlert(alertId, userId) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.acknowledged = true;
            alert.details.acknowledgedBy = userId;
            alert.details.acknowledgedAt = Date.now();
            this.emit('alertAcknowledged', alert);
            Logger_1.logger.info('QuantumMonitor', 'Alert acknowledged', {
                alertId,
                userId,
                type: alert.type,
                systemId: alert.systemId
            });
            return true;
        }
        return false;
    }
    // Resolve alert
    resolveAlert(alertId, userId, resolution) {
        const alert = this.activeAlerts.get(alertId);
        if (alert) {
            alert.resolved = true;
            alert.resolutionTime = Date.now();
            alert.details.resolvedBy = userId;
            alert.details.resolution = resolution;
            this.emit('alertResolved', alert);
            Logger_1.logger.info('QuantumMonitor', 'Alert resolved', {
                alertId,
                userId,
                resolution,
                duration: alert.resolutionTime - alert.timestamp
            });
            return true;
        }
        return false;
    }
    // Get monitoring statistics
    getMonitoringStats() {
        const systems = Array.from(this.monitoredSystems.values());
        const alerts = Array.from(this.activeAlerts.values());
        return {
            monitoringActive: this.monitoringActive,
            systemsCount: systems.length,
            healthySystems: systems.filter(s => s.overallHealth === 'HEALTHY').length,
            degradedSystems: systems.filter(s => s.overallHealth === 'DEGRADED').length,
            criticalSystems: systems.filter(s => s.overallHealth === 'CRITICAL').length,
            offlineSystems: systems.filter(s => s.overallHealth === 'OFFLINE').length,
            activeAlerts: alerts.filter(a => !a.resolved).length,
            criticalAlerts: alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length,
            averageCoherence: this.calculateAverageCoherence(),
            averageErrorRate: this.calculateAverageErrorRate()
        };
    }
    // Private implementation methods
    collectMetrics() {
        this.monitoredSystems.forEach((system, systemId) => {
            // Simulate metric collection (in production, get real metrics)
            const metrics = {
                coherenceMetrics: {
                    averageCoherence: Math.max(0, system.coherenceLevel + (Math.random() - 0.5) * 0.1),
                    coherenceStability: 0.9 + Math.random() * 0.1,
                    decoherenceRate: 0.01 + Math.random() * 0.01,
                    quantumVolume: 80 + Math.random() * 40
                },
                performanceMetrics: {
                    planningTime: 100 + Math.random() * 200,
                    convergenceRate: 0.8 + Math.random() * 0.2,
                    optimizationGain: Math.random() * 0.5,
                    throughput: 70 + Math.random() * 30
                },
                errorMetrics: {
                    totalErrors: system.components.planner.errorCount,
                    errorRate: system.errorRate + (Math.random() - 0.5) * 0.02,
                    criticalErrors: Math.floor(Math.random() * 3),
                    recoveryRate: 0.9 + Math.random() * 0.1
                },
                resourceMetrics: {
                    memoryUsage: 20 + Math.random() * 60,
                    cpuUsage: 30 + Math.random() * 50,
                    networkLatency: 10 + Math.random() * 100,
                    storageUsage: 10 + Math.random() * 30
                }
            };
            this.updateSystemMetrics(systemId, metrics);
        });
    }
    evaluateSystemHealth() {
        this.monitoredSystems.forEach((system, systemId) => {
            let healthScore = 100;
            let componentIssues = 0;
            // Evaluate component health
            Object.values(system.components).forEach(component => {
                switch (component.status) {
                    case 'CRITICAL':
                        healthScore -= 30;
                        componentIssues++;
                        break;
                    case 'DEGRADED':
                        healthScore -= 15;
                        componentIssues++;
                        break;
                    case 'OFFLINE':
                        healthScore -= 40;
                        componentIssues++;
                        break;
                }
            });
            // Factor in coherence level
            if (system.coherenceLevel < this.thresholds.coherence.critical) {
                healthScore -= 25;
            }
            else if (system.coherenceLevel < this.thresholds.coherence.warning) {
                healthScore -= 10;
            }
            // Factor in error rate
            if (system.errorRate > this.thresholds.errorRate.critical) {
                healthScore -= 20;
            }
            else if (system.errorRate > this.thresholds.errorRate.warning) {
                healthScore -= 10;
            }
            // Determine overall health
            let overallHealth;
            if (healthScore >= 80 && componentIssues === 0) {
                overallHealth = 'HEALTHY';
            }
            else if (healthScore >= 50) {
                overallHealth = 'DEGRADED';
            }
            else if (healthScore >= 20) {
                overallHealth = 'CRITICAL';
            }
            else {
                overallHealth = 'OFFLINE';
            }
            if (system.overallHealth !== overallHealth) {
                const previousHealth = system.overallHealth;
                system.overallHealth = overallHealth;
                this.emit('healthChanged', {
                    systemId,
                    previousHealth,
                    currentHealth: overallHealth,
                    healthScore
                });
                // Create alert for health degradation
                if (overallHealth === 'CRITICAL' || overallHealth === 'OFFLINE') {
                    this.createAlert('PERFORMANCE', 'CRITICAL', systemId, 'system', `System health degraded to ${overallHealth}`, {
                        previousHealth,
                        healthScore,
                        componentIssues
                    });
                }
            }
        });
    }
    checkThresholds() {
        this.monitoredSystems.forEach((system, systemId) => {
            const latestMetrics = this.getLatestMetrics(systemId);
            if (!latestMetrics)
                return;
            // Check coherence thresholds
            if (system.coherenceLevel < this.thresholds.coherence.critical) {
                this.createAlert('COHERENCE', 'CRITICAL', systemId, 'superposition', 'Critical coherence loss detected', {
                    currentCoherence: system.coherenceLevel,
                    threshold: this.thresholds.coherence.critical
                });
            }
            else if (system.coherenceLevel < this.thresholds.coherence.warning) {
                this.createAlert('COHERENCE', 'MEDIUM', systemId, 'superposition', 'Low coherence detected', {
                    currentCoherence: system.coherenceLevel,
                    threshold: this.thresholds.coherence.warning
                });
            }
            // Check resource thresholds
            if (latestMetrics.resourceMetrics.memoryUsage > this.thresholds.memoryUsage.critical) {
                this.createAlert('RESOURCE', 'HIGH', systemId, 'system', 'Critical memory usage', {
                    currentUsage: latestMetrics.resourceMetrics.memoryUsage,
                    threshold: this.thresholds.memoryUsage.critical
                });
            }
            if (latestMetrics.resourceMetrics.cpuUsage > this.thresholds.cpuUsage.critical) {
                this.createAlert('RESOURCE', 'HIGH', systemId, 'system', 'Critical CPU usage', {
                    currentUsage: latestMetrics.resourceMetrics.cpuUsage,
                    threshold: this.thresholds.cpuUsage.critical
                });
            }
        });
    }
    createAlert(type, severity, systemId, component, message, details) {
        // Check if similar alert already exists
        const existingAlert = Array.from(this.activeAlerts.values()).find(alert => alert.systemId === systemId &&
            alert.component === component &&
            alert.type === type &&
            !alert.resolved &&
            Date.now() - alert.timestamp < 300000 // 5 minutes
        );
        if (existingAlert) {
            // Update existing alert details
            existingAlert.details = { ...existingAlert.details, ...details };
            existingAlert.timestamp = Date.now();
            return;
        }
        const alert = {
            id: this.generateAlertId(),
            type,
            severity,
            systemId,
            component,
            message,
            details,
            timestamp: Date.now(),
            acknowledged: false,
            resolved: false
        };
        this.activeAlerts.set(alert.id, alert);
        this.emit('alertCreated', alert);
        Logger_1.logger.warn('QuantumMonitor', `Quantum alert: ${message}`, {
            alertId: alert.id,
            type,
            severity,
            systemId,
            component
        });
    }
    setupErrorHandlerIntegration() {
        this.errorHandler.on('quantumError', (error) => {
            if (error.context.systemId) {
                this.reportComponentError(error.context.systemId, error.context.component, error);
            }
        });
        this.errorHandler.on('criticalQuantumError', (error) => {
            if (error.context.systemId) {
                this.createAlert('ERROR', 'CRITICAL', error.context.systemId, error.context.component, `Critical quantum error: ${error.message}`, {
                    errorId: error.id,
                    errorType: error.type
                });
            }
        });
    }
    createInitialComponentHealth() {
        return {
            status: 'HEALTHY',
            performance: 100,
            errorCount: 0,
            uptime: Date.now(),
            memoryUsage: 0,
            cpuUsage: 0
        };
    }
    getLatestMetrics(systemId) {
        const history = this.metricsHistory.get(systemId);
        return history && history.length > 0 ? history[history.length - 1] : null;
    }
    cleanupOldMetrics() {
        const cutoff = Date.now() - this.metricsRetentionPeriod;
        this.metricsHistory.forEach((history, systemId) => {
            const filteredHistory = history.filter(metrics => metrics.timestamp > cutoff);
            this.metricsHistory.set(systemId, filteredHistory);
        });
        // Clean up resolved alerts older than 24 hours
        const alertCutoff = Date.now() - (24 * 60 * 60 * 1000);
        const expiredAlerts = [];
        this.activeAlerts.forEach((alert, alertId) => {
            if (alert.resolved && alert.timestamp < alertCutoff) {
                expiredAlerts.push(alertId);
            }
        });
        expiredAlerts.forEach(alertId => {
            this.activeAlerts.delete(alertId);
        });
    }
    calculateAverageCoherence() {
        const systems = Array.from(this.monitoredSystems.values());
        if (systems.length === 0)
            return 0;
        const totalCoherence = systems.reduce((sum, system) => sum + system.coherenceLevel, 0);
        return totalCoherence / systems.length;
    }
    calculateAverageErrorRate() {
        const systems = Array.from(this.monitoredSystems.values());
        if (systems.length === 0)
            return 0;
        const totalErrorRate = systems.reduce((sum, system) => sum + system.errorRate, 0);
        return totalErrorRate / systems.length;
    }
    generateAlertId() {
        return `qalert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    // Configuration methods
    updateThresholds(thresholds) {
        this.thresholds = { ...this.thresholds, ...thresholds };
        Logger_1.logger.info('QuantumMonitor', 'Monitoring thresholds updated', { thresholds });
        this.emit('thresholdsUpdated', this.thresholds);
    }
    getThresholds() {
        return { ...this.thresholds };
    }
    // Cleanup
    dispose() {
        Logger_1.logger.info('QuantumMonitor', 'Disposing quantum monitor');
        this.stopMonitoring();
        this.monitoredSystems.clear();
        this.metricsHistory.clear();
        this.activeAlerts.clear();
        this.removeAllListeners();
    }
}
exports.QuantumMonitor = QuantumMonitor;
