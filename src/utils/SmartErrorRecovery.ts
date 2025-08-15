/**
 * Smart Error Recovery System
 * Advanced error recovery with learning capabilities and adaptive strategies
 */

import { EventEmitter } from 'eventemitter3'
import { logger } from './Logger'
import { errorHandler, ErrorSeverity } from './ErrorHandler'

interface RecoveryStrategy {
  id: string
  name: string
  errorTypes: string[]
  severity: ErrorSeverity[]
  strategy: () => Promise<boolean>
  cost: number // Recovery cost (time, resources)
  successRate: number // Historical success rate
  lastUsed: number
  cooldown: number // Cooldown period between uses
  maxRetries: number
  currentRetries: number
}

interface RecoveryAttempt {
  id: string
  errorId: string
  strategyId: string
  timestamp: number
  success: boolean
  duration: number
  context: unknown
}

interface ErrorPattern {
  pattern: string
  frequency: number
  lastSeen: number
  successfulRecoveries: string[]
  failedRecoveries: string[]
  context: unknown[]
}

export class SmartErrorRecovery extends EventEmitter {
  private strategies: Map<string, RecoveryStrategy> = new Map()
  private recoveryHistory: RecoveryAttempt[] = []
  private errorPatterns: Map<string, ErrorPattern> = new Map()
  private isEnabled = true
  private maxHistorySize = 1000
  private learningEnabled = true
  private adaptationThreshold = 0.7

  constructor() {
    super()
    this.initializeDefaultStrategies()
    this.setupHistoryCleanup()
    
    logger.info('SmartErrorRecovery', 'Smart error recovery system initialized')
  }

  private initializeDefaultStrategies(): void {
    // Network error recovery
    this.addRecoveryStrategy({
      id: 'network_retry',
      name: 'Network Retry with Exponential Backoff',
      errorTypes: ['NetworkError', 'ConnectionError', 'TimeoutError'],
      severity: [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH],
      strategy: async () => {
        await this.exponentialBackoff()
        return await this.testNetworkConnectivity()
      },
      cost: 1,
      successRate: 0.8,
      lastUsed: 0,
      cooldown: 5000,
      maxRetries: 3
    })

    // Memory pressure recovery
    this.addRecoveryStrategy({
      id: 'memory_cleanup',
      name: 'Memory Cleanup and Optimization',
      errorTypes: ['OutOfMemoryError', 'MemoryPressureError'],
      severity: [ErrorSeverity.HIGH, ErrorSeverity.CRITICAL],
      strategy: async () => {
        return await this.performMemoryCleanup()
      },
      cost: 2,
      successRate: 0.9,
      lastUsed: 0,
      cooldown: 30000,
      maxRetries: 2
    })

    // XR session recovery
    this.addRecoveryStrategy({
      id: 'xr_session_reset',
      name: 'XR Session Reset',
      errorTypes: ['XRError', 'WebXRError', 'SessionError'],
      severity: [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH],
      strategy: async () => {
        return await this.resetXRSession()
      },
      cost: 3,
      successRate: 0.7,
      lastUsed: 0,
      cooldown: 10000,
      maxRetries: 2
    })

    // Configuration reload
    this.addRecoveryStrategy({
      id: 'config_reload',
      name: 'Configuration Reload',
      errorTypes: ['ConfigurationError', 'ValidationError'],
      severity: [ErrorSeverity.LOW, ErrorSeverity.MEDIUM],
      strategy: async () => {
        return await this.reloadConfiguration()
      },
      cost: 1,
      successRate: 0.95,
      lastUsed: 0,
      cooldown: 0,
      maxRetries: 1
    })

    // Component restart
    this.addRecoveryStrategy({
      id: 'component_restart',
      name: 'Component Restart',
      errorTypes: ['ComponentError', 'StateError', 'InitializationError'],
      severity: [ErrorSeverity.MEDIUM, ErrorSeverity.HIGH],
      strategy: async () => {
        return await this.restartComponent()
      },
      cost: 4,
      successRate: 0.85,
      lastUsed: 0,
      cooldown: 15000,
      maxRetries: 1
    })

    // Resource allocation recovery
    this.addRecoveryStrategy({
      id: 'resource_reallocation',
      name: 'Resource Reallocation',
      errorTypes: ['ResourceError', 'AllocationError'],
      severity: [ErrorSeverity.MEDIUM],
      strategy: async () => {
        return await this.reallocateResources()
      },
      cost: 2,
      successRate: 0.75,
      lastUsed: 0,
      cooldown: 20000,
      maxRetries: 2
    })
  }

  addRecoveryStrategy(strategy: Omit<RecoveryStrategy, 'currentRetries'>): void {
    const fullStrategy: RecoveryStrategy = {
      ...strategy,
      currentRetries: 0
    }
    
    this.strategies.set(strategy.id, fullStrategy)
    logger.info('SmartErrorRecovery', 'Recovery strategy added', { 
      id: strategy.id, 
      name: strategy.name,
      errorTypes: strategy.errorTypes
    })
  }

  async attemptRecovery(error: Error, context: unknown = {}): Promise<boolean> {
    if (!this.isEnabled) {
      logger.debug('SmartErrorRecovery', 'Recovery disabled, skipping')
      return false
    }

    const errorType = error.constructor.name
    const errorMessage = error.message
    const errorId = this.generateErrorId(error, context)

    // Update error patterns
    this.updateErrorPattern(errorType, errorMessage, context)

    // Find suitable recovery strategies
    const strategies = this.selectRecoveryStrategies(error, context)
    
    if (strategies.length === 0) {
      logger.warn('SmartErrorRecovery', 'No recovery strategies found', { errorType, errorMessage })
      return false
    }

    // Sort strategies by effectiveness
    const rankedStrategies = this.rankStrategies(strategies, errorType)

    for (const strategy of rankedStrategies) {
      try {
        const recoveryAttempt = await this.executeStrategy(strategy, errorId, error, context)
        
        if (recoveryAttempt.success) {
          this.onRecoverySuccess(strategy, recoveryAttempt)
          return true
        } else {
          this.onRecoveryFailure(strategy, recoveryAttempt)
        }

      } catch (recoveryError) {
        logger.error('SmartErrorRecovery', 'Recovery strategy failed', {
          strategyId: strategy.id,
          error: (recoveryError as Error).message
        })
      }
    }

    logger.warn('SmartErrorRecovery', 'All recovery strategies failed', { errorType, errorId })
    return false
  }

  private selectRecoveryStrategies(error: Error, context: unknown): RecoveryStrategy[] {
    const errorType = error.constructor.name
    const severity = this.determineSeverity(error, context)
    const currentTime = Date.now()

    return Array.from(this.strategies.values()).filter(strategy => {
      // Check if strategy applies to this error type
      const typeMatch = strategy.errorTypes.includes(errorType) || 
                       strategy.errorTypes.some(pattern => errorType.includes(pattern))
      
      if (!typeMatch) return false

      // Check severity compatibility
      if (!strategy.severity.includes(severity)) return false

      // Check cooldown period
      if (currentTime - strategy.lastUsed < strategy.cooldown) return false

      // Check retry limit
      if (strategy.currentRetries >= strategy.maxRetries) return false

      return true
    })
  }

  private rankStrategies(strategies: RecoveryStrategy[], errorType: string): RecoveryStrategy[] {
    return strategies.sort((a, b) => {
      // Calculate effectiveness score
      const scoreA = this.calculateEffectivenessScore(a, errorType)
      const scoreB = this.calculateEffectivenessScore(b, errorType)
      
      return scoreB - scoreA // Higher score first
    })
  }

  private calculateEffectivenessScore(strategy: RecoveryStrategy, errorType: string): number {
    // Base score from success rate
    let score = strategy.successRate * 100

    // Adjust for cost (lower cost is better)
    score -= strategy.cost * 5

    // Adjust for pattern-specific success
    const pattern = this.errorPatterns.get(errorType)
    if (pattern && pattern.successfulRecoveries.includes(strategy.id)) {
      score += 20
    }
    if (pattern && pattern.failedRecoveries.includes(strategy.id)) {
      score -= 30
    }

    // Adjust for recent usage (diversity bonus)
    const timeSinceLastUse = Date.now() - strategy.lastUsed
    if (timeSinceLastUse > strategy.cooldown * 2) {
      score += 10
    }

    // Adjust for retry count
    score -= strategy.currentRetries * 15

    return Math.max(score, 0)
  }

  private async executeStrategy(
    strategy: RecoveryStrategy, 
    errorId: string, 
    error: Error, 
    context: unknown
  ): Promise<RecoveryAttempt> {
    const startTime = Date.now()
    const attemptId = this.generateAttemptId()

    logger.info('SmartErrorRecovery', 'Executing recovery strategy', {
      strategyId: strategy.id,
      strategyName: strategy.name,
      errorId,
      attempt: strategy.currentRetries + 1
    })

    try {
      strategy.currentRetries++
      strategy.lastUsed = startTime

      const success = await Promise.race([
        strategy.strategy(),
        new Promise<boolean>((_, reject) => 
          setTimeout(() => reject(new Error('Recovery strategy timeout')), 30000)
        )
      ])

      const duration = Date.now() - startTime
      
      const attempt: RecoveryAttempt = {
        id: attemptId,
        errorId,
        strategyId: strategy.id,
        timestamp: startTime,
        success,
        duration,
        context
      }

      this.recordRecoveryAttempt(attempt)
      
      if (success) {
        strategy.currentRetries = 0 // Reset on success
      }

      return attempt

    } catch (strategyError) {
      const duration = Date.now() - startTime
      
      const attempt: RecoveryAttempt = {
        id: attemptId,
        errorId,
        strategyId: strategy.id,
        timestamp: startTime,
        success: false,
        duration,
        context
      }

      this.recordRecoveryAttempt(attempt)
      return attempt
    }
  }

  private onRecoverySuccess(strategy: RecoveryStrategy, attempt: RecoveryAttempt): void {
    // Update strategy success rate using exponential moving average
    const alpha = 0.1
    strategy.successRate = strategy.successRate * (1 - alpha) + alpha

    this.emit('recovery_success', {
      strategyId: strategy.id,
      attemptId: attempt.id,
      duration: attempt.duration
    })

    logger.info('SmartErrorRecovery', 'Recovery successful', {
      strategyId: strategy.id,
      duration: attempt.duration,
      newSuccessRate: strategy.successRate
    })

    // Learn from success
    if (this.learningEnabled) {
      this.learnFromSuccess(strategy, attempt)
    }
  }

  private onRecoveryFailure(strategy: RecoveryStrategy, attempt: RecoveryAttempt): void {
    // Update strategy success rate
    const alpha = 0.1
    strategy.successRate = strategy.successRate * (1 - alpha)

    this.emit('recovery_failure', {
      strategyId: strategy.id,
      attemptId: attempt.id,
      duration: attempt.duration
    })

    logger.warn('SmartErrorRecovery', 'Recovery failed', {
      strategyId: strategy.id,
      duration: attempt.duration,
      newSuccessRate: strategy.successRate,
      retriesLeft: strategy.maxRetries - strategy.currentRetries
    })

    // Learn from failure
    if (this.learningEnabled) {
      this.learnFromFailure(strategy, attempt)
    }
  }

  private learnFromSuccess(strategy: RecoveryStrategy, attempt: RecoveryAttempt): void {
    // Reduce cooldown for successful strategies
    if (strategy.successRate > this.adaptationThreshold) {
      strategy.cooldown = Math.max(strategy.cooldown * 0.9, 1000)
    }

    // Update error patterns
    const errorPattern = this.findErrorPatternByAttempt(attempt)
    if (errorPattern && !errorPattern.successfulRecoveries.includes(strategy.id)) {
      errorPattern.successfulRecoveries.push(strategy.id)
      
      // Remove from failed recoveries if present
      const failedIndex = errorPattern.failedRecoveries.indexOf(strategy.id)
      if (failedIndex > -1) {
        errorPattern.failedRecoveries.splice(failedIndex, 1)
      }
    }
  }

  private learnFromFailure(strategy: RecoveryStrategy, attempt: RecoveryAttempt): void {
    // Increase cooldown for failing strategies
    if (strategy.successRate < this.adaptationThreshold) {
      strategy.cooldown = Math.min(strategy.cooldown * 1.2, 60000)
    }

    // Update error patterns
    const errorPattern = this.findErrorPatternByAttempt(attempt)
    if (errorPattern && !errorPattern.failedRecoveries.includes(strategy.id)) {
      errorPattern.failedRecoveries.push(strategy.id)
    }
  }

  private updateErrorPattern(errorType: string, errorMessage: string, context: unknown): void {
    const patternKey = errorType
    const currentTime = Date.now()

    if (!this.errorPatterns.has(patternKey)) {
      this.errorPatterns.set(patternKey, {
        pattern: errorType,
        frequency: 1,
        lastSeen: currentTime,
        successfulRecoveries: [],
        failedRecoveries: [],
        context: [context]
      })
    } else {
      const pattern = this.errorPatterns.get(patternKey)!
      pattern.frequency++
      pattern.lastSeen = currentTime
      pattern.context.push(context)
      
      // Keep context history manageable
      if (pattern.context.length > 10) {
        pattern.context.shift()
      }
    }
  }

  private findErrorPatternByAttempt(attempt: RecoveryAttempt): ErrorPattern | undefined {
    // This is a simplified lookup - in practice, you'd need to track the error type
    // that triggered each attempt
    return Array.from(this.errorPatterns.values())[0]
  }

  private recordRecoveryAttempt(attempt: RecoveryAttempt): void {
    this.recoveryHistory.push(attempt)
    
    if (this.recoveryHistory.length > this.maxHistorySize) {
      this.recoveryHistory.shift()
    }
  }

  private determineSeverity(error: Error, context: unknown): ErrorSeverity {
    // This could be more sophisticated based on error analysis
    if (error.message.includes('critical') || error.message.includes('fatal')) {
      return ErrorSeverity.CRITICAL
    }
    if (error.message.includes('network') || error.message.includes('timeout')) {
      return ErrorSeverity.MEDIUM
    }
    return ErrorSeverity.LOW
  }

  // Recovery strategy implementations
  private async exponentialBackoff(): Promise<void> {
    const delays = [1000, 2000, 4000, 8000]
    for (const delay of delays) {
      await new Promise(resolve => setTimeout(resolve, delay))
    }
  }

  private async testNetworkConnectivity(): Promise<boolean> {
    try {
      if (typeof navigator !== 'undefined' && 'onLine' in navigator) {
        return navigator.onLine
      }
      return true
    } catch {
      return false
    }
  }

  private async performMemoryCleanup(): Promise<boolean> {
    try {
      // Trigger garbage collection if available
      if (typeof window !== 'undefined' && (window as any).gc) {
        (window as any).gc()
      }
      
      // Clear caches
      this.emit('memory_cleanup_requested')
      
      return true
    } catch {
      return false
    }
  }

  private async resetXRSession(): Promise<boolean> {
    try {
      this.emit('xr_reset_requested')
      return true
    } catch {
      return false
    }
  }

  private async reloadConfiguration(): Promise<boolean> {
    try {
      this.emit('config_reload_requested')
      return true
    } catch {
      return false
    }
  }

  private async restartComponent(): Promise<boolean> {
    try {
      this.emit('component_restart_requested')
      return true
    } catch {
      return false
    }
  }

  private async reallocateResources(): Promise<boolean> {
    try {
      this.emit('resource_reallocation_requested')
      return true
    } catch {
      return false
    }
  }

  private generateErrorId(error: Error, context: unknown): string {
    const contextStr = JSON.stringify(context).substring(0, 100)
    return `err_${Date.now()}_${error.constructor.name}_${contextStr.length}`
  }

  private generateAttemptId(): string {
    return `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private setupHistoryCleanup(): void {
    setInterval(() => {
      this.cleanupHistory()
    }, 3600000) // Every hour
  }

  private cleanupHistory(): void {
    const cutoffTime = Date.now() - 86400000 // 24 hours
    
    this.recoveryHistory = this.recoveryHistory.filter(
      attempt => attempt.timestamp > cutoffTime
    )

    // Clean up old error patterns
    for (const [key, pattern] of this.errorPatterns) {
      if (pattern.lastSeen < cutoffTime) {
        this.errorPatterns.delete(key)
      }
    }
  }

  getRecoveryReport(): unknown {
    const totalAttempts = this.recoveryHistory.length
    const successfulAttempts = this.recoveryHistory.filter(a => a.success).length
    const successRate = totalAttempts > 0 ? successfulAttempts / totalAttempts : 0

    const strategiesReport = Array.from(this.strategies.values()).map(strategy => ({
      id: strategy.id,
      name: strategy.name,
      successRate: strategy.successRate,
      lastUsed: strategy.lastUsed,
      currentRetries: strategy.currentRetries,
      cooldown: strategy.cooldown
    }))

    const errorPatternsReport = Array.from(this.errorPatterns.entries()).map(([key, pattern]) => ({
      pattern: key,
      frequency: pattern.frequency,
      lastSeen: pattern.lastSeen,
      successfulRecoveries: pattern.successfulRecoveries.length,
      failedRecoveries: pattern.failedRecoveries.length
    }))

    return {
      timestamp: Date.now(),
      enabled: this.isEnabled,
      learningEnabled: this.learningEnabled,
      totalAttempts,
      successfulAttempts,
      overallSuccessRate: successRate,
      strategies: strategiesReport,
      errorPatterns: errorPatternsReport,
      recentAttempts: this.recoveryHistory.slice(-10)
    }
  }

  enableRecovery(): void {
    this.isEnabled = true
    logger.info('SmartErrorRecovery', 'Error recovery enabled')
  }

  disableRecovery(): void {
    this.isEnabled = false
    logger.info('SmartErrorRecovery', 'Error recovery disabled')
  }

  enableLearning(): void {
    this.learningEnabled = true
    logger.info('SmartErrorRecovery', 'Learning enabled')
  }

  disableLearning(): void {
    this.learningEnabled = false
    logger.info('SmartErrorRecovery', 'Learning disabled')
  }

  dispose(): void {
    this.disableRecovery()
    this.strategies.clear()
    this.recoveryHistory.length = 0
    this.errorPatterns.clear()
    this.removeAllListeners()
    
    logger.info('SmartErrorRecovery', 'Smart error recovery disposed')
  }
}