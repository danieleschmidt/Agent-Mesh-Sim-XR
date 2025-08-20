"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.AgentMeshXR = void 0;
const eventemitter3_1 = require("eventemitter3");
const XRManager_1 = require("./XRManager");
const AgentMeshConnector_1 = require("./AgentMeshConnector");
const SimpleSwarmVisualizer_1 = require("../visualization/SimpleSwarmVisualizer");
const TimeController_1 = require("../debugging/TimeController");
const PerformanceMonitor_1 = require("../monitoring/PerformanceMonitor");
const SecurityManager_1 = require("../security/SecurityManager");
const SimpleGPUAccelerator_1 = require("./SimpleGPUAccelerator");
const Logger_1 = require("../utils/Logger");
const ErrorHandler_1 = require("../utils/ErrorHandler");
const Validator_1 = require("../utils/Validator");
class AgentMeshXR extends eventemitter3_1.EventEmitter {
    xrManager;
    connector;
    swarmVisualizer;
    timeController;
    performanceMonitor;
    securityManager;
    gpuAccelerator;
    config;
    agents = new Map();
    isRunning = false;
    sessionId;
    healthCheckInterval;
    lastHealthCheck = 0;
    consecutiveFailures = 0;
    maxConsecutiveFailures = 3;
    circuitBreakerOpen = false;
    constructor(config) {
        super();
        try {
            // Validate configuration
            if (!config || typeof config !== 'object') {
                throw new Error('Invalid configuration provided');
            }
            this.config = config;
            this.sessionId = this.generateSessionId();
            // Initialize security manager
            this.securityManager = SecurityManager_1.SecurityManager.getInstance({
                maxAgentsPerUser: config.maxAgents,
                requireHTTPS: true
            });
            // Initialize performance monitor
            this.performanceMonitor = new PerformanceMonitor_1.PerformanceMonitor({
                minFPS: 30,
                maxRenderTime: 33,
                maxMemoryUsage: 500,
                maxCPUUsage: 80
            }, {
                targetFPS: 60,
                maxAgents: config.maxAgents,
                maxTriangles: 100000,
                maxDrawCalls: 100
            });
            this.xrManager = new XRManager_1.XRManager({
                vrSupported: config.vrSupport,
                arSupported: config.arSupport
            });
            this.connector = new AgentMeshConnector_1.AgentMeshConnector(config.networkConfig);
            this.swarmVisualizer = new SimpleSwarmVisualizer_1.SimpleSwarmVisualizer(this.xrManager.getScene(), {
                agentModel: 'geometric',
                colorScheme: 'byState',
                trailLength: 50,
                clusterDetection: false,
                lodEnabled: false
            });
            // Initialize GPU accelerator for scaling
            this.gpuAccelerator = new SimpleGPUAccelerator_1.SimpleGPUAccelerator({
                maxBatchSize: Math.min(config.maxAgents / 10, 100),
                enableInstancing: true,
                useWebWorkers: true,
                workerCount: Math.min(navigator.hardwareConcurrency || 4, 6)
            });
            this.setupEventListeners();
            this.setupErrorRecovery();
            this.startHealthCheck();
            Logger_1.logger.info('AgentMeshXR', 'AgentMeshXR initialized successfully', {
                sessionId: this.sessionId,
                config: this.config
            });
        }
        catch (error) {
            const errorId = ErrorHandler_1.errorHandler.handleError(error, ErrorHandler_1.ErrorSeverity.CRITICAL, { module: 'AgentMeshXR', function: 'constructor', timestamp: Date.now() });
            throw new Error(`Failed to initialize AgentMeshXR: ${errorId}`);
        }
    }
    async connect(endpoint) {
        try {
            // Validate endpoint
            Validator_1.Validator.validateWebSocketURL(endpoint);
            // Security checks
            if (!this.securityManager.validateHTTPS(endpoint)) {
                throw new Error('Insecure connection rejected');
            }
            // Rate limiting
            if (!this.securityManager.checkRateLimit(this.sessionId)) {
                throw new Error('Rate limit exceeded');
            }
            await this.connector.connect(endpoint);
            this.securityManager.auditAction('connect', 'websocket', 'success', {
                additionalData: { endpoint }
            });
            this.emit('connected');
            Logger_1.logger.info('AgentMeshXR', 'Connected to agent mesh', { endpoint });
        }
        catch (error) {
            const errorId = ErrorHandler_1.errorHandler.handleError(error, ErrorHandler_1.ErrorSeverity.HIGH, {
                module: 'AgentMeshXR',
                function: 'connect',
                sessionId: this.sessionId,
                timestamp: Date.now(),
                additionalData: { endpoint }
            }, { retry: true, reportToUser: true });
            this.securityManager.auditAction('connect', 'websocket', 'failure', {
                additionalData: { endpoint, errorId }
            });
            this.emit('error', error);
            throw error;
        }
    }
    async startXR(config) {
        try {
            await this.xrManager.startSession(config);
            this.isRunning = true;
            this.startRenderLoop();
            this.emit('xrStarted');
        }
        catch (error) {
            this.emit('error', error);
            throw error;
        }
    }
    async stopXR() {
        this.isRunning = false;
        await this.xrManager.endSession();
        this.emit('xrStopped');
    }
    enableTimeControl(config) {
        this.timeController = new TimeController_1.TimeController(config);
        this.timeController.on('rewind', (timestamp) => {
            this.rewindToTimestamp(timestamp);
        });
    }
    addAgent(agent) {
        try {
            // Circuit breaker check
            if (this.circuitBreakerOpen) {
                Logger_1.logger.warn('AgentMeshXR', 'Agent add rejected - circuit breaker open');
                throw new Error('System in degraded state - agent addition rejected');
            }
            // Validate and sanitize agent data
            Validator_1.Validator.validateAgent(agent);
            const sanitizedAgent = Validator_1.Validator.sanitizeAgentData(agent);
            // Adaptive capacity management
            const currentCapacity = this.getAdaptiveCapacity();
            if (this.agents.size >= currentCapacity) {
                throw new Error(`Current capacity limit reached: ${currentCapacity}`);
            }
            // Security check for suspicious activity
            if (this.securityManager.detectSuspiciousActivity(this.sessionId, 'add_agent')) {
                throw new Error('Suspicious activity detected');
            }
            this.agents.set(sanitizedAgent.id, sanitizedAgent);
            this.swarmVisualizer.addAgent(sanitizedAgent);
            // Update performance metrics
            this.performanceMonitor.updateAgentCount(this.agents.size);
            this.securityManager.auditAction('add_agent', 'agent', 'success', {
                additionalData: { agentId: sanitizedAgent.id, agentType: sanitizedAgent.type }
            });
            this.emit('agentAdded', sanitizedAgent);
            Logger_1.logger.debug('AgentMeshXR', 'Agent added', { agentId: sanitizedAgent.id });
        }
        catch (error) {
            ErrorHandler_1.errorHandler.handleError(error, ErrorHandler_1.ErrorSeverity.MEDIUM, {
                module: 'AgentMeshXR',
                function: 'addAgent',
                sessionId: this.sessionId,
                timestamp: Date.now(),
                additionalData: { attemptedAgentId: agent?.id }
            });
            this.securityManager.auditAction('add_agent', 'agent', 'failure', {
                additionalData: { attemptedAgentId: agent?.id, error: error.message }
            });
            throw error;
        }
    }
    updateAgent(agentData) {
        const existing = this.agents.get(agentData.id);
        if (existing) {
            const updated = { ...existing, ...agentData, lastUpdate: Date.now() };
            this.agents.set(agentData.id, updated);
            this.swarmVisualizer.updateAgent(updated);
            this.emit('agentUpdated', updated);
        }
    }
    removeAgent(agentId) {
        const agent = this.agents.get(agentId);
        if (agent) {
            this.agents.delete(agentId);
            this.swarmVisualizer.removeAgent(agentId);
            this.emit('agentRemoved', agent);
        }
    }
    getAgent(agentId) {
        return this.agents.get(agentId);
    }
    getAllAgents() {
        return Array.from(this.agents.values());
    }
    getActiveAgentCount() {
        return Array.from(this.agents.values())
            .filter(agent => agent.currentState.status === 'active').length;
    }
    setupEventListeners() {
        this.connector.on('agentUpdate', (agents) => {
            agents.forEach(agent => this.updateAgent(agent));
            this.emit('agentUpdate', agents);
        });
        this.connector.on('agentRemoved', (agentId) => {
            this.removeAgent(agentId);
        });
        this.connector.on('error', (error) => {
            this.emit('error', error);
        });
        this.xrManager.on('sessionEnd', () => {
            this.isRunning = false;
            this.emit('xrStopped');
        });
    }
    startRenderLoop() {
        const render = () => {
            if (!this.isRunning)
                return;
            try {
                // Measure render performance
                this.performanceMonitor.measurePerformance('render', () => {
                    this.xrManager.render();
                });
                // Measure update performance
                this.performanceMonitor.measurePerformance('update', async () => {
                    // Batch process agent updates for better performance
                    if (this.agents.size > 50) {
                        await this.processBatchedAgentUpdates();
                    }
                    this.swarmVisualizer.update();
                    if (this.timeController) {
                        this.timeController.update();
                    }
                });
            }
            catch (error) {
                ErrorHandler_1.errorHandler.handleError(error, ErrorHandler_1.ErrorSeverity.HIGH, {
                    module: 'AgentMeshXR',
                    function: 'renderLoop',
                    sessionId: this.sessionId,
                    timestamp: Date.now()
                }, { autoRecover: true });
            }
            requestAnimationFrame(render);
        };
        this.performanceMonitor.startMonitoring();
        render();
    }
    rewindToTimestamp(timestamp) {
        // Implementation for time rewind
        this.emit('timeRewind', timestamp);
    }
    setupErrorRecovery() {
        // Setup automatic error recovery strategies
        ErrorHandler_1.errorHandler.registerRetryStrategy('NetworkError', async () => {
            Logger_1.logger.info('AgentMeshXR', 'Attempting network recovery');
            try {
                await this.connector.reconnect();
                return true;
            }
            catch (retryError) {
                return false;
            }
        });
        ErrorHandler_1.errorHandler.registerRetryStrategy('XRError', async () => {
            Logger_1.logger.info('AgentMeshXR', 'Attempting XR recovery');
            try {
                await this.xrManager.resetSession();
                return true;
            }
            catch (retryError) {
                return false;
            }
        });
    }
    generateSessionId() {
        return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    startHealthCheck() {
        this.healthCheckInterval = setInterval(() => {
            this.performHealthCheck();
        }, 10000); // Check every 10 seconds
    }
    async performHealthCheck() {
        try {
            this.lastHealthCheck = Date.now();
            // Check system health
            const performanceReport = this.performanceMonitor.getPerformanceReport();
            const isHealthy = this.evaluateSystemHealth(performanceReport);
            if (isHealthy) {
                this.consecutiveFailures = 0;
                if (this.circuitBreakerOpen) {
                    this.circuitBreakerOpen = false;
                    Logger_1.logger.info('AgentMeshXR', 'Circuit breaker closed - system recovered');
                    this.emit('healthRecovered');
                }
            }
            else {
                this.consecutiveFailures++;
                Logger_1.logger.warn('AgentMeshXR', 'Health check failed', {
                    consecutiveFailures: this.consecutiveFailures,
                    maxFailures: this.maxConsecutiveFailures
                });
                if (this.consecutiveFailures >= this.maxConsecutiveFailures && !this.circuitBreakerOpen) {
                    this.circuitBreakerOpen = true;
                    Logger_1.logger.error('AgentMeshXR', 'Circuit breaker opened - system degraded');
                    this.emit('healthDegraded');
                    await this.attemptRecovery();
                }
            }
            this.emit('healthCheck', {
                healthy: isHealthy,
                timestamp: this.lastHealthCheck,
                circuitBreakerOpen: this.circuitBreakerOpen
            });
        }
        catch (error) {
            Logger_1.logger.error('AgentMeshXR', 'Health check error', error);
        }
    }
    evaluateSystemHealth(performanceReport) {
        // Simple health evaluation based on performance metrics
        try {
            const report = performanceReport;
            if (!report?.isMonitoring)
                return false;
            if (report.fps && report.fps < 15)
                return false; // Critical FPS threshold
            if (report.memoryUsage && report.memoryUsage > 90)
                return false; // Critical memory threshold
            return true;
        }
        catch {
            return false;
        }
    }
    async attemptRecovery() {
        try {
            Logger_1.logger.info('AgentMeshXR', 'Attempting system recovery');
            // Reduce agent count if too high
            if (this.agents.size > this.config.maxAgents * 0.8) {
                const agentsToRemove = Array.from(this.agents.keys()).slice(Math.floor(this.config.maxAgents * 0.6));
                agentsToRemove.forEach(id => this.removeAgent(id));
                Logger_1.logger.info('AgentMeshXR', 'Reduced agent count for recovery', { removed: agentsToRemove.length });
            }
            // Clear performance history
            this.performanceMonitor.clearMetrics();
            // Restart monitoring
            this.performanceMonitor.stopMonitoring();
            await new Promise(resolve => setTimeout(resolve, 1000));
            this.performanceMonitor.startMonitoring();
        }
        catch (error) {
            Logger_1.logger.error('AgentMeshXR', 'Recovery attempt failed', error);
        }
    }
    async processBatchedAgentUpdates() {
        try {
            const allAgents = Array.from(this.agents.values());
            if (allAgents.length === 0)
                return;
            // Optimize batch size based on current performance
            const performanceReport = this.performanceMonitor.getPerformanceReport();
            const currentFPS = performanceReport?.fps || 60;
            const optimizedBatchSize = this.gpuAccelerator.optimizeBatchSize(currentFPS);
            // Process agents in batches
            for (let i = 0; i < allAgents.length; i += optimizedBatchSize) {
                const batch = allAgents.slice(i, i + optimizedBatchSize);
                const result = await this.gpuAccelerator.processAgentBatch(batch);
                if (result.errors > 0) {
                    Logger_1.logger.warn('AgentMeshXR', 'Batch processing had errors', {
                        errors: result.errors,
                        processed: result.processed,
                        timeMs: result.timeMs
                    });
                }
                // Log performance warnings if batch processing is slow
                if (result.timeMs > 16) { // Frame budget exceeded
                    Logger_1.logger.warn('AgentMeshXR', 'Batch processing exceeded frame budget', {
                        timeMs: result.timeMs,
                        frameBudget: 16,
                        batchSize: batch.length
                    });
                }
            }
        }
        catch (error) {
            Logger_1.logger.error('AgentMeshXR', 'Failed to process agent batch updates', error);
        }
    }
    getAdaptiveCapacity() {
        try {
            const performanceReport = this.performanceMonitor.getPerformanceReport();
            let capacityMultiplier = 1.0;
            // Reduce capacity based on performance metrics
            if (performanceReport?.fps && performanceReport.fps < 30) {
                capacityMultiplier *= 0.7; // Reduce to 70% if FPS is low
            }
            if (performanceReport?.memoryUsage && performanceReport.memoryUsage > 70) {
                capacityMultiplier *= 0.8; // Reduce to 80% if memory usage is high
            }
            if (performanceReport?.renderTime && performanceReport.renderTime > 25) {
                capacityMultiplier *= 0.9; // Reduce to 90% if render time is high
            }
            const adaptiveCapacity = Math.floor(this.config.maxAgents * capacityMultiplier);
            return Math.max(100, adaptiveCapacity); // Minimum capacity of 100 agents
        }
        catch {
            return this.config.maxAgents;
        }
    }
    // Public API extensions for robust operation
    getPerformanceReport() {
        return this.performanceMonitor.getPerformanceReport();
    }
    getSecurityReport() {
        return this.securityManager.getSecurityReport();
    }
    getScene() {
        return this.xrManager.getScene();
    }
    getSessionId() {
        return this.sessionId;
    }
    getGPUAcceleratorStats() {
        return this.gpuAccelerator.getStatistics();
    }
    getSystemInfo() {
        return {
            sessionId: this.sessionId,
            agentCount: this.agents.size,
            activeAgents: this.getActiveAgentCount(),
            adaptiveCapacity: this.getAdaptiveCapacity(),
            circuitBreakerOpen: this.circuitBreakerOpen,
            isRunning: this.isRunning,
            lastHealthCheck: this.lastHealthCheck,
            consecutiveFailures: this.consecutiveFailures,
            performance: this.getPerformanceReport(),
            gpuAccelerator: this.getGPUAcceleratorStats()
        };
    }
    dispose() {
        try {
            Logger_1.logger.info('AgentMeshXR', 'Disposing AgentMeshXR', { sessionId: this.sessionId });
            this.isRunning = false;
            // Clear health check interval
            if (this.healthCheckInterval) {
                clearInterval(this.healthCheckInterval);
                this.healthCheckInterval = undefined;
            }
            // Stop monitoring
            this.performanceMonitor.stopMonitoring();
            this.performanceMonitor.dispose();
            // Cleanup connections
            this.connector.disconnect();
            // Cleanup XR
            this.xrManager.dispose();
            // Cleanup visualization
            this.swarmVisualizer.dispose();
            // Cleanup time controller
            if (this.timeController) {
                this.timeController.dispose();
            }
            // Cleanup GPU accelerator
            this.gpuAccelerator.dispose();
            // Clear agents
            this.agents.clear();
            // Final audit
            this.securityManager.auditAction('dispose', 'system', 'success', {
                additionalData: { sessionId: this.sessionId }
            });
            this.removeAllListeners();
        }
        catch (error) {
            ErrorHandler_1.errorHandler.handleError(error, ErrorHandler_1.ErrorSeverity.MEDIUM, {
                module: 'AgentMeshXR',
                function: 'dispose',
                sessionId: this.sessionId,
                timestamp: Date.now()
            });
        }
    }
}
exports.AgentMeshXR = AgentMeshXR;
