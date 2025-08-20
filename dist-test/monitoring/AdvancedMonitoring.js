"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedMonitoring = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("../utils/Logger");
class AdvancedMonitoring extends eventemitter3_1.EventEmitter {
    metrics = new Map();
    metricConfigs = new Map();
    alertRules = new Map();
    activeAlerts = new Map();
    alertHistory = [];
    collectionInterval;
    alertEvaluationInterval;
    isRunning = false;
    constructor(config) {
        super();
        this.collectionInterval = config?.collectionInterval || 1000; // 1 second
        this.alertEvaluationInterval = config?.alertEvaluationInterval || 5000; // 5 seconds
        this.initializeDefaultMetrics();
        Logger_1.logger.info('AdvancedMonitoring', 'Advanced monitoring system initialized');
    }
    initializeDefaultMetrics() {
        // System Performance Metrics
        this.defineMetric({
            id: 'system_cpu_usage',
            name: 'CPU Usage',
            description: 'Current CPU usage percentage',
            unit: 'percent',
            type: 'gauge',
            thresholds: {
                warning: 70,
                critical: 90
            }
        });
        this.defineMetric({
            id: 'system_memory_usage',
            name: 'Memory Usage',
            description: 'Current memory usage in MB',
            unit: 'megabytes',
            type: 'gauge',
            thresholds: {
                warning: 1000,
                critical: 1500
            }
        });
        this.defineMetric({
            id: 'system_render_fps',
            name: 'Render FPS',
            description: 'Current rendering frames per second',
            unit: 'fps',
            type: 'gauge',
            thresholds: {
                warning: 30,
                critical: 15
            }
        });
        // Agent Metrics
        this.defineMetric({
            id: 'agents_total',
            name: 'Total Agents',
            description: 'Total number of active agents',
            unit: 'count',
            type: 'gauge',
            thresholds: {
                warning: 5000,
                critical: 8000
            }
        });
        this.defineMetric({
            id: 'agents_created_rate',
            name: 'Agent Creation Rate',
            description: 'Rate of agent creation per second',
            unit: 'per_second',
            type: 'counter',
            thresholds: {
                warning: 100,
                critical: 500
            }
        });
        this.defineMetric({
            id: 'agents_failed',
            name: 'Failed Agents',
            description: 'Number of agents in failed state',
            unit: 'count',
            type: 'gauge',
            thresholds: {
                warning: 10,
                critical: 50
            }
        });
        // Network Metrics
        this.defineMetric({
            id: 'network_latency',
            name: 'Network Latency',
            description: 'Average network latency in milliseconds',
            unit: 'milliseconds',
            type: 'gauge',
            thresholds: {
                warning: 100,
                critical: 250
            }
        });
        this.defineMetric({
            id: 'network_messages_rate',
            name: 'Message Rate',
            description: 'Network messages per second',
            unit: 'per_second',
            type: 'counter'
        });
        this.defineMetric({
            id: 'network_errors',
            name: 'Network Errors',
            description: 'Network error count',
            unit: 'count',
            type: 'counter',
            thresholds: {
                warning: 5,
                critical: 20
            }
        });
        // WebXR Metrics
        this.defineMetric({
            id: 'xr_session_active',
            name: 'XR Session Active',
            description: 'Whether XR session is currently active',
            unit: 'boolean',
            type: 'gauge'
        });
        this.defineMetric({
            id: 'xr_tracking_quality',
            name: 'XR Tracking Quality',
            description: 'Quality of XR tracking (0-1)',
            unit: 'ratio',
            type: 'gauge',
            thresholds: {
                warning: 0.7,
                critical: 0.5
            }
        });
        // Security Metrics
        this.defineMetric({
            id: 'security_threats_detected',
            name: 'Security Threats',
            description: 'Number of security threats detected',
            unit: 'count',
            type: 'counter',
            thresholds: {
                warning: 1,
                critical: 5
            }
        });
        this.defineMetric({
            id: 'security_failed_authentications',
            name: 'Failed Authentications',
            description: 'Number of failed authentication attempts',
            unit: 'count',
            type: 'counter',
            thresholds: {
                warning: 10,
                critical: 50
            }
        });
    }
    defineMetric(config) {
        this.metricConfigs.set(config.id, config);
        if (!this.metrics.has(config.id)) {
            this.metrics.set(config.id, new Metric(config));
        }
        Logger_1.logger.info('AdvancedMonitoring', 'Metric defined', { id: config.id, name: config.name });
    }
    recordMetric(id, value, tags) {
        const metric = this.metrics.get(id);
        if (!metric) {
            Logger_1.logger.warn('AdvancedMonitoring', 'Metric not found', { id });
            return;
        }
        metric.record(value, tags);
        this.emit('metricRecorded', { id, value, tags, timestamp: Date.now() });
    }
    incrementCounter(id, amount = 1, tags) {
        this.recordMetric(id, amount, tags);
    }
    setGauge(id, value, tags) {
        this.recordMetric(id, value, tags);
    }
    getMetric(id) {
        const metric = this.metrics.get(id);
        return metric ? metric.getSnapshot() : null;
    }
    getAllMetrics() {
        const snapshot = {};
        for (const [id, metric] of this.metrics) {
            snapshot[id] = metric.getSnapshot();
        }
        return snapshot;
    }
    addAlertRule(rule) {
        this.alertRules.set(rule.id, rule);
        Logger_1.logger.info('Alert rule added', { id: rule.id, name: rule.name });
    }
    removeAlertRule(id) {
        this.alertRules.delete(id);
        Logger_1.logger.info('Alert rule removed', { id });
    }
    enableAlertRule(id) {
        const rule = this.alertRules.get(id);
        if (rule) {
            rule.enabled = true;
            Logger_1.logger.info('Alert rule enabled', { id });
        }
    }
    disableAlertRule(id) {
        const rule = this.alertRules.get(id);
        if (rule) {
            rule.enabled = false;
            Logger_1.logger.info('Alert rule disabled', { id });
        }
    }
    evaluateAlerts() {
        const now = Date.now();
        for (const [ruleId, rule] of this.alertRules) {
            if (!rule.enabled)
                continue;
            const metric = this.getMetric(rule.metricId);
            if (!metric)
                continue;
            const shouldAlert = this.evaluateCondition(rule, metric.currentValue);
            const existingAlert = this.activeAlerts.get(ruleId);
            if (shouldAlert && !existingAlert) {
                // Create new alert
                const alert = {
                    id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    ruleId,
                    ruleName: rule.name,
                    severity: rule.severity,
                    message: this.generateAlertMessage(rule, metric.currentValue),
                    timestamp: now,
                    value: metric.currentValue,
                    threshold: rule.threshold,
                    status: 'active',
                    tags: metric.tags || {}
                };
                this.activeAlerts.set(ruleId, alert);
                this.alertHistory.push(alert);
                this.executeAlertActions(rule, alert);
                this.emit('alertTriggered', alert);
                Logger_1.logger.warn('Alert triggered', {
                    ruleId,
                    ruleName: rule.name,
                    severity: rule.severity,
                    value: metric.currentValue,
                    threshold: rule.threshold
                });
            }
            else if (!shouldAlert && existingAlert && existingAlert.status === 'active') {
                // Resolve existing alert
                existingAlert.status = 'resolved';
                this.activeAlerts.delete(ruleId);
                this.emit('alertResolved', existingAlert);
                Logger_1.logger.info('Alert resolved', {
                    ruleId,
                    alertId: existingAlert.id
                });
            }
        }
    }
    evaluateCondition(rule, value) {
        switch (rule.condition) {
            case 'greater_than':
                return value > rule.threshold;
            case 'less_than':
                return value < rule.threshold;
            case 'equals':
                return value === rule.threshold;
            case 'not_equals':
                return value !== rule.threshold;
            case 'change_rate':
                // TODO: Implement change rate evaluation
                return false;
            default:
                return false;
        }
    }
    generateAlertMessage(rule, value) {
        return `${rule.name}: ${rule.description} (Value: ${value}, Threshold: ${rule.threshold})`;
    }
    executeAlertActions(rule, alert) {
        for (const action of rule.actions) {
            try {
                this.executeAction(action, alert);
            }
            catch (error) {
                Logger_1.logger.error('Alert action failed', {
                    actionType: action.type,
                    alertId: alert.id,
                    error
                });
            }
        }
    }
    executeAction(action, alert) {
        switch (action.type) {
            case 'log':
                Logger_1.logger.warn(`ALERT: ${alert.message}`, {
                    alertId: alert.id,
                    severity: alert.severity
                });
                break;
            case 'webhook':
                if (action.config.url) {
                    // TODO: Implement webhook call
                    Logger_1.logger.info('Webhook alert action', { url: action.config.url, alert: alert.id });
                }
                break;
            case 'auto_recovery':
                this.emit('autoRecoveryRequested', {
                    alert,
                    recoveryType: action.config.recoveryType
                });
                break;
            default:
                Logger_1.logger.warn('Unknown alert action type', { type: action.type });
        }
    }
    acknowledgeAlert(alertId) {
        for (const alert of this.activeAlerts.values()) {
            if (alert.id === alertId) {
                alert.status = 'acknowledged';
                this.emit('alertAcknowledged', alert);
                Logger_1.logger.info('Alert acknowledged', { alertId });
                return;
            }
        }
    }
    getActiveAlerts() {
        return Array.from(this.activeAlerts.values());
    }
    getAlertHistory(limit = 100) {
        return this.alertHistory.slice(-limit);
    }
    collectSystemMetrics() {
        // CPU usage (mocked for now)
        const cpuUsage = this.getCpuUsage();
        this.setGauge('system_cpu_usage', cpuUsage);
        // Memory usage
        const memoryUsage = this.getMemoryUsage();
        this.setGauge('system_memory_usage', memoryUsage);
        // Additional system metrics would be collected here
    }
    collectAgentMetrics(agents) {
        this.setGauge('agents_total', agents.length);
        const failedAgents = agents.filter(agent => agent.currentState.status === 'error').length;
        this.setGauge('agents_failed', failedAgents);
    }
    collectNetworkMetrics(latency, messageRate, errors) {
        this.setGauge('network_latency', latency);
        this.recordMetric('network_messages_rate', messageRate);
        this.incrementCounter('network_errors', errors);
    }
    collectXRMetrics(sessionActive, trackingQuality) {
        this.setGauge('xr_session_active', sessionActive ? 1 : 0);
        this.setGauge('xr_tracking_quality', trackingQuality);
    }
    getCpuUsage() {
        // Mock CPU usage - in real implementation, this would use system APIs
        return Math.random() * 100;
    }
    getMemoryUsage() {
        // Memory usage in MB
        if (typeof process !== 'undefined' && process.memoryUsage) {
            return process.memoryUsage().heapUsed / (1024 * 1024);
        }
        return Math.random() * 1000;
    }
    start() {
        if (this.isRunning) {
            Logger_1.logger.warn('AdvancedMonitoring', 'System already running');
            return;
        }
        this.isRunning = true;
        // Start metric collection
        setInterval(() => {
            this.collectSystemMetrics();
        }, this.collectionInterval);
        // Start alert evaluation
        setInterval(() => {
            this.evaluateAlerts();
        }, this.alertEvaluationInterval);
        Logger_1.logger.info('AdvancedMonitoring', 'Monitoring system started');
        this.emit('started');
    }
    stop() {
        this.isRunning = false;
        Logger_1.logger.info('AdvancedMonitoring', 'Monitoring system stopped');
        this.emit('stopped');
    }
    getHealth() {
        const activeAlerts = this.getActiveAlerts();
        const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical');
        const highAlerts = activeAlerts.filter(a => a.severity === 'high');
        let status;
        if (criticalAlerts.length > 0) {
            status = 'critical';
        }
        else if (highAlerts.length > 0 || activeAlerts.length > 10) {
            status = 'warning';
        }
        else {
            status = 'healthy';
        }
        return {
            status,
            totalMetrics: this.metrics.size,
            activeAlerts: activeAlerts.length,
            criticalAlerts: criticalAlerts.length,
            isRunning: this.isRunning,
            uptime: Date.now() - (this.startTime || Date.now())
        };
    }
    startTime = Date.now();
    dispose() {
        this.stop();
        this.metrics.clear();
        this.metricConfigs.clear();
        this.alertRules.clear();
        this.activeAlerts.clear();
        this.alertHistory.splice(0);
        this.removeAllListeners();
        Logger_1.logger.info('AdvancedMonitoring', 'System disposed');
    }
}
exports.AdvancedMonitoring = AdvancedMonitoring;
// Metric class for storing and managing individual metrics
class Metric {
    config;
    values = [];
    maxSamples = 1000;
    constructor(config) {
        this.config = config;
    }
    record(value, tags) {
        this.values.push({
            value,
            timestamp: Date.now(),
            tags
        });
        // Keep only the last N samples
        if (this.values.length > this.maxSamples) {
            this.values = this.values.slice(-this.maxSamples);
        }
    }
    getSnapshot() {
        const recent = this.values.slice(-100); // Last 100 samples
        const values = recent.map(v => v.value);
        return {
            config: this.config,
            currentValue: values[values.length - 1] || 0,
            sampleCount: this.values.length,
            min: Math.min(...values),
            max: Math.max(...values),
            average: values.reduce((a, b) => a + b, 0) / values.length || 0,
            lastUpdated: recent[recent.length - 1]?.timestamp || 0,
            tags: recent[recent.length - 1]?.tags
        };
    }
}
