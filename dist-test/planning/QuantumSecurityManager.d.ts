import { EventEmitter } from 'eventemitter3';
export declare enum QuantumSecurityThreat {
    UNAUTHORIZED_STATE_ACCESS = "UNAUTHORIZED_STATE_ACCESS",
    QUANTUM_STATE_TAMPERING = "QUANTUM_STATE_TAMPERING",
    SUPERPOSITION_INJECTION = "SUPERPOSITION_INJECTION",
    ENTANGLEMENT_HIJACKING = "ENTANGLEMENT_HIJACKING",
    INTERFERENCE_MANIPULATION = "INTERFERENCE_MANIPULATION",
    COHERENCE_ATTACK = "COHERENCE_ATTACK",
    MEASUREMENT_SPOOFING = "MEASUREMENT_SPOOFING",
    QUANTUM_DOS_ATTACK = "QUANTUM_DOS_ATTACK",
    COMPUTATIONAL_OVERFLOW = "COMPUTATIONAL_OVERFLOW",
    UNAUTHORIZED_QUANTUM_ACCESS = "UNAUTHORIZED_QUANTUM_ACCESS"
}
export interface QuantumSecurityPolicy {
    maxQuantumOperationsPerSecond: number;
    maxCoherenceTime: number;
    maxEntanglementDepth: number;
    allowedQuantumGates: string[];
    requireAuthentication: boolean;
    enableAuditLogging: boolean;
    enableQuantumEncryption: boolean;
    quantumAccessControlList: Map<string, QuantumPermission[]>;
}
export interface QuantumPermission {
    operation: string;
    resource: string;
    level: 'read' | 'write' | 'execute' | 'admin';
    conditions: string[];
}
export interface QuantumSecurityEvent {
    id: string;
    type: QuantumSecurityThreat;
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
    timestamp: number;
    userId: string;
    quantumSystemId: string;
    operation: string;
    details: Record<string, any>;
    blocked: boolean;
    resolved: boolean;
}
export interface QuantumRateLimiter {
    userId: string;
    operationCounts: Map<string, number>;
    windowStart: number;
    windowDuration: number;
    maxOperations: number;
}
export interface QuantumAuditLog {
    id: string;
    timestamp: number;
    userId: string;
    operation: string;
    quantumSystemId: string;
    parameters: Record<string, any>;
    result: 'success' | 'failure' | 'blocked';
    securityLevel: string;
    ipAddress?: string;
    userAgent?: string;
}
export declare class QuantumSecurityManager extends EventEmitter {
    private static instance;
    private securityPolicy;
    private securityEvents;
    private rateLimiters;
    private auditLogs;
    private authenticatedSessions;
    private quantumEncryptionKeys;
    private threatDetectionActive;
    private constructor();
    static getInstance(): QuantumSecurityManager;
    authenticateQuantumUser(userId: string, credentials: any): string | null;
    validateQuantumAccess(sessionToken: string, operation: string, quantumSystemId: string, parameters?: Record<string, any>): boolean;
    validateQuantumStateAccess(userId: string, quantumSystemId: string, operation: string): boolean;
    validateSuperpositionOperation(userId: string, quantumSystemId: string, states: any[]): boolean;
    validateEntanglementOperation(userId: string, system1Id: string, system2Id: string, strength: number): boolean;
    validateInterferencePattern(userId: string, patternId: string, strength: number, type: string): boolean;
    validateQuantumGateOperation(userId: string, quantumSystemId: string, gateType: string, parameters: any): boolean;
    encryptQuantumData(data: any, quantumSystemId: string): string;
    decryptQuantumData(encryptedData: string, quantumSystemId: string): any;
    auditQuantumOperation(userId: string, operation: string, quantumSystemId: string, parameters: Record<string, any>, result: 'success' | 'failure' | 'blocked', metadata?: Record<string, any>): void;
    private startSecurityMonitoring;
    private detectAnomalousPatterns;
    private cleanupExpiredSessions;
    private resetRateLimitWindows;
    private checkQuantumPermission;
    private checkRateLimit;
    private validateQuantumParameters;
    private detectQuantumTampering;
    private hasAdminPermissions;
    private getCurrentEntanglementCount;
    private logSecurityEvent;
    private initializeDefaultPermissions;
    private getDefaultPermissions;
    private generateSecureToken;
    private getOrCreateEncryptionKey;
    private generateQuantumEncryptionKey;
    private simpleQuantumEncrypt;
    private simpleQuantumDecrypt;
    private sanitizeParameters;
    private calculateSecurityLevel;
    getSecurityEvents(userId?: string): QuantumSecurityEvent[];
    getAuditLogs(userId?: string, operation?: string): QuantumAuditLog[];
    updateSecurityPolicy(updates: Partial<QuantumSecurityPolicy>): void;
    getSecurityPolicy(): QuantumSecurityPolicy;
    resolveSecurityEvent(eventId: string, resolution: string): boolean;
    enableThreatDetection(): void;
    disableThreatDetection(): void;
    dispose(): void;
}
