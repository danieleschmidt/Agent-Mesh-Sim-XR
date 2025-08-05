import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import { QuantumError, QuantumErrorType, QuantumErrorSeverity } from './QuantumErrorHandler'

export enum QuantumSecurityThreat {
  UNAUTHORIZED_STATE_ACCESS = 'UNAUTHORIZED_STATE_ACCESS',
  QUANTUM_STATE_TAMPERING = 'QUANTUM_STATE_TAMPERING',
  SUPERPOSITION_INJECTION = 'SUPERPOSITION_INJECTION',
  ENTANGLEMENT_HIJACKING = 'ENTANGLEMENT_HIJACKING',
  INTERFERENCE_MANIPULATION = 'INTERFERENCE_MANIPULATION',
  COHERENCE_ATTACK = 'COHERENCE_ATTACK',
  MEASUREMENT_SPOOFING = 'MEASUREMENT_SPOOFING',
  QUANTUM_DOS_ATTACK = 'QUANTUM_DOS_ATTACK',
  COMPUTATIONAL_OVERFLOW = 'COMPUTATIONAL_OVERFLOW',
  UNAUTHORIZED_QUANTUM_ACCESS = 'UNAUTHORIZED_QUANTUM_ACCESS'
}

export interface QuantumSecurityPolicy {
  maxQuantumOperationsPerSecond: number
  maxCoherenceTime: number
  maxEntanglementDepth: number
  allowedQuantumGates: string[]
  requireAuthentication: boolean
  enableAuditLogging: boolean
  enableQuantumEncryption: boolean
  quantumAccessControlList: Map<string, QuantumPermission[]>
}

export interface QuantumPermission {
  operation: string
  resource: string
  level: 'read' | 'write' | 'execute' | 'admin'
  conditions: string[]
}

export interface QuantumSecurityEvent {
  id: string
  type: QuantumSecurityThreat
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  timestamp: number
  userId: string
  quantumSystemId: string
  operation: string
  details: Record<string, any>
  blocked: boolean
  resolved: boolean
}

export interface QuantumRateLimiter {
  userId: string
  operationCounts: Map<string, number>
  windowStart: number
  windowDuration: number
  maxOperations: number
}

export interface QuantumAuditLog {
  id: string
  timestamp: number
  userId: string
  operation: string
  quantumSystemId: string
  parameters: Record<string, any>
  result: 'success' | 'failure' | 'blocked'
  securityLevel: string
  ipAddress?: string
  userAgent?: string
}

export class QuantumSecurityManager extends EventEmitter {
  private static instance: QuantumSecurityManager | null = null
  private securityPolicy: QuantumSecurityPolicy
  private securityEvents: Map<string, QuantumSecurityEvent> = new Map()
  private rateLimiters: Map<string, QuantumRateLimiter> = new Map()
  private auditLogs: QuantumAuditLog[] = []
  private authenticatedSessions: Map<string, { userId: string, permissions: QuantumPermission[], expiry: number }> = new Map()
  private quantumEncryptionKeys: Map<string, string> = new Map()
  private threatDetectionActive: boolean = true

  private constructor() {
    super()
    
    this.securityPolicy = {
      maxQuantumOperationsPerSecond: 100,
      maxCoherenceTime: 300, // 5 minutes
      maxEntanglementDepth: 10,
      allowedQuantumGates: ['hadamard', 'pauli-x', 'pauli-y', 'pauli-z', 'phase', 'rotation'],
      requireAuthentication: true,
      enableAuditLogging: true,
      enableQuantumEncryption: true,
      quantumAccessControlList: new Map()
    }

    this.initializeDefaultPermissions()
    this.startSecurityMonitoring()
  }

  public static getInstance(): QuantumSecurityManager {
    if (!QuantumSecurityManager.instance) {
      QuantumSecurityManager.instance = new QuantumSecurityManager()
    }
    return QuantumSecurityManager.instance
  }

  // Authentication and authorization
  public authenticateQuantumUser(userId: string, credentials: any): string | null {
    try {
      // Simulate authentication (in production, use proper auth)
      if (!userId || !credentials) {
        this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'HIGH', userId, '', 'authenticate', {
          reason: 'Invalid credentials'
        }, true)
        return null
      }

      // Generate session token
      const sessionToken = this.generateSecureToken()
      const permissions = this.getDefaultPermissions(userId)
      
      this.authenticatedSessions.set(sessionToken, {
        userId,
        permissions,
        expiry: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
      })

      this.auditQuantumOperation(userId, 'authenticate', '', {}, 'success')
      
      logger.info('QuantumSecurityManager', 'User authenticated for quantum operations', { userId })
      
      return sessionToken
    } catch (error) {
      logger.error('QuantumSecurityManager', 'Authentication failed', { userId, error })
      return null
    }
  }

  public validateQuantumAccess(
    sessionToken: string,
    operation: string,
    quantumSystemId: string,
    parameters: Record<string, any> = {}
  ): boolean {
    const session = this.authenticatedSessions.get(sessionToken)
    
    if (!session) {
      this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'HIGH', 'unknown', quantumSystemId, operation, {
        reason: 'Invalid session token'
      }, true)
      return false
    }

    if (session.expiry < Date.now()) {
      this.authenticatedSessions.delete(sessionToken)
      this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'MEDIUM', session.userId, quantumSystemId, operation, {
        reason: 'Session expired'
      }, true)
      return false
    }

    // Check permissions
    const hasPermission = this.checkQuantumPermission(session.permissions, operation, quantumSystemId)
    if (!hasPermission) {
      this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_QUANTUM_ACCESS, 'HIGH', session.userId, quantumSystemId, operation, {
        reason: 'Insufficient permissions'
      }, true)
      return false
    }

    // Rate limiting
    if (!this.checkRateLimit(session.userId, operation)) {
      this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_DOS_ATTACK, 'MEDIUM', session.userId, quantumSystemId, operation, {
        reason: 'Rate limit exceeded'
      }, true)
      return false
    }

    // Validate quantum parameters
    if (!this.validateQuantumParameters(operation, parameters)) {
      this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_STATE_TAMPERING, 'HIGH', session.userId, quantumSystemId, operation, {
        reason: 'Invalid parameters detected',
        parameters
      }, true)
      return false
    }

    return true
  }

  // Quantum-specific security validations
  public validateQuantumStateAccess(userId: string, quantumSystemId: string, operation: string): boolean {
    // Check if user is trying to access unauthorized quantum states
    if (operation.includes('admin') && !this.hasAdminPermissions(userId)) {
      this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_STATE_ACCESS, 'HIGH', userId, quantumSystemId, operation, {
        reason: 'Admin operation without admin permissions'
      }, true)
      return false
    }

    // Detect potential quantum state tampering
    if (this.detectQuantumTampering(operation, quantumSystemId)) {
      this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_STATE_TAMPERING, 'CRITICAL', userId, quantumSystemId, operation, {
        reason: 'Quantum state tampering detected'
      }, true)
      return false
    }

    return true
  }

  public validateSuperpositionOperation(userId: string, quantumSystemId: string, states: any[]): boolean {
    // Check for superposition injection attacks
    if (states.length > this.securityPolicy.maxEntanglementDepth * 2) {
      this.logSecurityEvent(QuantumSecurityThreat.SUPERPOSITION_INJECTION, 'HIGH', userId, quantumSystemId, 'superposition', {
        reason: 'Excessive superposition states',
        stateCount: states.length
      }, true)
      return false
    }

    // Validate state amplitudes for malicious values
    for (const state of states) {
      if (state.amplitude && (isNaN(state.amplitude) || state.amplitude > 100 || state.amplitude < 0)) {
        this.logSecurityEvent(QuantumSecurityThreat.SUPERPOSITION_INJECTION, 'MEDIUM', userId, quantumSystemId, 'superposition', {
          reason: 'Invalid amplitude values',
          invalidAmplitude: state.amplitude
        }, true)
        return false
      }
    }

    return true
  }

  public validateEntanglementOperation(userId: string, system1Id: string, system2Id: string, strength: number): boolean {
    // Check for entanglement hijacking
    if (strength > 2.0 || strength < 0) {
      this.logSecurityEvent(QuantumSecurityThreat.ENTANGLEMENT_HIJACKING, 'HIGH', userId, system1Id, 'entanglement', {
        reason: 'Invalid entanglement strength',
        strength,
        system2Id
      }, true)
      return false
    }

    // Check entanglement depth limits
    const currentEntanglements = this.getCurrentEntanglementCount(system1Id)
    if (currentEntanglements >= this.securityPolicy.maxEntanglementDepth) {
      this.logSecurityEvent(QuantumSecurityThreat.ENTANGLEMENT_HIJACKING, 'MEDIUM', userId, system1Id, 'entanglement', {
        reason: 'Entanglement depth limit exceeded',
        currentDepth: currentEntanglements
      }, true)
      return false
    }

    return true
  }

  public validateInterferencePattern(userId: string, patternId: string, strength: number, type: string): boolean {
    // Check for interference manipulation
    if (strength > 10.0 || strength < 0) {
      this.logSecurityEvent(QuantumSecurityThreat.INTERFERENCE_MANIPULATION, 'HIGH', userId, patternId, 'interference', {
        reason: 'Excessive interference strength',
        strength,
        type
      }, true)
      return false
    }

    // Validate interference type
    const allowedTypes = ['constructive', 'destructive', 'mixed']
    if (!allowedTypes.includes(type)) {
      this.logSecurityEvent(QuantumSecurityThreat.INTERFERENCE_MANIPULATION, 'MEDIUM', userId, patternId, 'interference', {
        reason: 'Invalid interference type',
        type
      }, true)
      return false
    }

    return true
  }

  public validateQuantumGateOperation(userId: string, quantumSystemId: string, gateType: string, parameters: any): boolean {
    // Check if gate type is allowed
    if (!this.securityPolicy.allowedQuantumGates.includes(gateType)) {
      this.logSecurityEvent(QuantumSecurityThreat.UNAUTHORIZED_STATE_ACCESS, 'HIGH', userId, quantumSystemId, 'quantum_gate', {
        reason: 'Unauthorized gate type',
        gateType
      }, true)
      return false
    }

    // Validate gate parameters
    if (gateType === 'rotation' && parameters.angle && Math.abs(parameters.angle) > 2 * Math.PI) {
      this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_STATE_TAMPERING, 'MEDIUM', userId, quantumSystemId, 'quantum_gate', {
        reason: 'Invalid rotation angle',
        angle: parameters.angle
      }, true)
      return false
    }

    return true
  }

  // Quantum encryption for sensitive data
  public encryptQuantumData(data: any, quantumSystemId: string): string {
    if (!this.securityPolicy.enableQuantumEncryption) {
      return JSON.stringify(data)
    }

    try {
      const key = this.getOrCreateEncryptionKey(quantumSystemId)
      
      // Simplified quantum-inspired encryption (in production, use proper quantum-safe encryption)
      const jsonData = JSON.stringify(data)
      const encrypted = this.simpleQuantumEncrypt(jsonData, key)
      
      return encrypted
    } catch (error) {
      logger.error('QuantumSecurityManager', 'Quantum encryption failed', { error, quantumSystemId })
      return JSON.stringify(data) // Fallback to unencrypted
    }
  }

  public decryptQuantumData(encryptedData: string, quantumSystemId: string): any {
    if (!this.securityPolicy.enableQuantumEncryption) {
      return JSON.parse(encryptedData)
    }

    try {
      const key = this.quantumEncryptionKeys.get(quantumSystemId)
      if (!key) {
        throw new Error('Encryption key not found')
      }

      const decrypted = this.simpleQuantumDecrypt(encryptedData, key)
      return JSON.parse(decrypted)
    } catch (error) {
      logger.error('QuantumSecurityManager', 'Quantum decryption failed', { error, quantumSystemId })
      throw error
    }
  }

  // Audit logging
  public auditQuantumOperation(
    userId: string,
    operation: string,
    quantumSystemId: string,
    parameters: Record<string, any>,
    result: 'success' | 'failure' | 'blocked',
    metadata: Record<string, any> = {}
  ): void {
    if (!this.securityPolicy.enableAuditLogging) return

    const auditLog: QuantumAuditLog = {
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
    }

    this.auditLogs.push(auditLog)

    // Emit audit event
    this.emit('quantumAudit', auditLog)

    // Clean up old logs (keep last 10000)
    if (this.auditLogs.length > 10000) {
      this.auditLogs.splice(0, this.auditLogs.length - 10000)
    }
  }

  // Security monitoring and threat detection
  private startSecurityMonitoring(): void {
    setInterval(() => {
      if (this.threatDetectionActive) {
        this.detectAnomalousPatterns()
        this.cleanupExpiredSessions()
        this.resetRateLimitWindows()
      }
    }, 30000) // Every 30 seconds
  }

  private detectAnomalousPatterns(): void {
    const recentEvents = Array.from(this.securityEvents.values())
      .filter(event => Date.now() - event.timestamp < 300000) // Last 5 minutes

    // Detect multiple failed operations from same user
    const failuresByUser = new Map<string, number>()
    recentEvents.forEach(event => {
      if (!event.resolved) {
        failuresByUser.set(event.userId, (failuresByUser.get(event.userId) || 0) + 1)
      }
    })

    failuresByUser.forEach((count, userId) => {
      if (count > 10) {
        this.logSecurityEvent(QuantumSecurityThreat.QUANTUM_DOS_ATTACK, 'HIGH', userId, '', 'anomaly_detection', {
          reason: 'Excessive failed operations',
          failureCount: count
        }, false)
      }
    })
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredSessions: string[] = []
    
    this.authenticatedSessions.forEach((session, token) => {
      if (session.expiry < now) {
        expiredSessions.push(token)
      }
    })

    expiredSessions.forEach(token => {
      this.authenticatedSessions.delete(token)
    })

    if (expiredSessions.length > 0) {
      logger.debug('QuantumSecurityManager', 'Cleaned up expired sessions', { count: expiredSessions.length })
    }
  }

  private resetRateLimitWindows(): void {
    const now = Date.now()
    const expiredLimiters: string[] = []

    this.rateLimiters.forEach((limiter, userId) => {
      if (now - limiter.windowStart > limiter.windowDuration) {
        limiter.operationCounts.clear()
        limiter.windowStart = now
      }
    })
  }

  // Helper methods
  private checkQuantumPermission(permissions: QuantumPermission[], operation: string, resource: string): boolean {
    return permissions.some(permission => {
      const operationMatch = permission.operation === '*' || permission.operation === operation
      const resourceMatch = permission.resource === '*' || permission.resource === resource
      return operationMatch && resourceMatch
    })
  }

  private checkRateLimit(userId: string, operation: string): boolean {
    let limiter = this.rateLimiters.get(userId)
    
    if (!limiter) {
      limiter = {
        userId,
        operationCounts: new Map(),
        windowStart: Date.now(),
        windowDuration: 60000, // 1 minute
        maxOperations: this.securityPolicy.maxQuantumOperationsPerSecond * 60
      }
      this.rateLimiters.set(userId, limiter)
    }

    const currentCount = limiter.operationCounts.get(operation) || 0
    
    if (currentCount >= limiter.maxOperations) {
      return false
    }

    limiter.operationCounts.set(operation, currentCount + 1)
    return true
  }

  private validateQuantumParameters(operation: string, parameters: Record<string, any>): boolean {
    // Basic parameter validation
    for (const [key, value] of Object.entries(parameters)) {
      // Check for injection attempts
      if (typeof value === 'string' && (value.includes('<script>') || value.includes('javascript:'))) {
        return false
      }
      
      // Check for excessive values that could cause DoS
      if (typeof value === 'number' && (value > 1e10 || value < -1e10)) {
        return false
      }
    }

    return true
  }

  private detectQuantumTampering(operation: string, quantumSystemId: string): boolean {
    // Simplified tampering detection
    const suspiciousOperations = ['override', 'bypass', 'inject', 'exploit']
    return suspiciousOperations.some(suspicious => operation.toLowerCase().includes(suspicious))
  }

  private hasAdminPermissions(userId: string): boolean {
    // Check if user has admin permissions
    const userPermissions = this.securityPolicy.quantumAccessControlList.get(userId) || []
    return userPermissions.some(permission => permission.level === 'admin')
  }

  private getCurrentEntanglementCount(systemId: string): number {
    // Simplified entanglement count (in production, query actual system)
    return Math.floor(Math.random() * 5) // Placeholder
  }

  private logSecurityEvent(
    type: QuantumSecurityThreat,
    severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
    userId: string,
    quantumSystemId: string,
    operation: string,
    details: Record<string, any>,
    blocked: boolean
  ): void {
    const event: QuantumSecurityEvent = {
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
    }

    this.securityEvents.set(event.id, event)
    
    // Emit security event
    this.emit('quantumSecurityThreat', event)

    logger.warn('QuantumSecurityManager', `Security threat detected: ${type}`, {
      eventId: event.id,
      severity,
      userId,
      quantumSystemId,
      operation,
      blocked
    })
  }

  private initializeDefaultPermissions(): void {
    // Default permissions for different user types
    const defaultPermissions: QuantumPermission[] = [
      { operation: 'read', resource: '*', level: 'read', conditions: [] },
      { operation: 'measure', resource: '*', level: 'read', conditions: [] },
      { operation: 'create', resource: 'superposition', level: 'write', conditions: ['max_states:5'] },
      { operation: 'apply_gate', resource: '*', level: 'execute', conditions: ['allowed_gates'] }
    ]

    this.securityPolicy.quantumAccessControlList.set('default', defaultPermissions)
  }

  private getDefaultPermissions(userId: string): QuantumPermission[] {
    return this.securityPolicy.quantumAccessControlList.get(userId) || 
           this.securityPolicy.quantumAccessControlList.get('default') || []
  }

  private generateSecureToken(): string {
    return `qt_${Date.now()}_${Math.random().toString(36).substr(2, 16)}`
  }

  private getOrCreateEncryptionKey(quantumSystemId: string): string {
    let key = this.quantumEncryptionKeys.get(quantumSystemId)
    
    if (!key) {
      key = this.generateQuantumEncryptionKey()
      this.quantumEncryptionKeys.set(quantumSystemId, key)
    }
    
    return key
  }

  private generateQuantumEncryptionKey(): string {
    // Simplified quantum key generation
    return Array.from({ length: 32 }, () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0')).join('')
  }

  private simpleQuantumEncrypt(data: string, key: string): string {
    // Simplified encryption (in production, use proper quantum-safe algorithms)
    let encrypted = ''
    for (let i = 0; i < data.length; i++) {
      const keyChar = key[i % key.length]
      const dataChar = data.charCodeAt(i)
      const keyCode = keyChar.charCodeAt(0)
      encrypted += String.fromCharCode(dataChar ^ keyCode)
    }
    return btoa(encrypted) // Base64 encode
  }

  private simpleQuantumDecrypt(encryptedData: string, key: string): string {
    // Simplified decryption
    const encrypted = atob(encryptedData) // Base64 decode
    let decrypted = ''
    for (let i = 0; i < encrypted.length; i++) {
      const keyChar = key[i % key.length]
      const encryptedChar = encrypted.charCodeAt(i)
      const keyCode = keyChar.charCodeAt(0)
      decrypted += String.fromCharCode(encryptedChar ^ keyCode)
    }
    return decrypted
  }

  private sanitizeParameters(parameters: Record<string, any>): Record<string, any> {
    const sanitized: Record<string, any> = {}
    
    for (const [key, value] of Object.entries(parameters)) {
      if (typeof value === 'string') {
        sanitized[key] = value.replace(/[<>]/g, '') // Basic sanitization
      } else if (typeof value === 'number') {
        sanitized[key] = isFinite(value) ? value : 0
      } else {
        sanitized[key] = value
      }
    }
    
    return sanitized
  }

  private calculateSecurityLevel(operation: string): string {
    const highSecurityOps = ['admin', 'delete', 'override', 'bypass']
    const mediumSecurityOps = ['create', 'update', 'entangle', 'apply_gate']
    
    if (highSecurityOps.some(op => operation.includes(op))) return 'HIGH'
    if (mediumSecurityOps.some(op => operation.includes(op))) return 'MEDIUM'
    return 'LOW'
  }

  // Public API methods
  public getSecurityEvents(userId?: string): QuantumSecurityEvent[] {
    const events = Array.from(this.securityEvents.values())
    return userId ? events.filter(event => event.userId === userId) : events
  }

  public getAuditLogs(userId?: string, operation?: string): QuantumAuditLog[] {
    let logs = [...this.auditLogs]
    
    if (userId) {
      logs = logs.filter(log => log.userId === userId)
    }
    
    if (operation) {
      logs = logs.filter(log => log.operation === operation)
    }
    
    return logs.sort((a, b) => b.timestamp - a.timestamp)
  }

  public updateSecurityPolicy(updates: Partial<QuantumSecurityPolicy>): void {
    this.securityPolicy = { ...this.securityPolicy, ...updates }
    
    logger.info('QuantumSecurityManager', 'Security policy updated', { updates })
    this.emit('securityPolicyUpdated', this.securityPolicy)
  }

  public getSecurityPolicy(): QuantumSecurityPolicy {
    return { ...this.securityPolicy }
  }

  public resolveSecurityEvent(eventId: string, resolution: string): boolean {
    const event = this.securityEvents.get(eventId)
    
    if (event) {
      event.resolved = true
      event.details.resolution = resolution
      event.details.resolvedAt = Date.now()
      
      this.emit('securityEventResolved', event)
      
      logger.info('QuantumSecurityManager', 'Security event resolved', {
        eventId,
        type: event.type,
        resolution
      })
      
      return true
    }
    
    return false
  }

  public enableThreatDetection(): void {
    this.threatDetectionActive = true
    logger.info('QuantumSecurityManager', 'Threat detection enabled')
  }

  public disableThreatDetection(): void {
    this.threatDetectionActive = false
    logger.info('QuantumSecurityManager', 'Threat detection disabled')
  }

  // Cleanup
  public dispose(): void {
    logger.info('QuantumSecurityManager', 'Disposing quantum security manager')
    
    this.securityEvents.clear()
    this.rateLimiters.clear()
    this.auditLogs.length = 0
    this.authenticatedSessions.clear()
    this.quantumEncryptionKeys.clear()
    this.threatDetectionActive = false
    this.removeAllListeners()
    
    QuantumSecurityManager.instance = null
  }
}