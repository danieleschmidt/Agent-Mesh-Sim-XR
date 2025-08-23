import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import { QuantumError, QuantumErrorHandler, QuantumErrorType, QuantumErrorSeverity } from './QuantumErrorHandler'

export interface QuantumSystemHealth {
  systemId: string
  overallHealth: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE'
  coherenceLevel: number
  entanglementStability: number
  interferenceNoise: number
  computationalLoad: number
  errorRate: number
  lastUpdate: number
  components: {
    superposition: QuantumComponentHealth
    interference: QuantumComponentHealth
    annealing: QuantumComponentHealth
    planner: QuantumComponentHealth
  }
}

export interface QuantumComponentHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'CRITICAL' | 'OFFLINE'
  performance: number // 0-100%
  errorCount: number
  lastError?: QuantumError
  uptime: number
  memoryUsage: number
  cpuUsage: number
}

export interface QuantumMetrics {
  timestamp: number
  systemId: string
  coherenceMetrics: {
    averageCoherence: number
    coherenceStability: number
    decoherenceRate: number
    quantumVolume: number
  }
  performanceMetrics: {
    planningTime: number
    convergenceRate: number
    optimizationGain: number
    throughput: number
  }
  errorMetrics: {
    totalErrors: number
    errorRate: number
    criticalErrors: number
    recoveryRate: number
  }
  resourceMetrics: {
    memoryUsage: number
    cpuUsage: number
    networkLatency: number
    storageUsage: number
  }
}

export interface QuantumAlert {
  id: string
  type: 'PERFORMANCE' | 'COHERENCE' | 'ERROR' | 'SECURITY' | 'RESOURCE'
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL'
  systemId: string
  component: string
  message: string
  details: Record<string, any>
  timestamp: number
  acknowledged: boolean
  resolved: boolean
  resolutionTime?: number
}

export interface QuantumThresholds {
  coherence: { warning: number; critical: number }
  errorRate: { warning: number; critical: number }
  performance: { warning: number; critical: number }
  memoryUsage: { warning: number; critical: number }
  cpuUsage: { warning: number; critical: number }
  interferenceNoise: { warning: number; critical: number }
}

export class QuantumMonitor extends EventEmitter {
  private monitoredSystems: Map<string, QuantumSystemHealth> = new Map()
  private metricsHistory: Map<string, QuantumMetrics[]> = new Map()
  private activeAlerts: Map<string, QuantumAlert> = new Map()
  private thresholds: QuantumThresholds
  private errorHandler: QuantumErrorHandler
  private monitoringActive: boolean = false
  private monitoringInterval: ReturnType<typeof setTimeout> | null = null
  private metricsRetentionPeriod: number = 24 * 60 * 60 * 1000 // 24 hours

  constructor(errorHandler: QuantumErrorHandler) {
    super()
    
    this.errorHandler = errorHandler
    this.thresholds = {
      coherence: { warning: 0.5, critical: 0.3 },
      errorRate: { warning: 0.1, critical: 0.25 },
      performance: { warning: 60, critical: 30 },
      memoryUsage: { warning: 70, critical: 90 },
      cpuUsage: { warning: 80, critical: 95 },
      interferenceNoise: { warning: 2.0, critical: 5.0 }
    }

    this.setupErrorHandlerIntegration()
  }

  // Start monitoring quantum systems
  public startMonitoring(intervalMs: number = 5000): void {
    if (this.monitoringActive) {
      logger.warn('QuantumMonitor', 'Monitoring already active')
      return
    }

    this.monitoringActive = true
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
      this.evaluateSystemHealth()
      this.checkThresholds()
      this.cleanupOldMetrics()
    }, intervalMs)

    logger.info('QuantumMonitor', 'Quantum monitoring started', { intervalMs })
    this.emit('monitoringStarted', { intervalMs })
  }

  // Stop monitoring
  public stopMonitoring(): void {
    if (!this.monitoringActive) return

    this.monitoringActive = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = null
    }

    logger.info('QuantumMonitor', 'Quantum monitoring stopped')
    this.emit('monitoringStopped')
  }

  // Register a quantum system for monitoring
  public registerQuantumSystem(systemId: string): void {
    if (this.monitoredSystems.has(systemId)) {
      logger.warn('QuantumMonitor', 'System already registered', { systemId })
      return
    }

    const health: QuantumSystemHealth = {
      systemId,
      overallHealth: 'HEALTHY',
      coherenceLevel: 1.0,
      entanglementStability: 1.0,
      interferenceNoise: 0.0,
      computationalLoad: 0.0,
      errorRate: 0.0,
      lastUpdate: Date.now(),
      components: {
        superposition: this.createInitialComponentHealth(),
        interference: this.createInitialComponentHealth(),
        annealing: this.createInitialComponentHealth(),
        planner: this.createInitialComponentHealth()
      }
    }

    this.monitoredSystems.set(systemId, health)
    this.metricsHistory.set(systemId, [])

    logger.info('QuantumMonitor', 'Quantum system registered for monitoring', { systemId })
    this.emit('systemRegistered', { systemId })
  }

  // Unregister a quantum system
  public unregisterQuantumSystem(systemId: string): void {
    if (!this.monitoredSystems.has(systemId)) return

    this.monitoredSystems.delete(systemId)
    this.metricsHistory.delete(systemId)

    // Remove associated alerts
    const systemAlerts = Array.from(this.activeAlerts.values())
      .filter(alert => alert.systemId === systemId)
    
    systemAlerts.forEach(alert => {
      this.activeAlerts.delete(alert.id)
    })

    logger.info('QuantumMonitor', 'Quantum system unregistered', { systemId })
    this.emit('systemUnregistered', { systemId })
  }

  // Update system metrics
  public updateSystemMetrics(systemId: string, metrics: Partial<QuantumMetrics>): void {
    const system = this.monitoredSystems.get(systemId)
    if (!system) {
      logger.warn('QuantumMonitor', 'Cannot update metrics for unregistered system', { systemId })
      return
    }

    // Update system health based on new metrics
    if (metrics.coherenceMetrics) {
      system.coherenceLevel = metrics.coherenceMetrics.averageCoherence
    }

    if (metrics.errorMetrics) {
      system.errorRate = metrics.errorMetrics.errorRate
    }

    if (metrics.performanceMetrics) {
      system.computationalLoad = 100 - metrics.performanceMetrics.throughput
    }

    system.lastUpdate = Date.now()

    // Store full metrics
    const fullMetrics: QuantumMetrics = {
      timestamp: Date.now(),
      systemId,
      coherenceMetrics: {
        averageCoherence: 0.8,
        coherenceStability: 0.9,
        decoherenceRate: 0.01,
        quantumVolume: 100,
        ...metrics.coherenceMetrics
      },
      performanceMetrics: {
        planningTime: 0,
        convergenceRate: 0.85,
        optimizationGain: 0.2,
        throughput: 80,
        ...metrics.performanceMetrics
      },
      errorMetrics: {
        totalErrors: 0,
        errorRate: 0.01,
        criticalErrors: 0,
        recoveryRate: 0.95,
        ...metrics.errorMetrics
      },
      resourceMetrics: {
        memoryUsage: 30,
        cpuUsage: 40,
        networkLatency: 50,
        storageUsage: 20,
        ...metrics.resourceMetrics
      }
    }

    let history = this.metricsHistory.get(systemId) || []
    history.push(fullMetrics)
    
    // Keep only recent metrics
    const cutoff = Date.now() - this.metricsRetentionPeriod
    history = history.filter(m => m.timestamp > cutoff)
    
    this.metricsHistory.set(systemId, history)

    this.emit('metricsUpdated', { systemId, metrics: fullMetrics })
  }

  // Report component error
  public reportComponentError(systemId: string, component: string, error: QuantumError): void {
    const system = this.monitoredSystems.get(systemId)
    if (!system) return

    const componentHealth = system.components[component as keyof typeof system.components]
    if (componentHealth) {
      componentHealth.errorCount++
      componentHealth.lastError = error

      // Update component status based on error severity
      switch (error.severity) {
        case QuantumErrorSeverity.CRITICAL:
          componentHealth.status = 'CRITICAL'
          break
        case QuantumErrorSeverity.HIGH:
          componentHealth.status = 'DEGRADED'
          break
        default:
          if (componentHealth.errorCount > 10) {
            componentHealth.status = 'DEGRADED'
          }
          break
      }

      this.evaluateSystemHealth()
      this.createAlert('ERROR', 'HIGH', systemId, component, `Component error: ${error.message}`, {
        errorId: error.id,
        errorType: error.type,
        severity: error.severity
      })
    }
  }

  // Get system health
  public getSystemHealth(systemId: string): QuantumSystemHealth | null {
    return this.monitoredSystems.get(systemId) || null
  }

  // Get all monitored systems
  public getAllSystemsHealth(): QuantumSystemHealth[] {
    return Array.from(this.monitoredSystems.values())
  }

  // Get system metrics history
  public getMetricsHistory(systemId: string, hours: number = 1): QuantumMetrics[] {
    const history = this.metricsHistory.get(systemId) || []
    const cutoff = Date.now() - (hours * 60 * 60 * 1000)
    
    return history.filter(metrics => metrics.timestamp > cutoff)
  }

  // Get active alerts
  public getActiveAlerts(systemId?: string): QuantumAlert[] {
    const alerts = Array.from(this.activeAlerts.values())
    
    if (systemId) {
      return alerts.filter(alert => alert.systemId === systemId)
    }
    
    return alerts.filter(alert => !alert.resolved)
  }

  // Acknowledge alert
  public acknowledgeAlert(alertId: string, userId: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    
    if (alert) {
      alert.acknowledged = true
      alert.details.acknowledgedBy = userId
      alert.details.acknowledgedAt = Date.now()
      
      this.emit('alertAcknowledged', alert)
      
      logger.info('QuantumMonitor', 'Alert acknowledged', {
        alertId,
        userId,
        type: alert.type,
        systemId: alert.systemId
      })
      
      return true
    }
    
    return false
  }

  // Resolve alert
  public resolveAlert(alertId: string, userId: string, resolution: string): boolean {
    const alert = this.activeAlerts.get(alertId)
    
    if (alert) {
      alert.resolved = true
      alert.resolutionTime = Date.now()
      alert.details.resolvedBy = userId
      alert.details.resolution = resolution
      
      this.emit('alertResolved', alert)
      
      logger.info('QuantumMonitor', 'Alert resolved', {
        alertId,
        userId,
        resolution,
        duration: alert.resolutionTime - alert.timestamp
      })
      
      return true
    }
    
    return false
  }

  // Get monitoring statistics
  public getMonitoringStats(): any {
    const systems = Array.from(this.monitoredSystems.values())
    const alerts = Array.from(this.activeAlerts.values())
    
    return {
      monitoringActive: this.monitoringActive,
      systemsCount: systems.length,
      healthySystems: systems.filter(s => s.overallHealth === 'HEALTHY').length,
      degradedSystems: systems.filter(s => s.overallHealth === 'DEGRADED').length,
      criticalSystems: systems.filter(s => s.overallHealth === 'CRITICAL').length,
      offlineSystems: systems.filter(s => s.overallHealth === 'OFFLINE').length,
      activeAlerts: alerts.filter(a => !a.resolved).length,
      criticalAlerts: alerts.filter(a => !a.resolved && a.severity === 'CRITICAL').length,
      averageCoherence: this.calculateAverageCoherence(),
      averageErrorRate: this.calculateAverageErrorRate()
    }
  }

  // Private implementation methods

  private collectMetrics(): void {
    this.monitoredSystems.forEach((system, systemId) => {
      // Simulate metric collection (in production, get real metrics)
      const metrics: Partial<QuantumMetrics> = {
        coherenceMetrics: {
          averageCoherence: Math.max(0, system.coherenceLevel + (Math.random() - 0.5) * 0.1),
          coherenceStability: 0.9 + Math.random() * 0.1,
          decoherenceRate: 0.01 + Math.random() * 0.01,
          quantumVolume: 80 + Math.random() * 40
        },
        performanceMetrics: {
          planningTime: 100 + Math.random() * 200,
          convergenceRate: 0.8 + Math.random() * 0.2,
          optimizationGain: Math.random() * 0.5,
          throughput: 70 + Math.random() * 30
        },
        errorMetrics: {
          totalErrors: system.components.planner.errorCount,
          errorRate: system.errorRate + (Math.random() - 0.5) * 0.02,
          criticalErrors: Math.floor(Math.random() * 3),
          recoveryRate: 0.9 + Math.random() * 0.1
        },
        resourceMetrics: {
          memoryUsage: 20 + Math.random() * 60,
          cpuUsage: 30 + Math.random() * 50,
          networkLatency: 10 + Math.random() * 100,
          storageUsage: 10 + Math.random() * 30
        }
      }

      this.updateSystemMetrics(systemId, metrics)
    })
  }

  private evaluateSystemHealth(): void {
    this.monitoredSystems.forEach((system, systemId) => {
      let healthScore = 100
      let componentIssues = 0

      // Evaluate component health
      Object.values(system.components).forEach(component => {
        switch (component.status) {
          case 'CRITICAL':
            healthScore -= 30
            componentIssues++
            break
          case 'DEGRADED':
            healthScore -= 15
            componentIssues++
            break
          case 'OFFLINE':
            healthScore -= 40
            componentIssues++
            break
        }
      })

      // Factor in coherence level
      if (system.coherenceLevel < this.thresholds.coherence.critical) {
        healthScore -= 25
      } else if (system.coherenceLevel < this.thresholds.coherence.warning) {
        healthScore -= 10
      }

      // Factor in error rate
      if (system.errorRate > this.thresholds.errorRate.critical) {
        healthScore -= 20
      } else if (system.errorRate > this.thresholds.errorRate.warning) {
        healthScore -= 10
      }

      // Determine overall health
      let overallHealth: QuantumSystemHealth['overallHealth']
      
      if (healthScore >= 80 && componentIssues === 0) {
        overallHealth = 'HEALTHY'
      } else if (healthScore >= 50) {
        overallHealth = 'DEGRADED'
      } else if (healthScore >= 20) {
        overallHealth = 'CRITICAL'
      } else {
        overallHealth = 'OFFLINE'
      }

      if (system.overallHealth !== overallHealth) {
        const previousHealth = system.overallHealth
        system.overallHealth = overallHealth

        this.emit('healthChanged', {
          systemId,
          previousHealth,
          currentHealth: overallHealth,
          healthScore
        })

        // Create alert for health degradation
        if (overallHealth === 'CRITICAL' || overallHealth === 'OFFLINE') {
          this.createAlert('PERFORMANCE', 'CRITICAL', systemId, 'system', 
            `System health degraded to ${overallHealth}`, {
              previousHealth,
              healthScore,
              componentIssues
            })
        }
      }
    })
  }

  private checkThresholds(): void {
    this.monitoredSystems.forEach((system, systemId) => {
      const latestMetrics = this.getLatestMetrics(systemId)
      if (!latestMetrics) return

      // Check coherence thresholds
      if (system.coherenceLevel < this.thresholds.coherence.critical) {
        this.createAlert('COHERENCE', 'CRITICAL', systemId, 'superposition',
          'Critical coherence loss detected', {
            currentCoherence: system.coherenceLevel,
            threshold: this.thresholds.coherence.critical
          })
      } else if (system.coherenceLevel < this.thresholds.coherence.warning) {
        this.createAlert('COHERENCE', 'MEDIUM', systemId, 'superposition',
          'Low coherence detected', {
            currentCoherence: system.coherenceLevel,
            threshold: this.thresholds.coherence.warning
          })
      }

      // Check resource thresholds
      if (latestMetrics.resourceMetrics.memoryUsage > this.thresholds.memoryUsage.critical) {
        this.createAlert('RESOURCE', 'HIGH', systemId, 'system',
          'Critical memory usage', {
            currentUsage: latestMetrics.resourceMetrics.memoryUsage,
            threshold: this.thresholds.memoryUsage.critical
          })
      }

      if (latestMetrics.resourceMetrics.cpuUsage > this.thresholds.cpuUsage.critical) {
        this.createAlert('RESOURCE', 'HIGH', systemId, 'system',
          'Critical CPU usage', {
            currentUsage: latestMetrics.resourceMetrics.cpuUsage,
            threshold: this.thresholds.cpuUsage.critical
          })
      }
    })
  }

  private createAlert(
    type: QuantumAlert['type'],
    severity: QuantumAlert['severity'],
    systemId: string,
    component: string,
    message: string,
    details: Record<string, any>
  ): void {
    // Check if similar alert already exists
    const existingAlert = Array.from(this.activeAlerts.values()).find(alert =>
      alert.systemId === systemId &&
      alert.component === component &&
      alert.type === type &&
      !alert.resolved &&
      Date.now() - alert.timestamp < 300000 // 5 minutes
    )

    if (existingAlert) {
      // Update existing alert details
      existingAlert.details = { ...existingAlert.details, ...details }
      existingAlert.timestamp = Date.now()
      return
    }

    const alert: QuantumAlert = {
      id: this.generateAlertId(),
      type,
      severity,
      systemId,
      component,
      message,
      details,
      timestamp: Date.now(),
      acknowledged: false,
      resolved: false
    }

    this.activeAlerts.set(alert.id, alert)

    this.emit('alertCreated', alert)

    logger.warn('QuantumMonitor', `Quantum alert: ${message}`, {
      alertId: alert.id,
      type,
      severity,
      systemId,
      component
    })
  }

  private setupErrorHandlerIntegration(): void {
    this.errorHandler.on('quantumError', (error: QuantumError) => {
      if (error.context.systemId) {
        this.reportComponentError(
          error.context.systemId,
          error.context.component,
          error
        )
      }
    })

    this.errorHandler.on('criticalQuantumError', (error: QuantumError) => {
      if (error.context.systemId) {
        this.createAlert('ERROR', 'CRITICAL', error.context.systemId, error.context.component,
          `Critical quantum error: ${error.message}`, {
            errorId: error.id,
            errorType: error.type
          })
      }
    })
  }

  private createInitialComponentHealth(): QuantumComponentHealth {
    return {
      status: 'HEALTHY',
      performance: 100,
      errorCount: 0,
      uptime: Date.now(),
      memoryUsage: 0,
      cpuUsage: 0
    }
  }

  private getLatestMetrics(systemId: string): QuantumMetrics | null {
    const history = this.metricsHistory.get(systemId)
    return history && history.length > 0 ? history[history.length - 1] : null
  }

  private cleanupOldMetrics(): void {
    const cutoff = Date.now() - this.metricsRetentionPeriod
    
    this.metricsHistory.forEach((history, systemId) => {
      const filteredHistory = history.filter(metrics => metrics.timestamp > cutoff)
      this.metricsHistory.set(systemId, filteredHistory)
    })

    // Clean up resolved alerts older than 24 hours
    const alertCutoff = Date.now() - (24 * 60 * 60 * 1000)
    const expiredAlerts: string[] = []
    
    this.activeAlerts.forEach((alert, alertId) => {
      if (alert.resolved && alert.timestamp < alertCutoff) {
        expiredAlerts.push(alertId)
      }
    })

    expiredAlerts.forEach(alertId => {
      this.activeAlerts.delete(alertId)
    })
  }

  private calculateAverageCoherence(): number {
    const systems = Array.from(this.monitoredSystems.values())
    if (systems.length === 0) return 0
    
    const totalCoherence = systems.reduce((sum, system) => sum + system.coherenceLevel, 0)
    return totalCoherence / systems.length
  }

  private calculateAverageErrorRate(): number {
    const systems = Array.from(this.monitoredSystems.values())
    if (systems.length === 0) return 0
    
    const totalErrorRate = systems.reduce((sum, system) => sum + system.errorRate, 0)
    return totalErrorRate / systems.length
  }

  private generateAlertId(): string {
    return `qalert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  // Configuration methods
  public updateThresholds(thresholds: Partial<QuantumThresholds>): void {
    this.thresholds = { ...this.thresholds, ...thresholds }
    
    logger.info('QuantumMonitor', 'Monitoring thresholds updated', { thresholds })
    this.emit('thresholdsUpdated', this.thresholds)
  }

  public getThresholds(): QuantumThresholds {
    return { ...this.thresholds }
  }

  // Cleanup
  public dispose(): void {
    logger.info('QuantumMonitor', 'Disposing quantum monitor')
    
    this.stopMonitoring()
    this.monitoredSystems.clear()
    this.metricsHistory.clear()
    this.activeAlerts.clear()
    this.removeAllListeners()
  }
}