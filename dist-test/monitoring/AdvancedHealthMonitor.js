"use strict";
/**
 * Advanced Health Monitoring System
 * Comprehensive system health monitoring with predictive failure detection
 */
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdvancedHealthMonitor = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("../utils/Logger");
class AdvancedHealthMonitor extends eventemitter3_1.EventEmitter {
    metrics = new Map();
    healthChecks = new Map();
    monitoringInterval;
    checkInterval;
    isMonitoring = false;
    startTime = Date.now();
    circuitBreakers = new Map();
    predictions = new Map();
    constructor() {
        super();
        this.initializeDefaultChecks();
        this.initializeDefaultMetrics();
    }
    initializeDefaultChecks() {
        // Memory health check
        this.addHealthCheck('memory', async () => {
            if (typeof window !== 'undefined' && 'performance' in window && 'memory' in performance) {
                const memory = performance.memory;
                const usageRatio = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
                return usageRatio < 0.9;
            }
            return true; // Unknown memory state, assume healthy
        }, 10000);
        // Performance health check
        this.addHealthCheck('performance', async () => {
            if (typeof window !== 'undefined' && 'performance' in window) {
                const entries = performance.getEntriesByType('navigation');
                if (entries.length > 0) {
                    const navigation = entries[0];
                    return navigation.loadEventEnd - navigation.loadEventStart < 5000;
                }
            }
            return true;
        }, 30000);
        // Connection health check
        this.addHealthCheck('connectivity', async () => {
            if (typeof navigator !== 'undefined' && 'connection' in navigator) {
                const connection = navigator.connection;
                return connection.effectiveType !== 'slow-2g' && connection.downlink > 1;
            }
            return true;
        }, 15000);
        // Error rate health check
        this.addHealthCheck('error_rate', async () => {
            const errorCount = this.getRecentErrorCount();
            return errorCount < 10; // Less than 10 errors in last minute
        }, 60000);
    }
    initializeDefaultMetrics() {
        const defaultMetrics = [
            { name: 'cpu_usage', threshold: 80 },
            { name: 'memory_usage', threshold: 85 },
            { name: 'fps', threshold: 30 },
            { name: 'render_time', threshold: 33 },
            { name: 'network_latency', threshold: 500 },
            { name: 'error_rate', threshold: 5 },
            { name: 'agent_count', threshold: 1000 },
            { name: 'active_connections', threshold: 100 }
        ];
        defaultMetrics.forEach(metric => {
            this.metrics.set(metric.name, []);
        });
    }
    addHealthCheck(name, check, interval = 30000, timeout = 5000, retries = 3) {
        const healthCheck = {
            id: `check_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
            name,
            check,
            interval,
            timeout,
            retries,
            consecutiveFailures: 0
        };
        this.healthChecks.set(name, healthCheck);
        Logger_1.logger.info('AdvancedHealthMonitor', 'Health check added', { name, interval, timeout });
    }
    removeHealthCheck(name) {
        const removed = this.healthChecks.delete(name);
        if (removed) {
            Logger_1.logger.info('AdvancedHealthMonitor', 'Health check removed', { name });
        }
        return removed;
    }
    startMonitoring() {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        // Start metric collection
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
            this.analyzeMetrics();
            this.generatePredictions();
        }, 5000);
        // Start health checks
        this.checkInterval = setInterval(() => {
            this.runHealthChecks();
        }, 10000);
        this.emit('monitoring_started');
        Logger_1.logger.info('AdvancedHealthMonitor', 'Health monitoring started');
    }
    stopMonitoring() {
        if (!this.isMonitoring)
            return;
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        if (this.checkInterval) {
            clearInterval(this.checkInterval);
            this.checkInterval = undefined;
        }
        this.emit('monitoring_stopped');
        Logger_1.logger.info('AdvancedHealthMonitor', 'Health monitoring stopped');
    }
    recordMetric(name, value, threshold) {
        const existingMetrics = this.metrics.get(name) || [];
        const currentTime = Date.now();
        // Calculate trend
        const trend = this.calculateTrend(existingMetrics, value);
        // Determine status
        const metricThreshold = threshold || this.getDefaultThreshold(name);
        let status = 'healthy';
        if (value > metricThreshold * 0.8) {
            status = 'warning';
        }
        if (value > metricThreshold) {
            status = 'critical';
        }
        const metric = {
            name,
            value,
            threshold: metricThreshold,
            status,
            timestamp: currentTime,
            trend
        };
        // Add prediction if available
        const prediction = this.predictions.get(name);
        if (prediction) {
            metric.prediction = prediction.confidence;
        }
        existingMetrics.push(metric);
        // Keep only recent metrics (last 100 entries)
        if (existingMetrics.length > 100) {
            existingMetrics.shift();
        }
        this.metrics.set(name, existingMetrics);
        // Emit events for status changes
        if (status === 'critical') {
            this.emit('metric_critical', metric);
            this.handleCriticalMetric(metric);
        }
        else if (status === 'warning') {
            this.emit('metric_warning', metric);
        }
        // Check for circuit breaker triggers
        this.checkCircuitBreaker(name, status);
    }
    collectMetrics() {
        // Collect performance metrics
        if (typeof window !== 'undefined' && 'performance' in window) {
            const memory = performance.memory;
            if (memory) {
                const memoryUsage = (memory.usedJSHeapSize / memory.jsHeapSizeLimit) * 100;
                this.recordMetric('memory_usage', memoryUsage, 85);
            }
            // Collect timing metrics
            const entries = performance.getEntriesByType('measure');
            const renderEntries = entries.filter(entry => entry.name.includes('render'));
            if (renderEntries.length > 0) {
                const avgRenderTime = renderEntries.reduce((sum, entry) => sum + entry.duration, 0) / renderEntries.length;
                this.recordMetric('render_time', avgRenderTime, 33);
            }
        }
        // Collect network metrics
        if (typeof navigator !== 'undefined' && 'connection' in navigator) {
            const connection = navigator.connection;
            if (connection) {
                this.recordMetric('network_quality', connection.downlink * 10, 50);
                this.recordMetric('network_latency', connection.rtt || 0, 500);
            }
        }
        // Collect error rate
        const errorRate = this.calculateErrorRate();
        this.recordMetric('error_rate', errorRate, 5);
    }
    calculateTrend(metrics, currentValue) {
        if (metrics.length < 3)
            return 'stable';
        const recent = metrics.slice(-3).map(m => m.value);
        const trend = recent[2] - recent[0];
        const changePercentage = Math.abs(trend) / recent[0];
        if (changePercentage < 0.05)
            return 'stable';
        return trend < 0 ? 'improving' : 'degrading';
    }
    getDefaultThreshold(name) {
        const thresholds = {
            cpu_usage: 80,
            memory_usage: 85,
            fps: 30,
            render_time: 33,
            network_latency: 500,
            error_rate: 5,
            agent_count: 1000,
            active_connections: 100
        };
        return thresholds[name] || 100;
    }
    async runHealthChecks() {
        for (const [name, check] of this.healthChecks) {
            try {
                const startTime = Date.now();
                const timeoutPromise = new Promise((_, reject) => {
                    setTimeout(() => reject(new Error('Health check timeout')), check.timeout);
                });
                const result = await Promise.race([check.check(), timeoutPromise]);
                const duration = Date.now() - startTime;
                check.lastRun = Date.now();
                check.lastResult = result;
                if (result) {
                    check.consecutiveFailures = 0;
                    this.emit('health_check_passed', { name, duration });
                }
                else {
                    check.consecutiveFailures++;
                    this.emit('health_check_failed', { name, consecutiveFailures: check.consecutiveFailures });
                    if (check.consecutiveFailures >= check.retries) {
                        this.emit('health_check_critical', { name, consecutiveFailures: check.consecutiveFailures });
                        this.handleFailedHealthCheck(name, check);
                    }
                }
            }
            catch (error) {
                check.consecutiveFailures++;
                Logger_1.logger.error('AdvancedHealthMonitor', 'Health check error', {
                    name,
                    error: error.message,
                    consecutiveFailures: check.consecutiveFailures
                });
                this.emit('health_check_error', { name, error, consecutiveFailures: check.consecutiveFailures });
            }
        }
    }
    analyzeMetrics() {
        // Analyze correlation between metrics
        const correlations = this.findMetricCorrelations();
        // Detect anomalies
        const anomalies = this.detectAnomalies();
        if (correlations.length > 0) {
            this.emit('metric_correlations', correlations);
        }
        if (anomalies.length > 0) {
            this.emit('metric_anomalies', anomalies);
        }
    }
    findMetricCorrelations() {
        const correlations = [];
        const metricNames = Array.from(this.metrics.keys());
        for (let i = 0; i < metricNames.length; i++) {
            for (let j = i + 1; j < metricNames.length; j++) {
                const metric1 = metricNames[i];
                const metric2 = metricNames[j];
                const correlation = this.calculateCorrelation(metric1, metric2);
                if (Math.abs(correlation) > 0.7) {
                    correlations.push({ metric1, metric2, correlation });
                }
            }
        }
        return correlations;
    }
    calculateCorrelation(metric1Name, metric2Name) {
        const metrics1 = this.metrics.get(metric1Name) || [];
        const metrics2 = this.metrics.get(metric2Name) || [];
        if (metrics1.length < 5 || metrics2.length < 5)
            return 0;
        const values1 = metrics1.slice(-10).map(m => m.value);
        const values2 = metrics2.slice(-10).map(m => m.value);
        const n = Math.min(values1.length, values2.length);
        if (n < 3)
            return 0;
        const mean1 = values1.reduce((a, b) => a + b, 0) / n;
        const mean2 = values2.reduce((a, b) => a + b, 0) / n;
        let numerator = 0;
        let sumSq1 = 0;
        let sumSq2 = 0;
        for (let i = 0; i < n; i++) {
            const diff1 = values1[i] - mean1;
            const diff2 = values2[i] - mean2;
            numerator += diff1 * diff2;
            sumSq1 += diff1 * diff1;
            sumSq2 += diff2 * diff2;
        }
        const denominator = Math.sqrt(sumSq1 * sumSq2);
        return denominator === 0 ? 0 : numerator / denominator;
    }
    detectAnomalies() {
        const anomalies = [];
        for (const [name, metrics] of this.metrics) {
            if (metrics.length < 10)
                continue;
            const recent = metrics.slice(-10).map(m => m.value);
            const mean = recent.reduce((a, b) => a + b, 0) / recent.length;
            const variance = recent.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / recent.length;
            const stdDev = Math.sqrt(variance);
            const latest = metrics[metrics.length - 1];
            const zScore = Math.abs(latest.value - mean) / (stdDev || 1);
            if (zScore > 2.5) { // 2.5 standard deviations
                anomalies.push({
                    metric: name,
                    value: latest.value,
                    expected: mean,
                    severity: Math.min(zScore / 3, 1)
                });
            }
        }
        return anomalies;
    }
    generatePredictions() {
        for (const [name, metrics] of this.metrics) {
            if (metrics.length < 20)
                continue;
            const prediction = this.predictMetricIssue(name, metrics);
            if (prediction) {
                this.predictions.set(name, prediction);
                if (prediction.confidence > 0.8 && prediction.timeToIssue < 300000) { // 5 minutes
                    this.emit('predicted_issue', { metric: name, ...prediction });
                }
            }
        }
    }
    predictMetricIssue(name, metrics) {
        const recent = metrics.slice(-20);
        if (recent.length < 20)
            return null;
        // Simple linear regression for trend prediction
        const values = recent.map(m => m.value);
        const times = recent.map(m => m.timestamp);
        const n = values.length;
        const sumX = times.reduce((a, b) => a + b, 0);
        const sumY = values.reduce((a, b) => a + b, 0);
        const sumXY = times.reduce((sum, x, i) => sum + x * values[i], 0);
        const sumXX = times.reduce((sum, x) => sum + x * x, 0);
        const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
        const intercept = (sumY - slope * sumX) / n;
        // Predict when threshold will be exceeded
        const threshold = recent[0].threshold;
        const currentTime = Date.now();
        const currentValue = values[values.length - 1];
        if (slope > 0 && currentValue < threshold) {
            const timeToThreshold = (threshold - intercept) / slope - currentTime;
            if (timeToThreshold > 0 && timeToThreshold < 1800000) { // Within 30 minutes
                return {
                    issue: `${name} will exceed threshold`,
                    confidence: Math.min(Math.abs(slope) * 0.1, 0.95),
                    timeToIssue: timeToThreshold
                };
            }
        }
        return null;
    }
    handleCriticalMetric(metric) {
        // Activate circuit breaker
        this.circuitBreakers.set(metric.name, true);
        // Log critical event
        Logger_1.logger.error('AdvancedHealthMonitor', 'Critical metric detected', {
            metric: metric.name,
            value: metric.value,
            threshold: metric.threshold,
            trend: metric.trend
        });
        // Auto-remediation attempts
        this.attemptAutoRemediation(metric);
    }
    handleFailedHealthCheck(name, check) {
        Logger_1.logger.error('AdvancedHealthMonitor', 'Health check failed critically', {
            name,
            consecutiveFailures: check.consecutiveFailures,
            retries: check.retries
        });
        // Trigger circuit breaker
        this.circuitBreakers.set(name, true);
        // Attempt recovery
        this.attemptHealthCheckRecovery(name);
    }
    attemptAutoRemediation(metric) {
        const remediationStrategies = {
            memory_usage: () => {
                this.emit('auto_remediation', { action: 'garbage_collection', metric: metric.name });
                if (typeof window !== 'undefined' && window.gc) {
                    window.gc();
                }
            },
            error_rate: () => {
                this.emit('auto_remediation', { action: 'error_rate_throttling', metric: metric.name });
            },
            cpu_usage: () => {
                this.emit('auto_remediation', { action: 'load_shedding', metric: metric.name });
            }
        };
        const strategy = remediationStrategies[metric.name];
        if (strategy) {
            try {
                strategy();
                Logger_1.logger.info('AdvancedHealthMonitor', 'Auto-remediation attempted', { metric: metric.name });
            }
            catch (error) {
                Logger_1.logger.error('AdvancedHealthMonitor', 'Auto-remediation failed', {
                    metric: metric.name,
                    error: error.message
                });
            }
        }
    }
    attemptHealthCheckRecovery(name) {
        // Implementation depends on specific health check
        this.emit('auto_recovery', { healthCheck: name, action: 'restart_component' });
        Logger_1.logger.info('AdvancedHealthMonitor', 'Health check recovery attempted', { name });
    }
    checkCircuitBreaker(metricName, status) {
        if (status === 'healthy' && this.circuitBreakers.get(metricName)) {
            // Close circuit breaker
            this.circuitBreakers.set(metricName, false);
            this.emit('circuit_breaker_closed', { metric: metricName });
            Logger_1.logger.info('AdvancedHealthMonitor', 'Circuit breaker closed', { metric: metricName });
        }
    }
    getRecentErrorCount() {
        // This would integrate with error tracking system
        return 0;
    }
    calculateErrorRate() {
        // This would calculate errors per minute
        return 0;
    }
    getHealthReport() {
        const currentTime = Date.now();
        const allMetrics = Array.from(this.metrics.entries())
            .map(([name, metrics]) => metrics[metrics.length - 1])
            .filter(metric => metric !== undefined);
        const criticalCount = allMetrics.filter(m => m.status === 'critical').length;
        const warningCount = allMetrics.filter(m => m.status === 'warning').length;
        let overall = 'healthy';
        if (criticalCount > 0) {
            overall = 'critical';
        }
        else if (warningCount > 0) {
            overall = 'degraded';
        }
        const checks = Array.from(this.healthChecks.values()).map(check => ({
            name: check.name,
            status: check.lastResult || false,
            lastRun: check.lastRun || 0
        }));
        const predictions = Array.from(this.predictions.entries()).map(([metric, pred]) => ({
            metric,
            predictedIssue: pred.issue,
            timeToIssue: pred.timeToIssue
        }));
        const recommendations = this.generateRecommendations(allMetrics, checks);
        return {
            overall,
            timestamp: currentTime,
            metrics: allMetrics,
            checks,
            predictions,
            recommendations,
            uptime: currentTime - this.startTime
        };
    }
    generateRecommendations(metrics, checks) {
        const recommendations = [];
        const criticalMetrics = metrics.filter(m => m.status === 'critical');
        const degradingMetrics = metrics.filter(m => m.trend === 'degrading');
        const failedChecks = checks.filter(c => !c.status);
        if (criticalMetrics.length > 0) {
            recommendations.push(`Immediate attention required: ${criticalMetrics.map(m => m.name).join(', ')}`);
        }
        if (degradingMetrics.length > 0) {
            recommendations.push(`Monitor degrading metrics: ${degradingMetrics.map(m => m.name).join(', ')}`);
        }
        if (failedChecks.length > 0) {
            recommendations.push(`Investigate failed checks: ${failedChecks.map(c => c.name).join(', ')}`);
        }
        return recommendations;
    }
    dispose() {
        this.stopMonitoring();
        this.metrics.clear();
        this.healthChecks.clear();
        this.circuitBreakers.clear();
        this.predictions.clear();
        this.removeAllListeners();
        Logger_1.logger.info('AdvancedHealthMonitor', 'Health monitor disposed');
    }
}
exports.AdvancedHealthMonitor = AdvancedHealthMonitor;
