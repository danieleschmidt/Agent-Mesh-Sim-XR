import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

export enum QuantumErrorType {
  COHERENCE_LOSS = 'COHERENCE_LOSS',
  SUPERPOSITION_COLLAPSE = 'SUPERPOSITION_COLLAPSE',
  ENTANGLEMENT_BREAK = 'ENTANGLEMENT_BREAK',
  INTERFERENCE_OVERFLOW = 'INTERFERENCE_OVERFLOW',
  ANNEALING_DIVERGENCE = 'ANNEALING_DIVERGENCE',
  QUANTUM_STATE_CORRUPTION = 'QUANTUM_STATE_CORRUPTION',
  PLANNING_TIMEOUT = 'PLANNING_TIMEOUT',
  RESOURCE_EXHAUSTION = 'RESOURCE_EXHAUSTION',
  CONFIGURATION_ERROR = 'CONFIGURATION_ERROR',
  COMPUTATION_ERROR = 'COMPUTATION_ERROR'
}

export enum QuantumErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

export interface QuantumError {
  id: string
  type: QuantumErrorType
  severity: QuantumErrorSeverity
  message: string
  timestamp: number
  context: {
    component: string
    operation: string
    quantumState?: any
    systemId?: string
    additionalData?: Record<string, any>
  }
  stackTrace?: string
  recoveryAttempts: number
  resolved: boolean
}

export interface QuantumRecoveryStrategy {
  errorType: QuantumErrorType
  canHandle: (error: QuantumError) => boolean
  recover: (error: QuantumError) => Promise<boolean>
  fallback?: (error: QuantumError) => Promise<void>
  maxAttempts: number
  cooldownMs: number
}

export interface QuantumErrorMetrics {
  totalErrors: number
  errorsByType: Map<QuantumErrorType, number>
  errorsBySeverity: Map<QuantumErrorSeverity, number>
  recoveryRate: number
  averageRecoveryTime: number
  criticalErrorsToday: number
}

export class QuantumErrorHandler extends EventEmitter {
  private errors: Map<string, QuantumError> = new Map()
  private recoveryStrategies: Map<QuantumErrorType, QuantumRecoveryStrategy> = new Map()
  private activeRecoveries: Map<string, Promise<boolean>> = new Map()
  private errorMetrics: QuantumErrorMetrics
  private circuitBreakers: Map<string, { failures: number, lastFailure: number, isOpen: boolean }> = new Map()
  private maxErrorHistory: number = 1000

  constructor() {
    super()
    
    this.errorMetrics = {
      totalErrors: 0,
      errorsByType: new Map(),
      errorsBySeverity: new Map(),
      recoveryRate: 0,
      averageRecoveryTime: 0,
      criticalErrorsToday: 0
    }

    this.initializeRecoveryStrategies()
    this.startMetricsCollection()
  }

  // Handle quantum computation errors
  public async handleQuantumError(
    error: Error | QuantumError,
    type: QuantumErrorType,
    severity: QuantumErrorSeverity,
    context: {
      component: string
      operation: string
      quantumState?: any
      systemId?: string
      additionalData?: Record<string, any>
    }
  ): Promise<string> {
    const quantumError: QuantumError = this.isQuantumError(error) ? error : {
      id: this.generateErrorId(),
      type,
      severity,
      message: error.message || 'Unknown quantum error',
      timestamp: Date.now(),
      context,
      stackTrace: error.stack,
      recoveryAttempts: 0,
      resolved: false
    }

    // Store error
    this.errors.set(quantumError.id, quantumError)
    this.updateErrorMetrics(quantumError)

    // Log error
    logger.error('QuantumErrorHandler', `Quantum error occurred: ${quantumError.type}`, {
      errorId: quantumError.id,
      severity: quantumError.severity,
      component: quantumError.context.component,
      operation: quantumError.context.operation,
      message: quantumError.message
    })

    // Emit error event
    this.emit('quantumError', quantumError)

    // Check circuit breaker
    if (this.isCircuitBreakerOpen(quantumError.context.component)) {
      logger.warn('QuantumErrorHandler', 'Circuit breaker is open, skipping recovery', {
        component: quantumError.context.component
      })
      return quantumError.id
    }

    // Attempt recovery for non-critical errors
    if (quantumError.severity !== QuantumErrorSeverity.CRITICAL) {
      await this.attemptRecovery(quantumError)
    } else {
      this.handleCriticalError(quantumError)
    }

    return quantumError.id
  }

  // Attempt recovery from quantum error
  private async attemptRecovery(error: QuantumError): Promise<boolean> {
    if (this.activeRecoveries.has(error.id)) {
      return await this.activeRecoveries.get(error.id)!
    }

    const recoveryPromise = this.performRecovery(error)
    this.activeRecoveries.set(error.id, recoveryPromise)

    try {
      const recovered = await recoveryPromise
      this.activeRecoveries.delete(error.id)
      
      if (recovered) {
        error.resolved = true
        this.emit('quantumErrorRecovered', error)
        logger.info('QuantumErrorHandler', 'Quantum error recovered successfully', {
          errorId: error.id,
          attempts: error.recoveryAttempts
        })
      } else {
        this.updateCircuitBreaker(error.context.component, false)
        this.emit('quantumErrorRecoveryFailed', error)
      }

      return recovered
    } catch (recoveryError) {
      this.activeRecoveries.delete(error.id)
      logger.error('QuantumErrorHandler', 'Recovery attempt failed', {
        errorId: error.id,
        recoveryError: recoveryError.message
      })
      return false
    }
  }

  private async performRecovery(error: QuantumError): Promise<boolean> {
    const strategy = this.recoveryStrategies.get(error.type)
    
    if (!strategy) {
      logger.warn('QuantumErrorHandler', 'No recovery strategy found', { errorType: error.type })
      return false
    }

    if (error.recoveryAttempts >= strategy.maxAttempts) {
      logger.warn('QuantumErrorHandler', 'Maximum recovery attempts exceeded', {
        errorId: error.id,
        attempts: error.recoveryAttempts,
        maxAttempts: strategy.maxAttempts
      })
      
      // Try fallback if available
      if (strategy.fallback) {
        await strategy.fallback(error)
      }
      
      return false
    }

    if (!strategy.canHandle(error)) {
      logger.warn('QuantumErrorHandler', 'Strategy cannot handle error', {
        errorId: error.id,
        errorType: error.type
      })
      return false
    }

    // Cooldown period
    if (error.recoveryAttempts > 0) {
      await new Promise(resolve => setTimeout(resolve, strategy.cooldownMs))
    }

    error.recoveryAttempts++
    const startTime = Date.now()

    try {
      const recovered = await strategy.recover(error)
      const recoveryTime = Date.now() - startTime
      
      this.updateRecoveryMetrics(recoveryTime, recovered)
      
      if (recovered) {
        this.updateCircuitBreaker(error.context.component, true)
      }
      
      return recovered
    } catch (strategyError) {
      logger.error('QuantumErrorHandler', 'Recovery strategy execution failed', {
        errorId: error.id,
        strategyError: strategyError.message
      })
      return false
    }
  }

  // Handle critical quantum errors that require immediate attention
  private handleCriticalError(error: QuantumError): void {
    logger.error('QuantumErrorHandler', 'CRITICAL QUANTUM ERROR - Immediate intervention required', {
      errorId: error.id,
      type: error.type,
      component: error.context.component,
      quantumState: error.context.quantumState
    })

    // Open circuit breaker immediately
    this.updateCircuitBreaker(error.context.component, false, true)

    // Emit critical error event
    this.emit('criticalQuantumError', error)

    // Increment critical error count
    this.errorMetrics.criticalErrorsToday++

    // Trigger emergency quantum state reset if needed
    if (error.type === QuantumErrorType.QUANTUM_STATE_CORRUPTION) {
      this.triggerEmergencyStateReset(error)
    }
  }

  // Emergency quantum state reset
  private triggerEmergencyStateReset(error: QuantumError): void {
    logger.warn('QuantumErrorHandler', 'Triggering emergency quantum state reset', {
      errorId: error.id,
      systemId: error.context.systemId
    })

    this.emit('emergencyStateReset', {
      errorId: error.id,
      systemId: error.context.systemId,
      component: error.context.component
    })
  }

  // Get error by ID
  public getError(errorId: string): QuantumError | undefined {
    return this.errors.get(errorId)
  }

  // Get all errors for a component
  public getErrorsForComponent(component: string): QuantumError[] {
    return Array.from(this.errors.values())
      .filter(error => error.context.component === component)
  }

  // Get unresolved errors
  public getUnresolvedErrors(): QuantumError[] {
    return Array.from(this.errors.values())
      .filter(error => !error.resolved)
  }

  // Get error metrics
  public getErrorMetrics(): QuantumErrorMetrics {
    return { ...this.errorMetrics }
  }

  // Circuit breaker management
  private isCircuitBreakerOpen(component: string): boolean {
    const breaker = this.circuitBreakers.get(component)
    if (!breaker) return false

    // Reset breaker after timeout
    if (breaker.isOpen && Date.now() - breaker.lastFailure > 60000) { // 1 minute timeout
      breaker.isOpen = false
      breaker.failures = 0
    }

    return breaker.isOpen
  }

  private updateCircuitBreaker(component: string, success: boolean, forceOpen: boolean = false): void {
    let breaker = this.circuitBreakers.get(component)
    
    if (!breaker) {
      breaker = { failures: 0, lastFailure: 0, isOpen: false }
      this.circuitBreakers.set(component, breaker)
    }

    if (forceOpen) {
      breaker.isOpen = true
      breaker.lastFailure = Date.now()
      return
    }

    if (success) {
      breaker.failures = Math.max(0, breaker.failures - 1)
      if (breaker.failures === 0) {
        breaker.isOpen = false
      }
    } else {
      breaker.failures++
      breaker.lastFailure = Date.now()
      
      if (breaker.failures >= 5) { // Open after 5 failures
        breaker.isOpen = true
        logger.warn('QuantumErrorHandler', 'Circuit breaker opened', {
          component,
          failures: breaker.failures
        })
      }
    }
  }

  // Initialize recovery strategies
  private initializeRecoveryStrategies(): void {
    // Coherence loss recovery
    this.recoveryStrategies.set(QuantumErrorType.COHERENCE_LOSS, {
      errorType: QuantumErrorType.COHERENCE_LOSS,
      canHandle: (error) => error.context.quantumState && error.context.quantumState.coherence !== undefined,
      recover: async (error) => {
        // Attempt to restore coherence through quantum gate operations
        this.emit('restoreCoherence', {
          systemId: error.context.systemId,
          targetCoherence: 0.7
        })
        return true
      },
      maxAttempts: 3,
      cooldownMs: 1000
    })

    // Superposition collapse recovery
    this.recoveryStrategies.set(QuantumErrorType.SUPERPOSITION_COLLAPSE, {
      errorType: QuantumErrorType.SUPERPOSITION_COLLAPSE,
      canHandle: (error) => error.context.systemId !== undefined,
      recover: async (error) => {
        // Recreate superposition state
        this.emit('recreateSuperposition', {
          systemId: error.context.systemId,
          states: ['waiting', 'ready', 'executing']
        })
        return true
      },
      maxAttempts: 2,
      cooldownMs: 500
    })

    // Entanglement break recovery
    this.recoveryStrategies.set(QuantumErrorType.ENTANGLEMENT_BREAK, {
      errorType: QuantumErrorType.ENTANGLEMENT_BREAK,
      canHandle: (error) => error.context.additionalData?.entangledSystems !== undefined,
      recover: async (error) => {
        // Attempt to re-establish entanglement
        const entangledSystems = error.context.additionalData?.entangledSystems as string[]
        this.emit('reestablishEntanglement', {
          systemId: error.context.systemId,
          entangledSystems
        })
        return true
      },
      maxAttempts: 2,
      cooldownMs: 2000
    })

    // Interference overflow recovery
    this.recoveryStrategies.set(QuantumErrorType.INTERFERENCE_OVERFLOW, {
      errorType: QuantumErrorType.INTERFERENCE_OVERFLOW,
      canHandle: (error) => true,
      recover: async (error) => {
        // Reduce interference strength and reset patterns
        this.emit('resetInterference', {
          systemId: error.context.systemId,
          resetStrength: true
        })
        return true
      },
      maxAttempts: 1,
      cooldownMs: 3000
    })

    // Annealing divergence recovery
    this.recoveryStrategies.set(QuantumErrorType.ANNEALING_DIVERGENCE, {
      errorType: QuantumErrorType.ANNEALING_DIVERGENCE,
      canHandle: (error) => true,
      recover: async (error) => {
        // Restart annealing with different parameters
        this.emit('restartAnnealing', {
          systemId: error.context.systemId,
          reducedTemperature: true,
          increasedIterations: true
        })
        return true
      },
      maxAttempts: 2,
      cooldownMs: 5000
    })

    // Planning timeout recovery
    this.recoveryStrategies.set(QuantumErrorType.PLANNING_TIMEOUT, {
      errorType: QuantumErrorType.PLANNING_TIMEOUT,
      canHandle: (error) => true,
      recover: async (error) => {
        // Simplify planning parameters and retry
        this.emit('simplifyPlanning', {
          systemId: error.context.systemId,
          reducedComplexity: true
        })
        return true
      },
      fallback: async (error) => {
        // Fall back to classical planning
        this.emit('fallbackToClassical', {
          systemId: error.context.systemId
        })
      },
      maxAttempts: 1,
      cooldownMs: 1000
    })
  }

  // Utility methods
  private isQuantumError(error: any): error is QuantumError {
    return error && typeof error === 'object' && 'type' in error && 'severity' in error
  }

  private generateErrorId(): string {
    return `qerr_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private updateErrorMetrics(error: QuantumError): void {
    this.errorMetrics.totalErrors++

    // Update error by type
    const typeCount = this.errorMetrics.errorsByType.get(error.type) || 0
    this.errorMetrics.errorsByType.set(error.type, typeCount + 1)

    // Update error by severity
    const severityCount = this.errorMetrics.errorsBySeverity.get(error.severity) || 0
    this.errorMetrics.errorsBySeverity.set(error.severity, severityCount + 1)

    // Update critical errors count
    if (error.severity === QuantumErrorSeverity.CRITICAL) {
      this.errorMetrics.criticalErrorsToday++
    }

    // Clean up old errors
    if (this.errors.size > this.maxErrorHistory) {
      const oldestErrors = Array.from(this.errors.values())
        .sort((a, b) => a.timestamp - b.timestamp)
        .slice(0, this.errors.size - this.maxErrorHistory)
      
      oldestErrors.forEach(error => {
        this.errors.delete(error.id)
      })
    }
  }

  private updateRecoveryMetrics(recoveryTime: number, success: boolean): void {
    if (success) {
      const resolvedErrors = Array.from(this.errors.values()).filter(e => e.resolved).length
      this.errorMetrics.recoveryRate = resolvedErrors / this.errorMetrics.totalErrors

      // Update average recovery time (exponential moving average)
      const alpha = 0.1
      this.errorMetrics.averageRecoveryTime = 
        alpha * recoveryTime + (1 - alpha) * this.errorMetrics.averageRecoveryTime
    }
  }

  private startMetricsCollection(): void {
    // Reset daily metrics at midnight
    setInterval(() => {
      const now = new Date()
      if (now.getHours() === 0 && now.getMinutes() === 0) {
        this.errorMetrics.criticalErrorsToday = 0
        logger.info('QuantumErrorHandler', 'Daily error metrics reset')
      }
    }, 60000) // Check every minute
  }

  // Public API for error analysis
  public getErrorTrends(hours: number = 24): any {
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    const recentErrors = Array.from(this.errors.values())
      .filter(error => error.timestamp > cutoff)

    const hourlyBuckets = new Map<number, number>()
    
    recentErrors.forEach(error => {
      const hour = new Date(error.timestamp).getHours()
      hourlyBuckets.set(hour, (hourlyBuckets.get(hour) || 0) + 1)
    })

    return {
      totalRecentErrors: recentErrors.length,
      hourlyDistribution: Array.from(hourlyBuckets.entries()),
      errorTypes: this.groupErrorsByType(recentErrors),
      severityDistribution: this.groupErrorsBySeverity(recentErrors)
    }
  }

  private groupErrorsByType(errors: QuantumError[]): Map<QuantumErrorType, number> {
    return errors.reduce((acc, error) => {
      acc.set(error.type, (acc.get(error.type) || 0) + 1)
      return acc
    }, new Map<QuantumErrorType, number>())
  }

  private groupErrorsBySeverity(errors: QuantumError[]): Map<QuantumErrorSeverity, number> {
    return errors.reduce((acc, error) => {
      acc.set(error.severity, (acc.get(error.severity) || 0) + 1)
      return acc
    }, new Map<QuantumErrorSeverity, number>())
  }

  // Cleanup
  public dispose(): void {
    logger.info('QuantumErrorHandler', 'Disposing quantum error handler')
    
    this.errors.clear()
    this.recoveryStrategies.clear()
    this.activeRecoveries.clear()
    this.circuitBreakers.clear()
    this.removeAllListeners()
  }
}