import { EventEmitter } from 'eventemitter3';
export interface SecurityPolicy {
    maxAgentsPerUser: number;
    maxConnectionsPerIP: number;
    allowedOrigins: string[];
    requireHTTPS: boolean;
    sessionTimeoutMs: number;
    maxMessageSize: number;
    rateLimitRequests: number;
    rateLimitWindowMs: number;
}
export interface SecurityThreat {
    id: string;
    type: 'injection' | 'overflow' | 'rate_limit' | 'suspicious_activity' | 'unauthorized_access';
    severity: 'low' | 'medium' | 'high' | 'critical';
    source: string;
    description: string;
    timestamp: number;
    blocked: boolean;
    data?: any;
}
export interface SecurityAuditEvent {
    id: string;
    timestamp: number;
    userId?: string;
    action: string;
    resource: string;
    result: 'success' | 'failure' | 'blocked';
    ipAddress?: string;
    userAgent?: string;
    additionalData?: Record<string, any>;
}
export declare class SecurityManager extends EventEmitter {
    private static instance;
    private policy;
    private threats;
    private auditLog;
    private activeConnections;
    private rateLimitTracker;
    private suspiciousActivityTracker;
    private sessionTokens;
    private constructor();
    static getInstance(policy?: Partial<SecurityPolicy>): SecurityManager;
    private startCleanupTask;
    validateOrigin(origin: string): boolean;
    validateHTTPS(url: string): boolean;
    checkRateLimit(identifier: string, requests?: number): boolean;
    validateConnectionLimit(ipAddress: string): boolean;
    registerConnection(ipAddress: string): void;
    unregisterConnection(ipAddress: string): void;
    sanitizeInput(input: any): any;
    validateMessageSize(message: any): boolean;
    detectSuspiciousActivity(identifier: string, activity: string): boolean;
    createSession(userId: string): string;
    validateSession(token: string): {
        valid: boolean;
        userId?: string;
    };
    revokeSession(token: string): void;
    private reportThreat;
    auditAction(action: string, resource: string, result: 'success' | 'failure' | 'blocked', context?: {
        userId?: string;
        ipAddress?: string;
        userAgent?: string;
        additionalData?: Record<string, any>;
    }): void;
    private generateSecureToken;
    private generateId;
    private cleanupExpiredSessions;
    private cleanupOldThreats;
    private cleanupOldAuditLogs;
    getThreats(filter?: {
        type?: SecurityThreat['type'];
        severity?: SecurityThreat['severity'];
        since?: number;
    }): SecurityThreat[];
    getAuditLog(filter?: {
        userId?: string;
        action?: string;
        result?: SecurityAuditEvent['result'];
        since?: number;
    }): SecurityAuditEvent[];
    getSecurityReport(): {
        policy: SecurityPolicy;
        threatsSummary: Record<string, number>;
        auditSummary: Record<string, number>;
        activeConnections: number;
        activeSessions: number;
    };
    updatePolicy(updates: Partial<SecurityPolicy>): void;
    exportSecurityData(): string;
}
