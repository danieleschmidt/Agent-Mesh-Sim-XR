"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumSecurityManager = exports.QuantumSecurityThreat = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("../utils/Logger");
var QuantumSecurityThreat;
(function (QuantumSecurityThreat) {
    QuantumSecurityThreat["UNAUTHORIZED_STATE_ACCESS"] = "UNAUTHORIZED_STATE_ACCESS";
    QuantumSecurityThreat["QUANTUM_STATE_TAMPERING"] = "QUANTUM_STATE_TAMPERING";
    QuantumSecurityThreat["SUPERPOSITION_INJECTION"] = "SUPERPOSITION_INJECTION";
    QuantumSecurityThreat["ENTANGLEMENT_HIJACKING"] = "ENTANGLEMENT_HIJACKING";
    QuantumSecurityThreat["INTERFERENCE_MANIPULATION"] = "INTERFERENCE_MANIPULATION";
    QuantumSecurityThreat["COHERENCE_ATTACK"] = "COHERENCE_ATTACK";
    QuantumSecurityThreat["MEASUREMENT_SPOOFING"] = "MEASUREMENT_SPOOFING";
    QuantumSecurityThreat["QUANTUM_DOS_ATTACK"] = "QUANTUM_DOS_ATTACK";
    QuantumSecurityThreat["COMPUTATIONAL_OVERFLOW"] = "COMPUTATIONAL_OVERFLOW";
    QuantumSecurityThreat["UNAUTHORIZED_QUANTUM_ACCESS"] = "UNAUTHORIZED_QUANTUM_ACCESS";
})(QuantumSecurityThreat || (exports.QuantumSecurityThreat = QuantumSecurityThreat = {}));
class QuantumSecurityManager extends eventemitter3_1.EventEmitter {
    static instance = null;
    securityPolicy;
    securityEvents = new Map();
    rateLimiters = new Map();
    auditLogs = [];
    authenticatedSessions = new Map();
    quantumEncryptionKeys = new Map();
    threatDetectionActive = true;
    constructor() {
        super();
        this.securityPolicy = {
            maxQuantumOperationsPerSecond: 100,
            maxCoherenceTime: 300, // 5 minutes
            maxEntanglementDepth: 10,
            allowedQuantumGates: ['hadamard', 'pauli-x', 'pauli-y', 'pauli-z', 'phase', 'rotation'],
            requireAuthentication: true,
            enableAuditLogging: true,
            enableQuantumEncryption: true,
            quantumAccessControlList: new Map()
        };
        this.initializeDefaultPermissions();
        this.startSecurityMonitoring();
    }
    static getInstance() {
        if (!QuantumSecurityManager.instance) {
            QuantumSecurityManager.instance = new QuantumSecurityManager();
        }
        return QuantumSecurityManager.instance;
    }
    // Authentication and authorization
    authenticateQuantumUser(userId, credentials) {
        try {
            // Simulate authentication (in production, use proper auth)
            if (!userId || !credentials) {
                this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'HIGH', userId, '', 'authenticate', {
                    reason: 'Invalid credentials'
                }, true);
                return null;
            }
            // Generate session token
            const sessionToken = this.generateSecureToken();
            const permissions = this.getDefaultPermissions(userId);
            this.authenticatedSessions.set(sessionToken, {
                userId,
                permissions,
                expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            });
            this.auditQuantumOperation(userId, 'authenticate', '', {}, 'success');
            Logger_1.logger.info('QuantumSecurityManager', 'User authenticated for quantum operations', { userId });
            return sessionToken;
        }
        catch (error) {
            Logger_1.logger.error('QuantumSecurityManager', 'Authentication failed', { userId, error });
            return null;
        }
    }
    validateQuantumAccess(sessionToken, operation, quantumSystemId, parameters = {}) {
        const session = this.authenticatedSessions.get(sessionToken);
        if (!session) {
            this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'HIGH', 'unknown', quantumSystemId, operation, {
                reason: 'Invalid session token'
            }, true);
            return false;
        }
        if (session.expiry < Date.now()) {
            this.authenticatedSessions.delete(sessionToken);
            this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'MEDIUM', session.userId, quantumSystemId, operation, {
                reason: 'Session expired'
            }, true);
            return false;
        }
        // Check permissions
        const hasPermission = this.checkQuantumPermission(session.permissions, operation, quantumSystemId);
        if (!hasPermission) {
            this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'HIGH', session.userId, quantumSystemId, operation, {
                reason: 'Insufficient permissions'
            }, true);
            return false;
        }
        // Rate limiting
        if (!this.checkRateLimit(session.userId, operation)) {
            this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_DOS_ATTACK, 'MEDIUM', session.userId, quantumSystemId, operation, {
                reason: 'Rate limit exceeded'
            }, true);
            return false;
        }
        // Validate quantum parameters
        if (!this.validateQuantumParameters(operation, parameters)) {
            this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_STATE_TAMPERING, 'HIGH', session.userId, quantumSystemId, operation, {
                reason: 'Invalid parameters detected',
                parameters
            }, true);
            return false;
        }
        return true;
    }
    // Quantum-specific security validations
    validateQuantumStateAccess(userId, quantumSystemId, operation) {
        // Check if user is trying to access unauthorized quantum states
        if (operation.includes('admin') && !this.hasAdminPermissions(userId)) {
            this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_STATE_ACCESS, 'HIGH', userId, quantumSystemId, operation, {
                reason: 'Admin operation without admin permissions'
            }, true);
            return false;
        }
        // Detect potential quantum state tampering
        if (this.detectQuantumTampering(operation, quantumSystemId)) {
            this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_STATE_TAMPERING, 'CRITICAL', userId, quantumSystemId, operation, {
                reason: 'Quantum state tampering detected'
            }, true);
            return false;
        }
        return true;
    }
    validateSuperpositionOperation(userId, quantumSystemId, states) {
        // Check for superposition injection attacks
        if (states.length > this.securityPolicy.maxEntanglementDepth * 2) {
            this.logSecurityEvent(QuantumSecurityThreat.SUPERPOSITION_INJECTION, 'HIGH', userId, quantumSystemId, 'superposition', {
                reason: 'Excessive superposition states',
                stateCount: states.length
            }, true);
            return false;
        }
        // Validate state amplitudes for malicious values
        for (const state of states) {
            if (state.amplitude && (isNaN(state.amplitude) || state.amplitude > 100 || state.amplitude < 0)) {
                this.logSecurityEvent(QuantumSecurityThreat.SUPERPOSITION_INJECTION, 'MEDIUM', userId, quantumSystemId, 'superposition', {
                    reason: 'Invalid amplitude values',
                    invalidAmplitude: state.amplitude
                }, true);
                return false;
            }
        }
        return true;
    }
    validateEntanglementOperation(userId, system1Id, system2Id, strength) {
        // Check for entanglement hijacking
        if (strength > 2.0 || strength < 0) {
            this.logSecurityEvent(QuantumSecurityThreat.ENTANGLEMENT_HIJACKING, 'HIGH', userId, system1Id, 'entanglement', {
                reason: 'Invalid entanglement strength',
                strength,
                system2Id
            }, true);
            return false;
        }
        // Check entanglement depth limits
        const currentEntanglements = this.getCurrentEntanglementCount(system1Id);
        if (currentEntanglements >= this.securityPolicy.maxEntanglementDepth) {
            this.logSecurityEvent(QuantumSecurityThreat.ENTANGLEMENT_HIJACKING, 'MEDIUM', userId, system1Id, 'entanglement', {
                reason: 'Entanglement depth limit exceeded',
                currentDepth: currentEntanglements
            }, true);
            return false;
        }
        return true;
    }
    validateInterferencePattern(userId, patternId, strength, type) {
        // Check for interference manipulation
        if (strength > 10.0 || strength < 0) {
            this.logSecurityEvent(QuantumSecurityThreat.INTERFERENCE_MANIPULATION, 'HIGH', userId, patternId, 'interference', {
                reason: 'Excessive interference strength',
                strength,
                type
            }, true);
            return false;
        }
        // Validate interference type
        const allowedTypes = ['constructive', 'destructive', 'mixed'];
        if (!allowedTypes.includes(type)) {
            this.logSecurityEvent(QuantumSecurityThreat.INTERFERENCE_MANIPULATION, 'MEDIUM', userId, patternId, 'interference', {
                reason: 'Invalid interference type',
                type
            }, true);
            return false;
        }
        return true;
    }
    validateQuantumGateOperation(userId, quantumSystemId, gateType, parameters) {
        // Check if gate type is allowed
        if (!this.securityPolicy.allowedQuantumGates.includes(gateType)) {
            this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_STATE_ACCESS, 'HIGH', userId, quantumSystemId, 'quantum_gate', {
                reason: 'Unauthorized gate type',
                gateType
            }, true);
            return false;
        }
        // Validate gate parameters
        if (gateType === 'rotation' && parameters.angle && Math.abs(parameters.angle) > 2 * Math.PI) {
            this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_STATE_TAMPERING, 'MEDIUM', userId, quantumSystemId, 'quantum_gate', {
                reason: 'Invalid rotation angle',
                angle: parameters.angle
            }, true);
            return false;
        }
        return true;
    }
    // Quantum encryption for sensitive data
    encryptQuantumData(data, quantumSystemId) {
        if (!this.securityPolicy.enableQuantumEncryption) {
            return JSON.stringify(data);
        }
        try {
            const key = this.getOrCreateEncryptionKey(quantumSystemId);
            // Simplified quantum-inspired encryption (in production, use proper quantum-safe encryption)
            const jsonData = JSON.stringify(data);
            const encrypted = this.simpleQuantumEncrypt(jsonData, key);
            return encrypted;
        }
        catch (error) {
            Logger_1.logger.error('QuantumSecurityManager', 'Quantum encryption failed', { error, quantumSystemId });
            return JSON.stringify(data); // Fallback to unencrypted
        }
    }
    decryptQuantumData(encryptedData, quantumSystemId) {
        if (!this.securityPolicy.enableQuantumEncryption) {
            return JSON.parse(encryptedData);
        }
        try {
            const key = this.quantumEncryptionKeys.get(quantumSystemId);
            if (!key) {
                throw new Error('Encryption key not found');
            }
            const decrypted = this.simpleQuantumDecrypt(encryptedData, key);
            return JSON.parse(decrypted);
        }
        catch (error) {
            Logger_1.logger.error('QuantumSecurityManager', 'Quantum decryption failed', { error, quantumSystemId });
            throw error;
        }
    }
    // Audit logging
    auditQuantumOperation(userId, operation, quantumSystemId, parameters, result, metadata = {}) {
        if (!this.securityPolicy.enableAuditLogging)
            return;
        const auditLog = {
            id: this.generateSecureToken(),
            timestamp: Date.now(),
            userId,
            operation,
            quantumSystemId,
            parameters: this.sanitizeParameters(parameters),
            result,
            securityLevel: this.calculateSecurityLevel(operation),
            ipAddress: metadata.ipAddress,
            userAgent: metadata.userAgent
        };
        this.auditLogs.push(auditLog);
        // Emit audit event
        this.emit('quantumAudit', auditLog);
        // Clean up old logs (keep last 10000)
        if (this.auditLogs.length > 10000) {
            this.auditLogs.splice(0, this.auditLogs.length - 10000);
        }
    }
    // Security monitoring and threat detection
    startSecurityMonitoring() {
        setInterval(() => {
            if (this.threatDetectionActive) {
                this.detectAnomalousPatterns();
                this.cleanupExpiredSessions();
                this.resetRateLimitWindows();
            }
        }, 30000); // Every 30 seconds
    }
    detectAnomalousPatterns() {
        const recentEvents = Array.from(this.securityEvents.values())
            .filter(event => Date.now() - event.timestamp < 300000); // Last 5 minutes
        // Detect multiple failed operations from same user
        const failuresByUser = new Map();
        recentEvents.forEach(event => {
            if (!event.resolved) {
                failuresByUser.set(event.userId, (failuresByUser.get(event.userId) || 0) + 1);
            }
        });
        failuresByUser.forEach((count, userId) => {
            if (count > 10) {
                this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_DOS_ATTACK, 'HIGH', userId, '', 'anomaly_detection', {
                    reason: 'Excessive failed operations',
                    failureCount: count
                }, false);
            }
        });
    }
    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredSessions = [];
        this.authenticatedSessions.forEach((session, token) => {
            if (session.expiry < now) {
                expiredSessions.push(token);
            }
        });
        expiredSessions.forEach(token => {
            this.authenticatedSessions.delete(token);
        });
        if (expiredSessions.length > 0) {
            Logger_1.logger.debug('QuantumSecurityManager', 'Cleaned up expired sessions', { count: expiredSessions.length });
        }
    }
    resetRateLimitWindows() {
        const now = Date.now();
        const expiredLimiters = [];
        this.rateLimiters.forEach((limiter, userId) => {
            if (now - limiter.windowStart > limiter.windowDuration) {
                limiter.operationCounts.clear();
                limiter.windowStart = now;
            }
        });
    }
    // Helper methods
    checkQuantumPermission(permissions, operation, resource) {
        return permissions.some(permission => {
            const operationMatch = permission.operation === '*' || permission.operation === operation;
            const resourceMatch = permission.resource === '*' || permission.resource === resource;
            return operationMatch && resourceMatch;
        });
    }
    checkRateLimit(userId, operation) {
        let limiter = this.rateLimiters.get(userId);
        if (!limiter) {
            limiter = {
                userId,
                operationCounts: new Map(),
                windowStart: Date.now(),
                windowDuration: 60000, // 1 minute
                maxOperations: this.securityPolicy.maxQuantumOperationsPerSecond * 60
            };
            this.rateLimiters.set(userId, limiter);
        }
        const currentCount = limiter.operationCounts.get(operation) || 0;
        if (currentCount >= limiter.maxOperations) {
            return false;
        }
        limiter.operationCounts.set(operation, currentCount + 1);
        return true;
    }
    validateQuantumParameters(operation, parameters) {
        // Basic parameter validation
        for (const [key, value] of Object.entries(parameters)) {
            // Check for injection attempts
            if (typeof value === 'string' && (value.includes('<script>') || value.includes('javascript:'))) {
                return false;
            }
            // Check for excessive values that could cause DoS
            if (typeof value === 'number' && (value > 1e10 || value < -1e10)) {
                return false;
            }
        }
        return true;
    }
    detectQuantumTampering(operation, quantumSystemId) {
        // Simplified tampering detection
        const suspiciousOperations = ['override', 'bypass', 'inject', 'exploit'];
        return suspiciousOperations.some(suspicious => operation.toLowerCase().includes(suspicious));
    }
    hasAdminPermissions(userId) {
        // Check if user has admin permissions
        const userPermissions = this.securityPolicy.quantumAccessControlList.get(userId) || [];
        return userPermissions.some(permission => permission.level === 'admin');
    }
    getCurrentEntanglementCount(systemId) {
        // Simplified entanglement count (in production, query actual system)
        return Math.floor(Math.random() * 5); // Placeholder
    }
    logSecurityEvent(type, severity, userId, quantumSystemId, operation, details, blocked) {
        const event = {
            id: this.generateSecureToken(),
            type,
            severity,
            timestamp: Date.now(),
            userId,
            quantumSystemId,
            operation,
            details,
            blocked,
            resolved: false
        };
        this.securityEvents.set(event.id, event);
        // Emit security event
        this.emit('quantumSecurityThreat', event);
        Logger_1.logger.warn('QuantumSecurityManager', `Security threat detected: ${type}`, {
            eventId: event.id,
            severity,
            userId,
            quantumSystemId,
            operation,
            blocked
        });
    }
    initializeDefaultPermissions() {
        // Default permissions for different user types
        const defaultPermissions = [
            { operation: 'read', resource: '*', level: 'read', conditions: [] },
            { operation: 'measure', resource: '*', level: 'read', conditions: [] },
            { operation: 'create', resource: 'superposition', level: 'write', conditions: ['max_states:5'] },
            { operation: 'apply_gate', resource: '*', level: 'execute', conditions: ['allowed_gates'] }
        ];
        this.securityPolicy.quantumAccessControlList.set('default', defaultPermissions);
    }
    getDefaultPermissions(userId) {
        return this.securityPolicy.quantumAccessControlList.get(userId) ||
            this.securityPolicy.quantumAccessControlList.get('default') || [];
    }
    generateSecureToken() {
        return `qt_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`;
    }
    getOrCreateEncryptionKey(quantumSystemId) {
        let key = this.quantumEncryptionKeys.get(quantumSystemId);
        if (!key) {
            key = this.generateQuantumEncryptionKey();
            this.quantumEncryptionKeys.set(quantumSystemId, key);
        }
        return key;
    }
    generateQuantumEncryptionKey() {
        // Simplified quantum key generation
        return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('');
    }
    simpleQuantumEncrypt(data, key) {
        // Simplified encryption (in production, use proper quantum-safe algorithms)
        let encrypted = '';
        for (let i = 0; i < data.length; i++) {
            const keyChar = key[i % key.length];
            const dataChar = data.charCodeAt(i);
            const keyCode = keyChar.charCodeAt(0);
            encrypted += String.fromCharCode(dataChar ^ keyCode);
        }
        return btoa(encrypted); // Base64 encode
    }
    simpleQuantumDecrypt(encryptedData, key) {
        // Simplified decryption
        const encrypted = atob(encryptedData); // Base64 decode
        let decrypted = '';
        for (let i = 0; i < encrypted.length; i++) {
            const keyChar = key[i % key.length];
            const encryptedChar = encrypted.charCodeAt(i);
            const keyCode = keyChar.charCodeAt(0);
            decrypted += String.fromCharCode(encryptedChar ^ keyCode);
        }
        return decrypted;
    }
    sanitizeParameters(parameters) {
        const sanitized = {};
        for (const [key, value] of Object.entries(parameters)) {
            if (typeof value === 'string') {
                sanitized[key] = value.replace(/[<>]/g, ''); // Basic sanitization
            }
            else if (typeof value === 'number') {
                sanitized[key] = isFinite(value) ? value : 0;
            }
            else {
                sanitized[key] = value;
            }
        }
        return sanitized;
    }
    calculateSecurityLevel(operation) {
        const highSecurityOps = ['admin', 'delete', 'override', 'bypass'];
        const mediumSecurityOps = ['create', 'update', 'entangle', 'apply_gate'];
        if (highSecurityOps.some(op => operation.includes(op)))
            return 'HIGH';
        if (mediumSecurityOps.some(op => operation.includes(op)))
            return 'MEDIUM';
        return 'LOW';
    }
    // Public API methods
    getSecurityEvents(userId) {
        const events = Array.from(this.securityEvents.values());
        return userId ? events.filter(event => event.userId === userId) : events;
    }
    getAuditLogs(userId, operation) {
        let logs = [...this.auditLogs];
        if (userId) {
            logs = logs.filter(log => log.userId === userId);
        }
        if (operation) {
            logs = logs.filter(log => log.operation === operation);
        }
        return logs.sort((a, b) => b.timestamp - a.timestamp);
    }
    updateSecurityPolicy(updates) {
        this.securityPolicy = { ...this.securityPolicy, ...updates };
        Logger_1.logger.info('QuantumSecurityManager', 'Security policy updated', { updates });
        this.emit('securityPolicyUpdated', this.securityPolicy);
    }
    getSecurityPolicy() {
        return { ...this.securityPolicy };
    }
    resolveSecurityEvent(eventId, resolution) {
        const event = this.securityEvents.get(eventId);
        if (event) {
            event.resolved = true;
            event.details.resolution = resolution;
            event.details.resolvedAt = Date.now();
            this.emit('securityEventResolved', event);
            Logger_1.logger.info('QuantumSecurityManager', 'Security event resolved', {
                eventId,
                type: event.type,
                resolution
            });
            return true;
        }
        return false;
    }
    enableThreatDetection() {
        this.threatDetectionActive = true;
        Logger_1.logger.info('QuantumSecurityManager', 'Threat detection enabled');
    }
    disableThreatDetection() {
        this.threatDetectionActive = false;
        Logger_1.logger.info('QuantumSecurityManager', 'Threat detection disabled');
    }
    // Cleanup
    dispose() {
        Logger_1.logger.info('QuantumSecurityManager', 'Disposing quantum security manager');
        this.securityEvents.clear();
        this.rateLimiters.clear();
        this.auditLogs.length = 0;
        this.authenticatedSessions.clear();
        this.quantumEncryptionKeys.clear();
        this.threatDetectionActive = false;
        this.removeAllListeners();
        QuantumSecurityManager.instance = null;
    }
}
exports.QuantumSecurityManager = QuantumSecurityManager;
