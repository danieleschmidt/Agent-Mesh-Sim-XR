"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SecurityManager = void 0;
const eventemitter3_1 = require("eventemitter3");
const Logger_1 = require("../utils/Logger");
const Validator_1 = require("../utils/Validator");
class SecurityManager extends eventemitter3_1.EventEmitter {
    static instance;
    policy;
    threats = [];
    auditLog = [];
    activeConnections = new Map();
    rateLimitTracker = new Map();
    suspiciousActivityTracker = new Map();
    sessionTokens = new Map();
    constructor(policy) {
        super();
        this.policy = {
            maxAgentsPerUser: 1000,
            maxConnectionsPerIP: 10,
            allowedOrigins: ['https://localhost:3000', 'https://127.0.0.1:3000'],
            requireHTTPS: true,
            sessionTimeoutMs: 3600000, // 1 hour
            maxMessageSize: 1024 * 1024, // 1MB
            rateLimitRequests: 100,
            rateLimitWindowMs: 60000, // 1 minute
            ...policy
        };
        this.startCleanupTask();
    }
    static getInstance(policy) {
        if (!SecurityManager.instance) {
            SecurityManager.instance = new SecurityManager(policy);
        }
        return SecurityManager.instance;
    }
    startCleanupTask() {
        // Clean up expired sessions and old data every 5 minutes
        setInterval(() => {
            this.cleanupExpiredSessions();
            this.cleanupOldThreats();
            this.cleanupOldAuditLogs();
        }, 300000);
    }
    validateOrigin(origin) {
        if (!origin)
            return false;
        const isAllowed = this.policy.allowedOrigins.includes(origin) ||
            this.policy.allowedOrigins.includes('*');
        if (!isAllowed) {
            this.reportThreat({
                type: 'unauthorized_access',
                severity: 'medium',
                source: origin,
                description: `Unauthorized origin: ${origin}`,
                blocked: true
            });
        }
        return isAllowed;
    }
    validateHTTPS(url) {
        if (!this.policy.requireHTTPS)
            return true;
        const isHTTPS = url.startsWith('https://') || url.startsWith('wss://');
        if (!isHTTPS) {
            this.reportThreat({
                type: 'unauthorized_access',
                severity: 'high',
                source: url,
                description: 'Non-HTTPS connection attempted',
                blocked: true
            });
        }
        return isHTTPS;
    }
    checkRateLimit(identifier, requests = 1) {
        const now = Date.now();
        const windowStart = now - this.policy.rateLimitWindowMs;
        if (!this.rateLimitTracker.has(identifier)) {
            this.rateLimitTracker.set(identifier, []);
        }
        const timestamps = this.rateLimitTracker.get(identifier);
        // Remove old timestamps
        const validTimestamps = timestamps.filter(ts => ts > windowStart);
        if (validTimestamps.length + requests > this.policy.rateLimitRequests) {
            this.reportThreat({
                type: 'rate_limit',
                severity: 'medium',
                source: identifier,
                description: `Rate limit exceeded: ${validTimestamps.length + requests}/${this.policy.rateLimitRequests}`,
                blocked: true
            });
            return false;
        }
        // Add new requests
        for (let i = 0; i < requests; i++) {
            validTimestamps.push(now);
        }
        this.rateLimitTracker.set(identifier, validTimestamps);
        return true;
    }
    validateConnectionLimit(ipAddress) {
        const currentConnections = this.activeConnections.get(ipAddress) || 0;
        if (currentConnections >= this.policy.maxConnectionsPerIP) {
            this.reportThreat({
                type: 'overflow',
                severity: 'high',
                source: ipAddress,
                description: `Connection limit exceeded: ${currentConnections}/${this.policy.maxConnectionsPerIP}`,
                blocked: true
            });
            return false;
        }
        return true;
    }
    registerConnection(ipAddress) {
        const current = this.activeConnections.get(ipAddress) || 0;
        this.activeConnections.set(ipAddress, current + 1);
    }
    unregisterConnection(ipAddress) {
        const current = this.activeConnections.get(ipAddress) || 0;
        if (current > 0) {
            this.activeConnections.set(ipAddress, current - 1);
        }
    }
    sanitizeInput(input) {
        if (typeof input === 'string') {
            return Validator_1.Validator.sanitizeString(input);
        }
        if (typeof input === 'object' && input !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(input)) {
                const sanitizedKey = Validator_1.Validator.sanitizeString(String(key), 100);
                sanitized[sanitizedKey] = this.sanitizeInput(value);
            }
            return sanitized;
        }
        return input;
    }
    validateMessageSize(message) {
        const messageSize = JSON.stringify(message).length;
        if (messageSize > this.policy.maxMessageSize) {
            this.reportThreat({
                type: 'overflow',
                severity: 'medium',
                source: 'message',
                description: `Message size exceeded: ${messageSize}/${this.policy.maxMessageSize} bytes`,
                blocked: true
            });
            return false;
        }
        return true;
    }
    detectSuspiciousActivity(identifier, activity) {
        const suspicionLevel = this.suspiciousActivityTracker.get(identifier) || 0;
        let newSuspicionLevel = suspicionLevel;
        // Analyze activity patterns
        switch (activity) {
            case 'rapid_connections':
                newSuspicionLevel += 10;
                break;
            case 'invalid_data':
                newSuspicionLevel += 5;
                break;
            case 'unauthorized_access':
                newSuspicionLevel += 20;
                break;
            case 'malformed_request':
                newSuspicionLevel += 3;
                break;
        }
        this.suspiciousActivityTracker.set(identifier, newSuspicionLevel);
        // Threshold for blocking
        const suspiciousThreshold = 50;
        if (newSuspicionLevel >= suspiciousThreshold) {
            this.reportThreat({
                type: 'suspicious_activity',
                severity: 'high',
                source: identifier,
                description: `Suspicious activity detected: ${activity} (level: ${newSuspicionLevel})`,
                blocked: true
            });
            return true;
        }
        return false;
    }
    createSession(userId) {
        const token = this.generateSecureToken();
        const expires = Date.now() + this.policy.sessionTimeoutMs;
        this.sessionTokens.set(token, { expires, userId });
        this.auditLog.push({
            id: this.generateId(),
            timestamp: Date.now(),
            userId,
            action: 'session_create',
            resource: 'session',
            result: 'success'
        });
        return token;
    }
    validateSession(token) {
        const session = this.sessionTokens.get(token);
        if (!session) {
            return { valid: false };
        }
        if (Date.now() > session.expires) {
            this.sessionTokens.delete(token);
            return { valid: false };
        }
        return { valid: true, userId: session.userId };
    }
    revokeSession(token) {
        const session = this.sessionTokens.get(token);
        if (session) {
            this.sessionTokens.delete(token);
            this.auditLog.push({
                id: this.generateId(),
                timestamp: Date.now(),
                userId: session.userId,
                action: 'session_revoke',
                resource: 'session',
                result: 'success'
            });
        }
    }
    reportThreat(threat) {
        const fullThreat = {
            ...threat,
            id: this.generateId(),
            timestamp: Date.now()
        };
        this.threats.push(fullThreat);
        Logger_1.logger.warn('SecurityManager', `Security threat detected: ${threat.type}`, {
            threat: fullThreat
        });
        this.emit('threat', fullThreat);
        // Auto-block critical threats
        if (threat.severity === 'critical') {
            this.emit('criticalThreat', fullThreat);
        }
    }
    auditAction(action, resource, result, context = {}) {
        const auditEvent = {
            id: this.generateId(),
            timestamp: Date.now(),
            action,
            resource,
            result,
            ...context
        };
        this.auditLog.push(auditEvent);
        if (result === 'failure' || result === 'blocked') {
            Logger_1.logger.warn('SecurityManager', `Security audit: ${action} ${result}`, auditEvent);
        }
        else {
            Logger_1.logger.debug('SecurityManager', `Security audit: ${action} ${result}`, auditEvent);
        }
        this.emit('audit', auditEvent);
    }
    generateSecureToken() {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
    }
    generateId() {
        return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    }
    cleanupExpiredSessions() {
        const now = Date.now();
        const expiredTokens = [];
        this.sessionTokens.forEach((session, token) => {
            if (now > session.expires) {
                expiredTokens.push(token);
            }
        });
        expiredTokens.forEach(token => {
            this.sessionTokens.delete(token);
        });
        if (expiredTokens.length > 0) {
            Logger_1.logger.debug('SecurityManager', `Cleaned up ${expiredTokens.length} expired sessions`);
        }
    }
    cleanupOldThreats() {
        const cutoff = Date.now() - (24 * 60 * 60 * 1000); // 24 hours
        const initialCount = this.threats.length;
        this.threats = this.threats.filter(threat => threat.timestamp > cutoff);
        const removed = initialCount - this.threats.length;
        if (removed > 0) {
            Logger_1.logger.debug('SecurityManager', `Cleaned up ${removed} old threat records`);
        }
    }
    cleanupOldAuditLogs() {
        const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000); // 7 days
        const initialCount = this.auditLog.length;
        this.auditLog = this.auditLog.filter(log => log.timestamp > cutoff);
        const removed = initialCount - this.auditLog.length;
        if (removed > 0) {
            Logger_1.logger.debug('SecurityManager', `Cleaned up ${removed} old audit logs`);
        }
    }
    getThreats(filter) {
        let filtered = [...this.threats];
        if (filter) {
            if (filter.type) {
                filtered = filtered.filter(t => t.type === filter.type);
            }
            if (filter.severity) {
                filtered = filtered.filter(t => t.severity === filter.severity);
            }
            if (filter.since) {
                filtered = filtered.filter(t => t.timestamp >= filter.since);
            }
        }
        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }
    getAuditLog(filter) {
        let filtered = [...this.auditLog];
        if (filter) {
            if (filter.userId) {
                filtered = filtered.filter(log => log.userId === filter.userId);
            }
            if (filter.action) {
                filtered = filtered.filter(log => log.action === filter.action);
            }
            if (filter.result) {
                filtered = filtered.filter(log => log.result === filter.result);
            }
            if (filter.since) {
                filtered = filtered.filter(log => log.timestamp >= filter.since);
            }
        }
        return filtered.sort((a, b) => b.timestamp - a.timestamp);
    }
    getSecurityReport() {
        const threatsSummary = this.threats.reduce((acc, threat) => {
            acc[threat.type] = (acc[threat.type] || 0) + 1;
            return acc;
        }, {});
        const auditSummary = this.auditLog.reduce((acc, log) => {
            acc[log.result] = (acc[log.result] || 0) + 1;
            return acc;
        }, {});
        const activeConnections = Array.from(this.activeConnections.values())
            .reduce((sum, count) => sum + count, 0);
        return {
            policy: this.policy,
            threatsSummary,
            auditSummary,
            activeConnections,
            activeSessions: this.sessionTokens.size
        };
    }
    updatePolicy(updates) {
        this.policy = { ...this.policy, ...updates };
        this.auditAction('policy_update', 'security_policy', 'success', {
            additionalData: updates
        });
        Logger_1.logger.info('SecurityManager', 'Security policy updated', updates);
    }
    exportSecurityData() {
        return JSON.stringify({
            policy: this.policy,
            threats: this.threats,
            auditLog: this.auditLog,
            exportTime: Date.now()
        }, null, 2);
    }
}
exports.SecurityManager = SecurityManager;
