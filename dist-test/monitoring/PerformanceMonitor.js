"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PerformanceMonitor = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("../utils/Logger");
class PerformanceMonitor extends eventemitter3_1.EventEmitter {
    metrics = [];
    currentMetrics = {};
    thresholds;
    budget;
    monitoringInterval;
    isMonitoring = false;
    lastFrameTime = 0;
    frameCount = 0;
    maxHistorySize = 1000;
    // Performance observers
    performanceObserver;
    memoryCheckInterval;
    constructor(thresholds = {
        minFPS: 30,
        maxRenderTime: 33, // ~30fps
        maxMemoryUsage: 500, // MB
        maxCPUUsage: 80 // %
    }, budget = {
        targetFPS: 60,
        maxAgents: 1000,
        maxTriangles: 100000,
        maxDrawCalls: 100
    }) {
        super();
        this.thresholds = thresholds;
        this.budget = budget;
        this.setupPerformanceObserver();
    }
    startMonitoring(intervalMs = 1000) {
        if (this.isMonitoring)
            return;
        this.isMonitoring = true;
        this.lastFrameTime = performance.now();
        this.monitoringInterval = setInterval(() => {
            this.collectMetrics();
        }, intervalMs);
        this.memoryCheckInterval = setInterval(() => {
            this.checkMemoryUsage();
        }, 5000);
        Logger_1.logger.info('PerformanceMonitor', 'Performance monitoring started');
    }
    stopMonitoring() {
        if (!this.isMonitoring)
            return;
        this.isMonitoring = false;
        if (this.monitoringInterval) {
            clearInterval(this.monitoringInterval);
            this.monitoringInterval = undefined;
        }
        if (this.memoryCheckInterval) {
            clearInterval(this.memoryCheckInterval);
            this.memoryCheckInterval = undefined;
        }
        if (this.performanceObserver) {
            this.performanceObserver.disconnect();
        }
        Logger_1.logger.info('PerformanceMonitor', 'Performance monitoring stopped');
    }
    setupPerformanceObserver() {
        if (typeof PerformanceObserver !== 'undefined') {
            try {
                this.performanceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        if (entry.entryType === 'measure') {
                            this.handlePerformanceMeasure(entry);
                        }
                    }
                });
                this.performanceObserver.observe({
                    entryTypes: ['measure', 'navigation', 'resource']
                });
            }
            catch (error) {
                Logger_1.logger.warn('PerformanceMonitor', 'Performance Observer not supported', error);
            }
        }
    }
    handlePerformanceMeasure(entry) {
        switch (entry.name) {
            case 'render':
                this.currentMetrics.renderTime = entry.duration;
                break;
            case 'update':
                this.currentMetrics.updateTime = entry.duration;
                break;
        }
    }
    collectMetrics() {
        const now = performance.now();
        const deltaTime = now - this.lastFrameTime;
        const metrics = {
            fps: this.calculateFPS(deltaTime),
            renderTime: this.currentMetrics.renderTime || 0,
            updateTime: this.currentMetrics.updateTime || 0,
            memoryUsage: this.getMemoryUsage(),
            agentCount: this.currentMetrics.agentCount || 0,
            triangleCount: this.currentMetrics.triangleCount || 0,
            drawCalls: this.currentMetrics.drawCalls || 0,
            cpuUsage: this.estimateCPUUsage(),
            gpuUsage: this.currentMetrics.gpuUsage,
            networkLatency: this.currentMetrics.networkLatency,
            timestamp: now
        };
        this.addMetrics(metrics);
        this.checkThresholds(metrics);
        this.optimizeIfNeeded(metrics);
        this.lastFrameTime = now;
    }
    calculateFPS(deltaTime) {
        if (deltaTime === 0)
            return 0;
        return Math.round(1000 / deltaTime);
    }
    getMemoryUsage() {
        if ('memory' in performance) {
            const memory = performance.memory;
            return Math.round(memory.usedJSHeapSize / 1024 / 1024); // MB
        }
        return 0;
    }
    estimateCPUUsage() {
        // Simple CPU usage estimation based on frame time
        const renderTime = this.currentMetrics.renderTime || 0;
        const updateTime = this.currentMetrics.updateTime || 0;
        const totalTime = renderTime + updateTime;
        // Assume 60fps target (16.67ms per frame)
        const targetFrameTime = 1000 / this.budget.targetFPS;
        return Math.min(100, (totalTime / targetFrameTime) * 100);
    }
    checkMemoryUsage() {
        const memoryUsage = this.getMemoryUsage();
        if (memoryUsage > this.thresholds.maxMemoryUsage) {
            this.emit('memoryWarning', {
                current: memoryUsage,
                threshold: this.thresholds.maxMemoryUsage
            });
            Logger_1.logger.warn('PerformanceMonitor', `Memory usage high: ${memoryUsage}MB`, {
                threshold: this.thresholds.maxMemoryUsage
            });
        }
    }
    addMetrics(metrics) {
        this.metrics.push(metrics);
        // Maintain history size
        if (this.metrics.length > this.maxHistorySize) {
            this.metrics.shift();
        }
        this.emit('metricsUpdated', metrics);
    }
    checkThresholds(metrics) {
        const warnings = [];
        if (metrics.fps < this.thresholds.minFPS) {
            warnings.push(`Low FPS: ${metrics.fps} (min: ${this.thresholds.minFPS})`);
        }
        if (metrics.renderTime > this.thresholds.maxRenderTime) {
            warnings.push(`High render time: ${metrics.renderTime}ms (max: ${this.thresholds.maxRenderTime}ms)`);
        }
        if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
            warnings.push(`High memory usage: ${metrics.memoryUsage}MB (max: ${this.thresholds.maxMemoryUsage}MB)`);
        }
        if (metrics.cpuUsage > this.thresholds.maxCPUUsage) {
            warnings.push(`High CPU usage: ${metrics.cpuUsage}% (max: ${this.thresholds.maxCPUUsage}%)`);
        }
        if (warnings.length > 0) {
            this.emit('performanceWarning', {
                metrics,
                warnings
            });
            Logger_1.logger.warn('PerformanceMonitor', 'Performance thresholds exceeded', { warnings, metrics });
        }
    }
    optimizeIfNeeded(metrics) {
        const suggestions = [];
        // FPS optimization suggestions
        if (metrics.fps < this.thresholds.minFPS) {
            if (metrics.agentCount > this.budget.maxAgents * 0.8) {
                suggestions.push('Consider reducing agent count or implementing LOD');
            }
            if (metrics.triangleCount > this.budget.maxTriangles * 0.8) {
                suggestions.push('Consider using lower-poly models or instancing');
            }
            if (metrics.drawCalls > this.budget.maxDrawCalls * 0.8) {
                suggestions.push('Consider batching draw calls or using instanced rendering');
            }
        }
        // Memory optimization suggestions
        if (metrics.memoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
            suggestions.push('Consider garbage collection or reducing cached data');
        }
        if (suggestions.length > 0) {
            this.emit('optimizationSuggestions', {
                metrics,
                suggestions
            });
        }
    }
    measurePerformance(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        performance.mark(startMark);
        const result = fn();
        performance.mark(endMark);
        performance.measure(name, startMark, endMark);
        return result;
    }
    async measureAsync(name, fn) {
        const startMark = `${name}-start`;
        const endMark = `${name}-end`;
        performance.mark(startMark);
        const result = await fn();
        performance.mark(endMark);
        performance.measure(name, startMark, endMark);
        return result;
    }
    updateAgentCount(count) {
        this.currentMetrics.agentCount = count;
    }
    updateRenderStats(stats) {
        Object.assign(this.currentMetrics, stats);
    }
    updateNetworkLatency(latency) {
        this.currentMetrics.networkLatency = latency;
    }
    getCurrentMetrics() {
        return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null;
    }
    getMetricsHistory(since) {
        if (since) {
            return this.metrics.filter(m => m.timestamp >= since);
        }
        return [...this.metrics];
    }
    getAverageMetrics(windowSize = 60) {
        const recent = this.metrics.slice(-windowSize);
        if (recent.length === 0)
            return {};
        const sum = recent.reduce((acc, metrics) => ({
            fps: acc.fps + metrics.fps,
            renderTime: acc.renderTime + metrics.renderTime,
            updateTime: acc.updateTime + metrics.updateTime,
            memoryUsage: acc.memoryUsage + metrics.memoryUsage,
            cpuUsage: acc.cpuUsage + metrics.cpuUsage
        }), { fps: 0, renderTime: 0, updateTime: 0, memoryUsage: 0, cpuUsage: 0 });
        const count = recent.length;
        return {
            fps: Math.round(sum.fps / count),
            renderTime: Math.round(sum.renderTime / count),
            updateTime: Math.round(sum.updateTime / count),
            memoryUsage: Math.round(sum.memoryUsage / count),
            cpuUsage: Math.round(sum.cpuUsage / count)
        };
    }
    getPerformanceReport() {
        const current = this.getCurrentMetrics();
        const average = this.getAverageMetrics();
        const isHealthy = current ?
            current.fps >= this.thresholds.minFPS &&
                current.renderTime <= this.thresholds.maxRenderTime &&
                current.memoryUsage <= this.thresholds.maxMemoryUsage &&
                current.cpuUsage <= this.thresholds.maxCPUUsage :
            false;
        return {
            current,
            average,
            thresholds: this.thresholds,
            budget: this.budget,
            isHealthy
        };
    }
    exportMetrics() {
        return JSON.stringify({
            metrics: this.metrics,
            thresholds: this.thresholds,
            budget: this.budget,
            exportTime: Date.now()
        }, null, 2);
    }
    clearMetrics() {
        this.metrics = [];
        this.currentMetrics = {};
        Logger_1.logger.info('PerformanceMonitor', 'Metrics cleared');
    }
    dispose() {
        this.stopMonitoring();
        this.clearMetrics();
        this.removeAllListeners();
    }
}
exports.PerformanceMonitor = PerformanceMonitor;
