import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import { Validator } from '../utils/Validator'

export interface SecurityPolicy {
  maxAgentsPerUser: number
  maxConnectionsPerIP: number
  allowedOrigins: string[]
  requireHTTPS: boolean
  sessionTimeoutMs: number
  maxMessageSize: number
  rateLimitRequests: number
  rateLimitWindowMs: number
}

export interface SecurityThreat {
  id: string
  type: 'injection' | 'overflow' | 'rate_limit' | 'suspicious_activity' | 'unauthorized_access'
  severity: 'low' | 'medium' | 'high' | 'critical'
  source: string
  description: string
  timestamp: number
  blocked: boolean
  data?: any
}

export interface SecurityAuditEvent {
  id: string
  timestamp: number
  userId?: string
  action: string
  resource: string
  result: 'success' | 'failure' | 'blocked'
  ipAddress?: string
  userAgent?: string
  additionalData?: Record<string, any>
}

export class SecurityManager extends EventEmitter {
  private static instance: SecurityManager
  private policy: SecurityPolicy
  private threats: SecurityThreat[] = []
  private auditLog: SecurityAuditEvent[] = []
  private activeConnections: Map<string, number> = new Map()
  private rateLimitTracker: Map<string, number[]> = new Map()
  private suspiciousActivityTracker: Map<string, number> = new Map()
  private sessionTokens: Map<string, { expires: number; userId: string }> = new Map()

  private constructor(policy?: Partial<SecurityPolicy>) {
    super()
    
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
    }

    this.startCleanupTask()
  }

  static getInstance(policy?: Partial<SecurityPolicy>): SecurityManager {
    if (!SecurityManager.instance) {
      SecurityManager.instance = new SecurityManager(policy)
    }
    return SecurityManager.instance
  }

  private startCleanupTask(): void {
    // Clean up expired sessions and old data every 5 minutes
    setInterval(() => {
      this.cleanupExpiredSessions()
      this.cleanupOldThreats()
      this.cleanupOldAuditLogs()
    }, 300000)
  }

  validateOrigin(origin: string): boolean {
    if (!origin) return false
    
    const isAllowed = this.policy.allowedOrigins.includes(origin) ||
                     this.policy.allowedOrigins.includes('*')

    if (!isAllowed) {
      this.reportThreat({
        type: 'unauthorized_access',
        severity: 'medium',
        source: origin,
        description: `Unauthorized origin: ${origin}`,
        blocked: true
      })
    }

    return isAllowed
  }

  validateHTTPS(url: string): boolean {
    if (!this.policy.requireHTTPS) return true
    
    const isHTTPS = url.startsWith('https://') || url.startsWith('wss://')
    
    if (!isHTTPS) {
      this.reportThreat({
        type: 'unauthorized_access',
        severity: 'high',
        source: url,
        description: 'Non-HTTPS connection attempted',
        blocked: true
      })
    }

    return isHTTPS
  }

  checkRateLimit(identifier: string, requests = 1): boolean {
    const now = Date.now()
    const windowStart = now - this.policy.rateLimitWindowMs
    
    if (!this.rateLimitTracker.has(identifier)) {
      this.rateLimitTracker.set(identifier, [])
    }

    const timestamps = this.rateLimitTracker.get(identifier)!
    
    // Remove old timestamps
    const validTimestamps = timestamps.filter(ts => ts > windowStart)
    
    if (validTimestamps.length + requests > this.policy.rateLimitRequests) {
      this.reportThreat({
        type: 'rate_limit',
        severity: 'medium',
        source: identifier,
        description: `Rate limit exceeded: ${validTimestamps.length + requests}/${this.policy.rateLimitRequests}`,
        blocked: true
      })
      return false
    }

    // Add new requests
    for (let i = 0; i < requests; i++) {
      validTimestamps.push(now)
    }
    
    this.rateLimitTracker.set(identifier, validTimestamps)
    return true
  }

  validateConnectionLimit(ipAddress: string): boolean {
    const currentConnections = this.activeConnections.get(ipAddress) || 0
    
    if (currentConnections >= this.policy.maxConnectionsPerIP) {
      this.reportThreat({
        type: 'overflow',
        severity: 'high',
        source: ipAddress,
        description: `Connection limit exceeded: ${currentConnections}/${this.policy.maxConnectionsPerIP}`,
        blocked: true
      })
      return false
    }

    return true
  }

  registerConnection(ipAddress: string): void {
    const current = this.activeConnections.get(ipAddress) || 0
    this.activeConnections.set(ipAddress, current + 1)
  }

  unregisterConnection(ipAddress: string): void {
    const current = this.activeConnections.get(ipAddress) || 0
    if (current > 0) {
      this.activeConnections.set(ipAddress, current - 1)
    }
  }

  sanitizeInput(input: any): any {
    if (typeof input === 'string') {
      return Validator.sanitizeString(input)
    }
    
    if (typeof input === 'object' && input !== null) {
      const sanitized: any = {}
      
      for (const [key, value] of Object.entries(input)) {
        const sanitizedKey = Validator.sanitizeString(String(key), 100)
        sanitized[sanitizedKey] = this.sanitizeInput(value)
      }
      
      return sanitized
    }
    
    return input
  }

  validateMessageSize(message: any): boolean {
    const messageSize = JSON.stringify(message).length
    
    if (messageSize > this.policy.maxMessageSize) {
      this.reportThreat({
        type: 'overflow',
        severity: 'medium',
        source: 'message',
        description: `Message size exceeded: ${messageSize}/${this.policy.maxMessageSize} bytes`,
        blocked: true
      })
      return false
    }

    return true
  }

  detectSuspiciousActivity(identifier: string, activity: string): boolean {
    const suspicionLevel = this.suspiciousActivityTracker.get(identifier) || 0
    let newSuspicionLevel = suspicionLevel

    // Analyze activity patterns
    switch (activity) {
      case 'rapid_connections':
        newSuspicionLevel += 10
        break
      case 'invalid_data':
        newSuspicionLevel += 5
        break
      case 'unauthorized_access':
        newSuspicionLevel += 20
        break
      case 'malformed_request':
        newSuspicionLevel += 3
        break
    }

    this.suspiciousActivityTracker.set(identifier, newSuspicionLevel)

    // Threshold for blocking
    const suspiciousThreshold = 50
    
    if (newSuspicionLevel >= suspiciousThreshold) {
      this.reportThreat({
        type: 'suspicious_activity',
        severity: 'high',
        source: identifier,
        description: `Suspicious activity detected: ${activity} (level: ${newSuspicionLevel})`,
        blocked: true
      })
      return true
    }

    return false
  }

  createSession(userId: string): string {
    const token = this.generateSecureToken()
    const expires = Date.now() + this.policy.sessionTimeoutMs
    
    this.sessionTokens.set(token, { expires, userId })
    
    this.auditLog.push({
      id: this.generateId(),
      timestamp: Date.now(),
      userId,
      action: 'session_create',
      resource: 'session',
      result: 'success'
    })

    return token
  }

  validateSession(token: string): { valid: boolean; userId?: string } {
    const session = this.sessionTokens.get(token)
    
    if (!session) {
      return { valid: false }
    }

    if (Date.now() > session.expires) {
      this.sessionTokens.delete(token)
      return { valid: false }
    }

    return { valid: true, userId: session.userId }
  }

  revokeSession(token: string): void {
    const session = this.sessionTokens.get(token)
    if (session) {
      this.sessionTokens.delete(token)
      
      this.auditLog.push({
        id: this.generateId(),
        timestamp: Date.now(),
        userId: session.userId,
        action: 'session_revoke',
        resource: 'session',
        result: 'success'
      })
    }
  }

  private reportThreat(threat: Omit<SecurityThreat, 'id' | 'timestamp'>): void {
    const fullThreat: SecurityThreat = {
      ...threat,
      id: this.generateId(),
      timestamp: Date.now()
    }

    this.threats.push(fullThreat)
    
    logger.warn('SecurityManager', `Security threat detected: ${threat.type}`, {
      threat: fullThreat
    })

    this.emit('threat', fullThreat)

    // Auto-block critical threats
    if (threat.severity === 'critical') {
      this.emit('criticalThreat', fullThreat)
    }
  }

  auditAction(
    action: string,
    resource: string,
    result: 'success' | 'failure' | 'blocked',
    context: {
      userId?: string
      ipAddress?: string
      userAgent?: string
      additionalData?: Record<string, any>
    } = {}
  ): void {
    const auditEvent: SecurityAuditEvent = {
      id: this.generateId(),
      timestamp: Date.now(),
      action,
      resource,
      result,
      ...context
    }

    this.auditLog.push(auditEvent)

    if (result === 'failure' || result === 'blocked') {
      logger.warn('SecurityManager', `Security audit: ${action} ${result}`, auditEvent)
    } else {
      logger.debug('SecurityManager', `Security audit: ${action} ${result}`, auditEvent)
    }

    this.emit('audit', auditEvent)
  }

  private generateSecureToken(): string {
    const array = new Uint8Array(32)
    crypto.getRandomValues(array)
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('')
  }

  private generateId(): string {
    return `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private cleanupExpiredSessions(): void {
    const now = Date.now()
    const expiredTokens: string[] = []

    this.sessionTokens.forEach((session, token) => {
      if (now > session.expires) {
        expiredTokens.push(token)
      }
    })

    expiredTokens.forEach(token => {
      this.sessionTokens.delete(token)
    })

    if (expiredTokens.length > 0) {
      logger.debug('SecurityManager', `Cleaned up ${expiredTokens.length} expired sessions`)
    }
  }

  private cleanupOldThreats(): void {
    const cutoff = Date.now() - (24 * 60 * 60 * 1000) // 24 hours
    const initialCount = this.threats.length
    
    this.threats = this.threats.filter(threat => threat.timestamp > cutoff)
    
    const removed = initialCount - this.threats.length
    if (removed > 0) {
      logger.debug('SecurityManager', `Cleaned up ${removed} old threat records`)
    }
  }

  private cleanupOldAuditLogs(): void {
    const cutoff = Date.now() - (7 * 24 * 60 * 60 * 1000) // 7 days
    const initialCount = this.auditLog.length
    
    this.auditLog = this.auditLog.filter(log => log.timestamp > cutoff)
    
    const removed = initialCount - this.auditLog.length
    if (removed > 0) {
      logger.debug('SecurityManager', `Cleaned up ${removed} old audit logs`)
    }
  }

  getThreats(filter?: {
    type?: SecurityThreat['type']
    severity?: SecurityThreat['severity']
    since?: number
  }): SecurityThreat[] {
    let filtered = [...this.threats]

    if (filter) {
      if (filter.type) {
        filtered = filtered.filter(t => t.type === filter.type)
      }
      if (filter.severity) {
        filtered = filtered.filter(t => t.severity === filter.severity)
      }
      if (filter.since) {
        filtered = filtered.filter(t => t.timestamp >= filter.since!)
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  getAuditLog(filter?: {
    userId?: string
    action?: string
    result?: SecurityAuditEvent['result']
    since?: number
  }): SecurityAuditEvent[] {
    let filtered = [...this.auditLog]

    if (filter) {
      if (filter.userId) {
        filtered = filtered.filter(log => log.userId === filter.userId)
      }
      if (filter.action) {
        filtered = filtered.filter(log => log.action === filter.action)
      }
      if (filter.result) {
        filtered = filtered.filter(log => log.result === filter.result)
      }
      if (filter.since) {
        filtered = filtered.filter(log => log.timestamp >= filter.since!)
      }
    }

    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }

  getSecurityReport(): {
    policy: SecurityPolicy
    threatsSummary: Record<string, number>
    auditSummary: Record<string, number>
    activeConnections: number
    activeSessions: number
  } {
    const threatsSummary = this.threats.reduce((acc, threat) => {
      acc[threat.type] = (acc[threat.type] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const auditSummary = this.auditLog.reduce((acc, log) => {
      acc[log.result] = (acc[log.result] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const activeConnections = Array.from(this.activeConnections.values())
      .reduce((sum, count) => sum + count, 0)

    return {
      policy: this.policy,
      threatsSummary,
      auditSummary,
      activeConnections,
      activeSessions: this.sessionTokens.size
    }
  }

  updatePolicy(updates: Partial<SecurityPolicy>): void {
    this.policy = { ...this.policy, ...updates }
    
    this.auditAction('policy_update', 'security_policy', 'success', {
      additionalData: updates
    })

    logger.info('SecurityManager', 'Security policy updated', updates)
  }

  exportSecurityData(): string {
    return JSON.stringify({
      policy: this.policy,
      threats: this.threats,
      auditLog: this.auditLog,
      exportTime: Date.now()
    }, null, 2)
  }
}