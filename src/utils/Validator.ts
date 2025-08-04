import { Vector3 } from 'three'
import type { Agent, AgentState, NetworkConfig, XRSessionConfig } from '../types'

export class ValidationError extends Error {
  constructor(message: string, public field?: string, public value?: any) {
    super(message)
    this.name = 'ValidationError'
  }
}

export class Validator {
  static validateAgent(agent: any): agent is Agent {
    const errors: string[] = []

    if (!agent || typeof agent !== 'object') {
      throw new ValidationError('Agent must be an object')
    }

    // Required fields
    if (!agent.id || typeof agent.id !== 'string') {
      errors.push('Agent ID must be a non-empty string')
    }

    if (!agent.type || typeof agent.type !== 'string') {
      errors.push('Agent type must be a non-empty string')
    }

    // Position validation
    if (!this.isValidVector3(agent.position)) {
      errors.push('Agent position must be a valid Vector3')
    }

    if (!this.isValidVector3(agent.velocity)) {
      errors.push('Agent velocity must be a valid Vector3')
    }

    // State validation
    if (!this.isValidAgentState(agent.currentState)) {
      errors.push('Agent currentState is invalid')
    }

    // Arrays
    if (!Array.isArray(agent.activeGoals)) {
      errors.push('Agent activeGoals must be an array')
    }

    if (!Array.isArray(agent.connectedPeers)) {
      errors.push('Agent connectedPeers must be an array')
    }

    // Metrics
    if (!this.isValidMetrics(agent.metrics)) {
      errors.push('Agent metrics are invalid')
    }

    // Metadata
    if (agent.metadata && typeof agent.metadata !== 'object') {
      errors.push('Agent metadata must be an object')
    }

    // Timestamp
    if (!agent.lastUpdate || typeof agent.lastUpdate !== 'number') {
      errors.push('Agent lastUpdate must be a timestamp number')
    }

    if (errors.length > 0) {
      throw new ValidationError(`Agent validation failed: ${errors.join(', ')}`)
    }

    return true
  }

  static validateAgentUpdate(update: any): boolean {
    if (!update || typeof update !== 'object') {
      throw new ValidationError('Agent update must be an object')
    }

    if (!update.id || typeof update.id !== 'string') {
      throw new ValidationError('Agent update must have a valid ID')
    }

    // Optional position validation
    if (update.position && !this.isValidVector3(update.position)) {
      throw new ValidationError('Agent update position must be a valid Vector3')
    }

    // Optional velocity validation
    if (update.velocity && !this.isValidVector3(update.velocity)) {
      throw new ValidationError('Agent update velocity must be a valid Vector3')
    }

    // Optional state validation
    if (update.currentState && !this.isValidAgentState(update.currentState)) {
      throw new ValidationError('Agent update currentState is invalid')
    }

    return true
  }

  static validateNetworkConfig(config: any): config is NetworkConfig {
    if (!config || typeof config !== 'object') {
      throw new ValidationError('Network config must be an object')
    }

    if (config.endpoint && typeof config.endpoint !== 'string') {
      throw new ValidationError('Network endpoint must be a string')
    }

    if (config.reconnectAttempts !== undefined) {
      if (typeof config.reconnectAttempts !== 'number' || config.reconnectAttempts < 0) {
        throw new ValidationError('Reconnect attempts must be a non-negative number')
      }
    }

    if (config.heartbeatInterval !== undefined) {
      if (typeof config.heartbeatInterval !== 'number' || config.heartbeatInterval < 1000) {
        throw new ValidationError('Heartbeat interval must be at least 1000ms')
      }
    }

    return true
  }

  static validateXRSessionConfig(config: any): config is XRSessionConfig {
    if (!config || typeof config !== 'object') {
      throw new ValidationError('XR session config must be an object')
    }

    const validModes = ['immersive-vr', 'immersive-ar', 'inline']
    if (!config.mode || !validModes.includes(config.mode)) {
      throw new ValidationError(`XR mode must be one of: ${validModes.join(', ')}`)
    }

    const validReferenceSpaces = ['local-floor', 'bounded-floor', 'unbounded']
    if (!config.referenceSpace || !validReferenceSpaces.includes(config.referenceSpace)) {
      throw new ValidationError(`Reference space must be one of: ${validReferenceSpaces.join(', ')}`)
    }

    if (config.controllers !== undefined && typeof config.controllers !== 'boolean') {
      throw new ValidationError('Controllers flag must be a boolean')
    }

    if (config.handTracking !== undefined && typeof config.handTracking !== 'boolean') {
      throw new ValidationError('Hand tracking flag must be a boolean')
    }

    return true
  }

  static sanitizeString(input: string, maxLength = 1000): string {
    if (typeof input !== 'string') {
      throw new ValidationError('Input must be a string')
    }

    // Remove potential XSS characters
    const sanitized = input
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/javascript:/gi, '')
      .replace(/on\w+\s*=/gi, '')
      .trim()

    if (sanitized.length > maxLength) {
      return sanitized.substring(0, maxLength)
    }

    return sanitized
  }

  static sanitizeAgentData(agent: any): Agent {
    if (!this.validateAgent(agent)) {
      throw new ValidationError('Invalid agent data')
    }

    return {
      ...agent,
      id: this.sanitizeString(agent.id, 100),
      type: this.sanitizeString(agent.type, 50),
      currentState: {
        ...agent.currentState,
        behavior: this.sanitizeString(agent.currentState.behavior, 100),
        role: this.sanitizeString(agent.currentState.role, 50)
      },
      metadata: this.sanitizeObject(agent.metadata),
      activeGoals: agent.activeGoals.map((goal: any) => this.sanitizeString(String(goal), 200)),
      connectedPeers: agent.connectedPeers.map((peer: any) => this.sanitizeString(String(peer), 100))
    }
  }

  private static isValidVector3(vec: any): boolean {
    return vec &&
      typeof vec === 'object' &&
      typeof vec.x === 'number' &&
      typeof vec.y === 'number' &&
      typeof vec.z === 'number' &&
      isFinite(vec.x) &&
      isFinite(vec.y) &&
      isFinite(vec.z)
  }

  private static isValidAgentState(state: any): state is AgentState {
    if (!state || typeof state !== 'object') return false

    const validStatuses = ['active', 'idle', 'error', 'paused']
    if (!validStatuses.includes(state.status)) return false

    if (typeof state.behavior !== 'string') return false
    if (typeof state.role !== 'string') return false
    if (typeof state.energy !== 'number' || state.energy < 0 || state.energy > 100) return false
    if (typeof state.priority !== 'number' || state.priority < 1 || state.priority > 10) return false

    return true
  }

  private static isValidMetrics(metrics: any): boolean {
    if (!metrics || typeof metrics !== 'object') return false

    const requiredFields = ['cpuMs', 'memoryMB', 'msgPerSec', 'uptime']
    
    for (const field of requiredFields) {
      if (typeof metrics[field] !== 'number' || !isFinite(metrics[field])) {
        return false
      }
    }

    // Additional validation
    if (metrics.cpuMs < 0 || metrics.memoryMB < 0 || metrics.msgPerSec < 0 || metrics.uptime < 0) {
      return false
    }

    return true
  }

  private static sanitizeObject(obj: any, maxDepth = 3): any {
    if (maxDepth <= 0) return {}
    if (!obj || typeof obj !== 'object') return {}

    const sanitized: any = {}
    
    for (const [key, value] of Object.entries(obj)) {
      const sanitizedKey = this.sanitizeString(String(key), 100)
      
      if (typeof value === 'string') {
        sanitized[sanitizedKey] = this.sanitizeString(value, 1000)
      } else if (typeof value === 'number' && isFinite(value)) {
        sanitized[sanitizedKey] = value
      } else if (typeof value === 'boolean') {
        sanitized[sanitizedKey] = value
      } else if (typeof value === 'object' && value !== null) {
        sanitized[sanitizedKey] = this.sanitizeObject(value, maxDepth - 1)
      }
    }

    return sanitized
  }

  static validateWebSocketURL(url: string): boolean {
    try {
      const parsed = new URL(url)
      if (!['ws:', 'wss:'].includes(parsed.protocol)) {
        throw new ValidationError('WebSocket URL must use ws:// or wss:// protocol')
      }
      return true
    } catch (error) {
      throw new ValidationError('Invalid WebSocket URL format')
    }
  }

  static rateLimitCheck(identifier: string, maxRequests = 100, windowMs = 60000): boolean {
    // Simple in-memory rate limiting
    const now = Date.now()
    const key = `rateLimit_${identifier}`
    
    if (!(globalThis as any).rateLimitStore) {
      (globalThis as any).rateLimitStore = new Map()
    }
    
    const store = (globalThis as any).rateLimitStore
    const records = store.get(key) || []
    
    // Clean old records
    const validRecords = records.filter((timestamp: number) => now - timestamp < windowMs)
    
    if (validRecords.length >= maxRequests) {
      return false
    }
    
    validRecords.push(now)
    store.set(key, validRecords)
    
    return true
  }
}