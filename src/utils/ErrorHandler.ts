import { EventEmitter } from 'eventemitter3'
import { logger } from './Logger'

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  module: string
  function?: string
  userId?: string
  sessionId?: string
  timestamp: number
  stackTrace?: string
  additionalData?: Record<string, any>
  severity?: 'low' | 'medium' | 'high' | 'critical'
  cycle?: number
  adaptation_id?: string
  algorithm?: string
  target?: string
}

export interface ErrorReport {
  id: string
  error: Error
  severity: ErrorSeverity
  context: ErrorContext
  handled: boolean
  retryCount: number
  timestamp: number
}

export class ErrorHandler extends EventEmitter {
  private static instance: ErrorHandler
  private errorReports: Map<string, ErrorReport> = new Map()
  private retryStrategies: Map<string, (error: Error, context: ErrorContext) => Promise<boolean>> = new Map()
  private circuitBreakers: Map<string, CircuitBreaker> = new Map()

  private constructor() {
    super()
    this.setupGlobalErrorHandling()
  }

  static getInstance(): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler()
    }
    return ErrorHandler.instance
  }

  private setupGlobalErrorHandling(): void {
    // Handle unhandled promise rejections
    if (typeof window !== 'undefined') {
      window.addEventListener('unhandledrejection', (event) => {
        this.handleError(
          new Error(`Unhandled Promise Rejection: ${event.reason}`),
          ErrorSeverity.HIGH,
          { module: 'global', function: 'unhandledrejection', timestamp: Date.now() }
        )
      })

      // Handle general errors
      window.addEventListener('error', (event) => {
        this.handleError(
          new Error(event.message),
          ErrorSeverity.MEDIUM,
          { 
            module: 'global', 
            function: event.filename || 'unknown',
            timestamp: Date.now(),
            additionalData: {
              line: event.lineno,
              column: event.colno
            }
          }
        )
      })
    }
  }

  handleError(
    error: Error,
    severity: ErrorSeverity,
    context: ErrorContext,
    options: {
      retry?: boolean
      reportToUser?: boolean
      autoRecover?: boolean
    } = {}
  ): string {
    const errorId = this.generateErrorId()
    
    const report: ErrorReport = {
      id: errorId,
      error,
      severity,
      context: {
        ...context,
        stackTrace: error.stack
      },
      handled: false,
      retryCount: 0,
      timestamp: Date.now()
    }

    this.errorReports.set(errorId, report)

    // Log error
    logger.error(context.module, error.message, error, {
      errorId,
      severity,
      context
    })

    // Emit error event
    this.emit('error', report)

    // Handle based on severity
    switch (severity) {
      case ErrorSeverity.CRITICAL:
        this.handleCriticalError(report)
        break
      case ErrorSeverity.HIGH:
        this.handleHighSeverityError(report)
        break
      case ErrorSeverity.MEDIUM:
        this.handleMediumSeverityError(report)
        break
      case ErrorSeverity.LOW:
        this.handleLowSeverityError(report)
        break
    }

    // Auto retry if configured
    if (options.retry && this.canRetry(report)) {
      this.scheduleRetry(report)
    }

    // Auto recovery attempt
    if (options.autoRecover) {
      this.attemptRecovery(report)
    }

    // Report to user if needed
    if (options.reportToUser) {
      this.reportToUser(report)
    }

    return errorId
  }

  private handleCriticalError(report: ErrorReport): void {
    // Critical errors should halt operation
    logger.error('ErrorHandler', 'CRITICAL ERROR - System may be unstable', report.error, report)
    
    // Notify all listeners
    this.emit('criticalError', report)
    
    // Consider circuit breaker activation
    this.activateCircuitBreaker(report.context.module)
  }

  private handleHighSeverityError(report: ErrorReport): void {
    logger.error('ErrorHandler', 'HIGH SEVERITY ERROR', report.error, report)
    this.emit('highSeverityError', report)
  }

  private handleMediumSeverityError(report: ErrorReport): void {
    logger.warn('ErrorHandler', 'MEDIUM SEVERITY ERROR', report)
    this.emit('mediumSeverityError', report)
  }

  private handleLowSeverityError(report: ErrorReport): void {
    logger.info('ErrorHandler', 'LOW SEVERITY ERROR', report)
    this.emit('lowSeverityError', report)
  }

  registerRetryStrategy(
    errorType: string,
    strategy: (error: Error, context: ErrorContext) => Promise<boolean>
  ): void {
    this.retryStrategies.set(errorType, strategy)
  }

  private canRetry(report: ErrorReport): boolean {
    return report.retryCount < 3 && 
           report.severity !== ErrorSeverity.CRITICAL &&
           !this.isCircuitBreakerOpen(report.context.module)
  }

  private async scheduleRetry(report: ErrorReport): Promise<void> {
    const delay = Math.pow(2, report.retryCount) * 1000 // Exponential backoff
    
    setTimeout(async () => {
      report.retryCount++
      
      const strategy = this.retryStrategies.get(report.error.constructor.name)
      if (strategy) {
        try {
          const success = await strategy(report.error, report.context)
          if (success) {
            report.handled = true
            logger.info('ErrorHandler', `Error ${report.id} resolved after ${report.retryCount} retries`)
            this.emit('errorResolved', report)
          } else if (this.canRetry(report)) {
            this.scheduleRetry(report)
          }
        } catch (retryError) {
          logger.error('ErrorHandler', 'Retry strategy failed', retryError as Error, { originalReport: report })
        }
      }
    }, delay)
  }

  private async attemptRecovery(report: ErrorReport): Promise<void> {
    try {
      // Module-specific recovery strategies
      switch (report.context.module) {
        case 'AgentMeshConnector':
          await this.recoverNetworkConnection(report)
          break
        case 'XRManager':
          await this.recoverXRSession(report)
          break
        case 'SwarmVisualizer':
          await this.recoverVisualization(report)
          break
        default:
          logger.debug('ErrorHandler', `No recovery strategy for module: ${report.context.module}`)
      }
    } catch (recoveryError) {
      logger.error('ErrorHandler', 'Recovery attempt failed', recoveryError as Error, { originalReport: report })
    }
  }

  private async recoverNetworkConnection(report: ErrorReport): Promise<void> {
    logger.info('ErrorHandler', 'Attempting network connection recovery')
    // Implementation would depend on the specific connector
    this.emit('recoveryAttempt', { type: 'network', report })
  }

  private async recoverXRSession(report: ErrorReport): Promise<void> {
    logger.info('ErrorHandler', 'Attempting XR session recovery')
    // Implementation would depend on the XR manager
    this.emit('recoveryAttempt', { type: 'xr', report })
  }

  private async recoverVisualization(report: ErrorReport): Promise<void> {
    logger.info('ErrorHandler', 'Attempting visualization recovery')
    // Implementation would depend on the visualizer
    this.emit('recoveryAttempt', { type: 'visualization', report })
  }

  private reportToUser(report: ErrorReport): void {
    const userMessage = this.generateUserFriendlyMessage(report)
    this.emit('userNotification', {
      type: 'error',
      severity: report.severity,
      message: userMessage,
      errorId: report.id
    })
  }

  private generateUserFriendlyMessage(report: ErrorReport): string {
    switch (report.severity) {
      case ErrorSeverity.CRITICAL:
        return 'A critical error occurred. The application may not function properly. Please restart.'
      case ErrorSeverity.HIGH:
        return 'An important feature is not working correctly. We\'re trying to fix it automatically.'
      case ErrorSeverity.MEDIUM:
        return 'A minor issue was detected. The application should continue to work normally.'
      case ErrorSeverity.LOW:
        return 'A small issue was logged for debugging purposes.'
      default:
        return 'An error occurred.'
    }
  }

  private activateCircuitBreaker(module: string): void {
    if (!this.circuitBreakers.has(module)) {
      this.circuitBreakers.set(module, new CircuitBreaker())
    }
    
    const breaker = this.circuitBreakers.get(module)!
    breaker.open()
    
    logger.warn('ErrorHandler', `Circuit breaker activated for module: ${module}`)
  }

  private isCircuitBreakerOpen(module: string): boolean {
    const breaker = this.circuitBreakers.get(module)
    return breaker ? breaker.isOpenNow() : false
  }

  private generateErrorId(): string {
    return `err_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  getErrorReport(errorId: string): ErrorReport | undefined {
    return this.errorReports.get(errorId)
  }

  getErrorReports(filter?: {
    severity?: ErrorSeverity
    module?: string
    handled?: boolean
    since?: number
  }): ErrorReport[] {
    let reports = Array.from(this.errorReports.values())

    if (filter) {
      if (filter.severity) {
        reports = reports.filter(r => r.severity === filter.severity)
      }
      if (filter.module) {
        reports = reports.filter(r => r.context.module === filter.module)
      }
      if (filter.handled !== undefined) {
        reports = reports.filter(r => r.handled === filter.handled)
      }
      if (filter.since) {
        reports = reports.filter(r => r.timestamp >= filter.since!)
      }
    }

    return reports.sort((a, b) => b.timestamp - a.timestamp)
  }

  clearErrorReports(): void {
    this.errorReports.clear()
    logger.info('ErrorHandler', 'Error reports cleared')
  }

  exportErrorReports(): string {
    const reports = Array.from(this.errorReports.values())
    return JSON.stringify(reports, null, 2)
  }
}

class CircuitBreaker {
  private isOpen = false
  private timeout = 60000 // 1 minute

  open(): void {
    this.isOpen = true
    
    // Auto-close after timeout
    setTimeout(() => {
      this.close()
    }, this.timeout)
  }

  close(): void {
    this.isOpen = false
  }

  isOpenNow(): boolean {
    return this.isOpen
  }
}

export const errorHandler = ErrorHandler.getInstance()