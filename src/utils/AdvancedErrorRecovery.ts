import { EventEmitter } from 'eventemitter3'
import { logger } from './Logger'
import { ErrorHandler } from './ErrorHandler'

export interface RecoveryStrategy {
  id: string
  name: string
  applicableErrors: string[]
  priority: number
  maxRetries: number
  backoffStrategy: 'linear' | 'exponential' | 'constant'
  execute: (error: Error, context: any) => Promise<RecoveryResult>
}

export interface RecoveryResult {
  success: boolean
  message: string
  data?: any
  requiresRestart?: boolean
  requiresUserAction?: boolean
}

export interface CircuitBreakerConfig {
  failureThreshold: number
  recoveryTimeout: number
  monitoringPeriod: number
  halfOpenMaxCalls: number
}

export class AdvancedErrorRecovery extends EventEmitter {
  private strategies: Map<string, RecoveryStrategy> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()
  private errorHistory: Map<string, ErrorHistoryEntry[]> = new Map()
  private recoveryAttempts: Map<string, number> = new Map()
  private isActive = true

  constructor() {
    super()
    this.initializeDefaultStrategies()
    logger.info('AdvancedErrorRecovery initialized')
  }

  private initializeDefaultStrategies(): void {
    // WebGL Context Lost Recovery
    this.addStrategy({
      id: 'webgl_context_recovery',
      name: 'WebGL Context Recovery',
      applicableErrors: ['WebGL context lost', 'WebGL context creation failed'],
      priority: 1,
      maxRetries: 3,
      backoffStrategy: 'exponential',
      execute: async (error: Error, context: any): Promise<RecoveryResult> => {
        try {
          logger.info('Attempting WebGL context recovery')
          
          if (context?.renderer) {
            // Force context restoration
            context.renderer.forceContextRestore?.()
            
            // Wait for context restoration
            await new Promise(resolve => setTimeout(resolve, 1000))
            
            // Verify context
            const gl = context.renderer.getContext()
            if (gl && !gl.isContextLost()) {
              return {
                success: true,
                message: 'WebGL context successfully restored'
              }
            }
          }
          
          return {
            success: false,
            message: 'WebGL context recovery failed',
            requiresRestart: true
          }
        } catch (recoveryError) {
          logger.error('WebGL recovery error', recoveryError)
          return {
            success: false,
            message: 'WebGL recovery exception occurred',
            requiresRestart: true
          }
        }
      }
    })

    // Memory Pressure Recovery
    this.addStrategy({
      id: 'memory_pressure_recovery',
      name: 'Memory Pressure Recovery',
      applicableErrors: ['Out of memory', 'Memory limit exceeded'],
      priority: 2,
      maxRetries: 2,
      backoffStrategy: 'constant',
      execute: async (error: Error, context: any): Promise<RecoveryResult> => {
        try {
          logger.info('Attempting memory pressure recovery')
          
          // Force garbage collection if available
          if (typeof global !== 'undefined' && global.gc) {
            global.gc()
          }
          
          // Clear caches
          if (context?.cacheManager) {
            const clearedBytes = context.cacheManager.clearLowPriorityCache()
            logger.info('Cleared cache memory', { bytes: clearedBytes })
          }
          
          // Reduce quality settings
          if (context?.qualityManager) {
            context.qualityManager.reduceQuality()
            logger.info('Reduced rendering quality')
          }
          
          // Wait for memory to settle
          await new Promise(resolve => setTimeout(resolve, 2000))
          
          return {
            success: true,
            message: 'Memory pressure recovery completed'
          }
        } catch (recoveryError) {
          logger.error('Memory recovery error', recoveryError)
          return {
            success: false,
            message: 'Memory recovery failed',
            requiresRestart: true
          }
        }
      }
    })

    // Network Connection Recovery
    this.addStrategy({
      id: 'network_recovery',
      name: 'Network Connection Recovery',
      applicableErrors: ['Connection failed', 'WebSocket disconnected', 'Network timeout'],
      priority: 3,
      maxRetries: 5,
      backoffStrategy: 'exponential',
      execute: async (error: Error, context: any): Promise<RecoveryResult> => {
        try {
          logger.info('Attempting network recovery')
          
          if (context?.connector) {
            // Close existing connections
            context.connector.disconnect()
            
            // Wait before reconnecting
            const delay = Math.min(1000 * Math.pow(2, context.retryCount || 0), 30000)
            await new Promise(resolve => setTimeout(resolve, delay))
            
            // Attempt reconnection
            await context.connector.connect()
            
            return {
              success: true,
              message: 'Network connection recovered'
            }
          }
          
          return {
            success: false,
            message: 'Network connector not available'
          }
        } catch (recoveryError) {
          logger.error('Network recovery error', recoveryError)
          return {
            success: false,
            message: 'Network recovery failed'
          }
        }
      }
    })

    // Agent System Recovery
    this.addStrategy({
      id: 'agent_system_recovery',
      name: 'Agent System Recovery',
      applicableErrors: ['Agent creation failed', 'Agent system error'],
      priority: 4,
      maxRetries: 3,
      backoffStrategy: 'linear',
      execute: async (error: Error, context: any): Promise<RecoveryResult> => {
        try {
          logger.info('Attempting agent system recovery')
          
          if (context?.agentManager) {
            // Reset agent pools
            const resetCount = context.agentManager.resetAgentPools()
            
            // Clear corrupted agent data
            context.agentManager.clearCorruptedAgents()
            
            // Restart agent processing
            await context.agentManager.restart()
            
            return {
              success: true,
              message: `Agent system recovered, reset ${resetCount} pools`
            }
          }
          
          return {
            success: false,
            message: 'Agent manager not available'
          }
        } catch (recoveryError) {
          logger.error('Agent system recovery error', recoveryError)
          return {
            success: false,
            message: 'Agent system recovery failed'
          }
        }
      }
    })
  }

  public addStrategy(strategy: RecoveryStrategy): void {
    this.strategies.set(strategy.id, strategy)
    logger.info('Recovery strategy added', { id: strategy.id, name: strategy.name })
  }

  public async handleError(error: Error, context: any = {}): Promise<RecoveryResult> {
    if (!this.isActive) {
      return {
        success: false,
        message: 'Error recovery system is disabled'
      }
    }

    const errorKey = this.getErrorKey(error)
    
    // Check circuit breaker
    const circuitBreaker = this.getCircuitBreaker(errorKey)
    if (circuitBreaker.getState() === 'OPEN') {
      return {
        success: false,
        message: 'Circuit breaker is open, recovery temporarily disabled'
      }
    }

    // Record error
    this.recordError(error, context)
    
    // Find applicable strategies
    const applicableStrategies = this.findApplicableStrategies(error)
    
    if (applicableStrategies.length === 0) {
      logger.warn('No recovery strategies found for error', { error: error.message })
      return {
        success: false,
        message: 'No applicable recovery strategies'
      }
    }

    // Sort by priority
    applicableStrategies.sort((a, b) => a.priority - b.priority)

    // Attempt recovery with each strategy
    for (const strategy of applicableStrategies) {
      const attemptKey = `${errorKey}:${strategy.id}`
      const attemptCount = this.recoveryAttempts.get(attemptKey) || 0
      
      if (attemptCount >= strategy.maxRetries) {
        logger.warn('Max retries reached for strategy', { strategyId: strategy.id, attempts: attemptCount })
        continue
      }

      try {
        logger.info('Executing recovery strategy', { 
          strategyId: strategy.id, 
          attempt: attemptCount + 1,
          maxRetries: strategy.maxRetries
        })

        // Apply backoff strategy
        if (attemptCount > 0) {
          const delay = this.calculateBackoffDelay(strategy.backoffStrategy, attemptCount)
          await new Promise(resolve => setTimeout(resolve, delay))
        }

        // Execute strategy
        const result = await strategy.execute(error, context)
        
        // Update attempt count
        this.recoveryAttempts.set(attemptKey, attemptCount + 1)

        if (result.success) {
          logger.info('Recovery strategy succeeded', { 
            strategyId: strategy.id, 
            message: result.message 
          })
          
          // Reset circuit breaker on success
          circuitBreaker.onSuccess()
          
          // Reset attempt count on success
          this.recoveryAttempts.delete(attemptKey)
          
          this.emit('recoverySuccess', {
            error: error.message,
            strategy: strategy.name,
            result
          })
          
          return result
        } else {
          logger.warn('Recovery strategy failed', { 
            strategyId: strategy.id, 
            message: result.message 
          })
          
          // Record failure in circuit breaker
          circuitBreaker.onFailure()
        }
      } catch (strategyError) {
        logger.error('Recovery strategy threw error', {
          strategyId: strategy.id,
          error: strategyError
        })
        
        circuitBreaker.onFailure()
        this.recoveryAttempts.set(attemptKey, attemptCount + 1)
      }
    }

    this.emit('recoveryFailed', {
      error: error.message,
      triedStrategies: applicableStrategies.map(s => s.name)
    })

    return {
      success: false,
      message: 'All recovery strategies failed'
    }
  }

  private findApplicableStrategies(error: Error): RecoveryStrategy[] {
    const strategies: RecoveryStrategy[] = []
    
    for (const strategy of this.strategies.values()) {
      for (const applicableError of strategy.applicableErrors) {
        if (error.message.includes(applicableError) || error.name.includes(applicableError)) {
          strategies.push(strategy)
          break
        }
      }
    }
    
    return strategies
  }

  private calculateBackoffDelay(strategy: 'linear' | 'exponential' | 'constant', attempt: number): number {
    switch (strategy) {
      case 'linear':
        return 1000 * attempt
      case 'exponential':
        return Math.min(1000 * Math.pow(2, attempt), 30000)
      case 'constant':
        return 1000
      default:
        return 1000
    }
  }

  private getErrorKey(error: Error): string {
    return `${error.name}:${error.message.substring(0, 50)}`
  }

  private recordError(error: Error, context: any): void {
    const errorKey = this.getErrorKey(error)
    const history = this.errorHistory.get(errorKey) || []
    
    history.push({
      timestamp: Date.now(),
      error: error.message,
      stack: error.stack,
      context: JSON.stringify(context, null, 2).substring(0, 1000)
    })
    
    // Keep only last 50 errors per type
    if (history.length > 50) {
      history.splice(0, history.length - 50)
    }
    
    this.errorHistory.set(errorKey, history)
  }

  private getCircuitBreaker(errorKey: string): CircuitBreaker {
    if (!this.circuitBreakers.has(errorKey)) {
      this.circuitBreakers.set(errorKey, new CircuitBreaker({
        failureThreshold: 3,
        recoveryTimeout: 60000,
        monitoringPeriod: 300000,
        halfOpenMaxCalls: 1
      }))
    }
    
    return this.circuitBreakers.get(errorKey)!
  }

  public getErrorStatistics(): ErrorStatistics {
    const totalErrors = Array.from(this.errorHistory.values())
      .reduce((total, history) => total + history.length, 0)
    
    const recentErrors = Array.from(this.errorHistory.values())
      .reduce((total, history) => {
        const recent = history.filter(entry => Date.now() - entry.timestamp < 3600000) // Last hour
        return total + recent.length
      }, 0)
    
    const circuitBreakerStates: Record<string, string> = {}
    for (const [key, breaker] of this.circuitBreakers) {
      circuitBreakerStates[key] = breaker.getState()
    }
    
    return {
      totalErrors,
      recentErrors,
      errorTypes: this.errorHistory.size,
      activeStrategies: this.strategies.size,
      circuitBreakerStates
    }
  }

  public reset(): void {
    this.recoveryAttempts.clear()
    this.errorHistory.clear()
    this.circuitBreakers.clear()
    logger.info('AdvancedErrorRecovery reset')
  }

  public enable(): void {
    this.isActive = true
    logger.info('AdvancedErrorRecovery enabled')
  }

  public disable(): void {
    this.isActive = false
    logger.info('AdvancedErrorRecovery disabled')
  }

  public dispose(): void {
    this.disable()
    this.reset()
    this.strategies.clear()
    this.removeAllListeners()
    logger.info('AdvancedErrorRecovery disposed')
  }
}

// Circuit Breaker Implementation
class CircuitBreaker {
  private state: 'CLOSED' | 'OPEN' | 'HALF_OPEN' = 'CLOSED'
  private failures = 0
  private nextAttemptTime = 0
  private halfOpenCalls = 0

  constructor(private config: CircuitBreakerConfig) {}

  public onSuccess(): void {
    this.failures = 0
    this.halfOpenCalls = 0
    this.state = 'CLOSED'
  }

  public onFailure(): void {
    this.failures++
    
    if (this.state === 'HALF_OPEN' || this.failures >= this.config.failureThreshold) {
      this.state = 'OPEN'
      this.nextAttemptTime = Date.now() + this.config.recoveryTimeout
    }
  }

  public getState(): 'CLOSED' | 'OPEN' | 'HALF_OPEN' {
    if (this.state === 'OPEN' && Date.now() >= this.nextAttemptTime) {
      this.state = 'HALF_OPEN'
      this.halfOpenCalls = 0
    }
    
    return this.state
  }

  public canAttempt(): boolean {
    const state = this.getState()
    
    if (state === 'CLOSED') return true
    if (state === 'OPEN') return false
    if (state === 'HALF_OPEN') {
      return this.halfOpenCalls < this.config.halfOpenMaxCalls
    }
    
    return false
  }
}

// Type definitions
interface ErrorHistoryEntry {
  timestamp: number
  error: string
  stack?: string
  context: string
}

interface ErrorStatistics {
  totalErrors: number
  recentErrors: number
  errorTypes: number
  activeStrategies: number
  circuitBreakerStates: Record<string, string>
}