import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import type { Agent } from '../types'

export interface MetricConfig {
  id: string
  name: string
  description: string
  unit: string
  type: 'counter' | 'gauge' | 'histogram' | 'summary'
  tags?: Record<string, string>
  thresholds?: {
    warning?: number
    critical?: number
    info?: number
  }
}

export interface AlertRule {
  id: string
  name: string
  description: string
  metricId: string
  condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'change_rate'
  threshold: number
  duration: number // milliseconds
  severity: 'low' | 'medium' | 'high' | 'critical'
  enabled: boolean
  actions: AlertAction[]
}

export interface AlertAction {
  type: 'log' | 'email' | 'webhook' | 'slack' | 'auto_recovery'
  config: Record<string, any>
}

export interface Alert {
  id: string
  ruleId: string
  ruleName: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  message: string
  timestamp: number
  value: number
  threshold: number
  status: 'active' | 'resolved' | 'acknowledged'
  tags: Record<string, string>
}

export class AdvancedMonitoring extends EventEmitter {
  private metrics: Map<string, Metric> = new Map()
  private metricConfigs: Map<string, MetricConfig> = new Map()
  private alertRules: Map<string, AlertRule> = new Map()
  private activeAlerts: Map<string, Alert> = new Map()
  private alertHistory: Alert[] = []
  private collectionInterval: number
  private alertEvaluationInterval: number
  private isRunning = false

  constructor(config?: { collectionInterval?: number; alertEvaluationInterval?: number }) {
    super()
    this.collectionInterval = config?.collectionInterval || 1000 // 1 second
    this.alertEvaluationInterval = config?.alertEvaluationInterval || 5000 // 5 seconds
    this.initializeDefaultMetrics()
    logger.info('AdvancedMonitoring initialized')
  }

  private initializeDefaultMetrics(): void {
    // System Performance Metrics
    this.defineMetric({
      id: 'system_cpu_usage',
      name: 'CPU Usage',
      description: 'Current CPU usage percentage',
      unit: 'percent',
      type: 'gauge',
      thresholds: {
        warning: 70,
        critical: 90
      }
    })

    this.defineMetric({
      id: 'system_memory_usage',
      name: 'Memory Usage',
      description: 'Current memory usage in MB',
      unit: 'megabytes',
      type: 'gauge',
      thresholds: {
        warning: 1000,
        critical: 1500
      }
    })

    this.defineMetric({
      id: 'system_render_fps',
      name: 'Render FPS',
      description: 'Current rendering frames per second',
      unit: 'fps',
      type: 'gauge',
      thresholds: {
        warning: 30,
        critical: 15
      }
    })

    // Agent Metrics
    this.defineMetric({
      id: 'agents_total',
      name: 'Total Agents',
      description: 'Total number of active agents',
      unit: 'count',
      type: 'gauge',
      thresholds: {
        warning: 5000,
        critical: 8000
      }
    })

    this.defineMetric({
      id: 'agents_created_rate',
      name: 'Agent Creation Rate',
      description: 'Rate of agent creation per second',
      unit: 'per_second',
      type: 'counter',
      thresholds: {
        warning: 100,
        critical: 500
      }
    })

    this.defineMetric({
      id: 'agents_failed',
      name: 'Failed Agents',
      description: 'Number of agents in failed state',
      unit: 'count',
      type: 'gauge',
      thresholds: {
        warning: 10,
        critical: 50
      }
    })

    // Network Metrics
    this.defineMetric({
      id: 'network_latency',
      name: 'Network Latency',
      description: 'Average network latency in milliseconds',
      unit: 'milliseconds',
      type: 'gauge',
      thresholds: {
        warning: 100,
        critical: 250
      }
    })

    this.defineMetric({
      id: 'network_messages_rate',
      name: 'Message Rate',
      description: 'Network messages per second',
      unit: 'per_second',
      type: 'counter'
    })

    this.defineMetric({
      id: 'network_errors',
      name: 'Network Errors',
      description: 'Network error count',
      unit: 'count',
      type: 'counter',
      thresholds: {
        warning: 5,
        critical: 20
      }
    })

    // WebXR Metrics
    this.defineMetric({
      id: 'xr_session_active',
      name: 'XR Session Active',
      description: 'Whether XR session is currently active',
      unit: 'boolean',
      type: 'gauge'
    })

    this.defineMetric({
      id: 'xr_tracking_quality',
      name: 'XR Tracking Quality',
      description: 'Quality of XR tracking (0-1)',
      unit: 'ratio',
      type: 'gauge',
      thresholds: {
        warning: 0.7,
        critical: 0.5
      }
    })

    // Security Metrics
    this.defineMetric({
      id: 'security_threats_detected',
      name: 'Security Threats',
      description: 'Number of security threats detected',
      unit: 'count',
      type: 'counter',
      thresholds: {
        warning: 1,
        critical: 5
      }
    })

    this.defineMetric({
      id: 'security_failed_authentications',
      name: 'Failed Authentications',
      description: 'Number of failed authentication attempts',
      unit: 'count',
      type: 'counter',
      thresholds: {
        warning: 10,
        critical: 50
      }
    })
  }

  public defineMetric(config: MetricConfig): void {
    this.metricConfigs.set(config.id, config)
    
    if (!this.metrics.has(config.id)) {
      this.metrics.set(config.id, new Metric(config))
    }
    
    logger.info('Metric defined', { id: config.id, name: config.name })
  }

  public recordMetric(id: string, value: number, tags?: Record<string, string>): void {
    const metric = this.metrics.get(id)
    if (!metric) {
      logger.warn('Metric not found', { id })
      return
    }

    metric.record(value, tags)
    this.emit('metricRecorded', { id, value, tags, timestamp: Date.now() })
  }

  public incrementCounter(id: string, amount: number = 1, tags?: Record<string, string>): void {
    this.recordMetric(id, amount, tags)
  }

  public setGauge(id: string, value: number, tags?: Record<string, string>): void {
    this.recordMetric(id, value, tags)
  }

  public getMetric(id: string): MetricSnapshot | null {
    const metric = this.metrics.get(id)
    return metric ? metric.getSnapshot() : null
  }

  public getAllMetrics(): Record<string, MetricSnapshot> {
    const snapshot: Record<string, MetricSnapshot> = {}
    
    for (const [id, metric] of this.metrics) {
      snapshot[id] = metric.getSnapshot()
    }
    
    return snapshot
  }

  public addAlertRule(rule: AlertRule): void {
    this.alertRules.set(rule.id, rule)
    logger.info('Alert rule added', { id: rule.id, name: rule.name })
  }

  public removeAlertRule(id: string): void {
    this.alertRules.delete(id)
    logger.info('Alert rule removed', { id })
  }

  public enableAlertRule(id: string): void {
    const rule = this.alertRules.get(id)
    if (rule) {
      rule.enabled = true
      logger.info('Alert rule enabled', { id })
    }
  }

  public disableAlertRule(id: string): void {
    const rule = this.alertRules.get(id)
    if (rule) {
      rule.enabled = false
      logger.info('Alert rule disabled', { id })
    }
  }

  private evaluateAlerts(): void {
    const now = Date.now()
    
    for (const [ruleId, rule] of this.alertRules) {
      if (!rule.enabled) continue
      
      const metric = this.getMetric(rule.metricId)
      if (!metric) continue
      
      const shouldAlert = this.evaluateCondition(rule, metric.currentValue)
      const existingAlert = this.activeAlerts.get(ruleId)
      
      if (shouldAlert && !existingAlert) {
        // Create new alert
        const alert: Alert = {
          id: `alert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          ruleId,
          ruleName: rule.name,
          severity: rule.severity,
          message: this.generateAlertMessage(rule, metric.currentValue),
          timestamp: now,
          value: metric.currentValue,
          threshold: rule.threshold,
          status: 'active',
          tags: metric.tags || {}
        }
        
        this.activeAlerts.set(ruleId, alert)
        this.alertHistory.push(alert)
        this.executeAlertActions(rule, alert)
        this.emit('alertTriggered', alert)
        
        logger.warn('Alert triggered', {
          ruleId,
          ruleName: rule.name,
          severity: rule.severity,
          value: metric.currentValue,
          threshold: rule.threshold
        })
        
      } else if (!shouldAlert && existingAlert && existingAlert.status === 'active') {
        // Resolve existing alert
        existingAlert.status = 'resolved'
        this.activeAlerts.delete(ruleId)
        this.emit('alertResolved', existingAlert)
        
        logger.info('Alert resolved', {
          ruleId,
          alertId: existingAlert.id
        })
      }
    }
  }

  private evaluateCondition(rule: AlertRule, value: number): boolean {
    switch (rule.condition) {
      case 'greater_than':
        return value > rule.threshold
      case 'less_than':
        return value < rule.threshold
      case 'equals':
        return value === rule.threshold
      case 'not_equals':
        return value !== rule.threshold
      case 'change_rate':
        // TODO: Implement change rate evaluation
        return false
      default:
        return false
    }
  }

  private generateAlertMessage(rule: AlertRule, value: number): string {
    return `${rule.name}: ${rule.description} (Value: ${value}, Threshold: ${rule.threshold})`
  }

  private executeAlertActions(rule: AlertRule, alert: Alert): void {
    for (const action of rule.actions) {
      try {
        this.executeAction(action, alert)
      } catch (error) {
        logger.error('Alert action failed', { 
          actionType: action.type, 
          alertId: alert.id, 
          error 
        })
      }
    }
  }

  private executeAction(action: AlertAction, alert: Alert): void {
    switch (action.type) {
      case 'log':
        logger.warn(`ALERT: ${alert.message}`, { 
          alertId: alert.id, 
          severity: alert.severity 
        })
        break
        
      case 'webhook':
        if (action.config.url) {
          // TODO: Implement webhook call
          logger.info('Webhook alert action', { url: action.config.url, alert: alert.id })
        }
        break
        
      case 'auto_recovery':
        this.emit('autoRecoveryRequested', { 
          alert, 
          recoveryType: action.config.recoveryType 
        })
        break
        
      default:
        logger.warn('Unknown alert action type', { type: action.type })
    }
  }

  public acknowledgeAlert(alertId: string): void {
    for (const alert of this.activeAlerts.values()) {
      if (alert.id === alertId) {
        alert.status = 'acknowledged'
        this.emit('alertAcknowledged', alert)
        logger.info('Alert acknowledged', { alertId })
        return
      }
    }
  }

  public getActiveAlerts(): Alert[] {
    return Array.from(this.activeAlerts.values())
  }

  public getAlertHistory(limit: number = 100): Alert[] {
    return this.alertHistory.slice(-limit)
  }

  public collectSystemMetrics(): void {
    // CPU usage (mocked for now)
    const cpuUsage = this.getCpuUsage()
    this.setGauge('system_cpu_usage', cpuUsage)

    // Memory usage
    const memoryUsage = this.getMemoryUsage()
    this.setGauge('system_memory_usage', memoryUsage)

    // Additional system metrics would be collected here
  }

  public collectAgentMetrics(agents: Agent[]): void {
    this.setGauge('agents_total', agents.length)
    
    const failedAgents = agents.filter(agent => agent.state === 'failed').length
    this.setGauge('agents_failed', failedAgents)
  }

  public collectNetworkMetrics(latency: number, messageRate: number, errors: number): void {
    this.setGauge('network_latency', latency)
    this.recordMetric('network_messages_rate', messageRate)
    this.incrementCounter('network_errors', errors)
  }

  public collectXRMetrics(sessionActive: boolean, trackingQuality: number): void {
    this.setGauge('xr_session_active', sessionActive ? 1 : 0)
    this.setGauge('xr_tracking_quality', trackingQuality)
  }

  private getCpuUsage(): number {
    // Mock CPU usage - in real implementation, this would use system APIs
    return Math.random() * 100
  }

  private getMemoryUsage(): number {
    // Memory usage in MB
    if (typeof process !== 'undefined' && process.memoryUsage) {
      return process.memoryUsage().heapUsed / (1024 * 1024)
    }
    return Math.random() * 1000
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('AdvancedMonitoring already running')
      return
    }

    this.isRunning = true

    // Start metric collection
    setInterval(() => {
      this.collectSystemMetrics()
    }, this.collectionInterval)

    // Start alert evaluation
    setInterval(() => {
      this.evaluateAlerts()
    }, this.alertEvaluationInterval)

    logger.info('AdvancedMonitoring started')
    this.emit('started')
  }

  public stop(): void {
    this.isRunning = false
    logger.info('AdvancedMonitoring stopped')
    this.emit('stopped')
  }

  public getHealth(): HealthStatus {
    const activeAlerts = this.getActiveAlerts()
    const criticalAlerts = activeAlerts.filter(a => a.severity === 'critical')
    const highAlerts = activeAlerts.filter(a => a.severity === 'high')
    
    let status: 'healthy' | 'warning' | 'critical'
    
    if (criticalAlerts.length > 0) {
      status = 'critical'
    } else if (highAlerts.length > 0 || activeAlerts.length > 10) {
      status = 'warning'
    } else {
      status = 'healthy'
    }

    return {
      status,
      totalMetrics: this.metrics.size,
      activeAlerts: activeAlerts.length,
      criticalAlerts: criticalAlerts.length,
      isRunning: this.isRunning,
      uptime: Date.now() - (this.startTime || Date.now())
    }
  }

  private startTime = Date.now()

  public dispose(): void {
    this.stop()
    this.metrics.clear()
    this.metricConfigs.clear()
    this.alertRules.clear()
    this.activeAlerts.clear()
    this.alertHistory.splice(0)
    this.removeAllListeners()
    logger.info('AdvancedMonitoring disposed')
  }
}

// Metric class for storing and managing individual metrics
class Metric {
  private values: Array<{ value: number; timestamp: number; tags?: Record<string, string> }> = []
  private maxSamples = 1000
  
  constructor(private config: MetricConfig) {}

  public record(value: number, tags?: Record<string, string>): void {
    this.values.push({
      value,
      timestamp: Date.now(),
      tags
    })

    // Keep only the last N samples
    if (this.values.length > this.maxSamples) {
      this.values = this.values.slice(-this.maxSamples)
    }
  }

  public getSnapshot(): MetricSnapshot {
    const recent = this.values.slice(-100) // Last 100 samples
    const values = recent.map(v => v.value)
    
    return {
      config: this.config,
      currentValue: values[values.length - 1] || 0,
      sampleCount: this.values.length,
      min: Math.min(...values),
      max: Math.max(...values),
      average: values.reduce((a, b) => a + b, 0) / values.length || 0,
      lastUpdated: recent[recent.length - 1]?.timestamp || 0,
      tags: recent[recent.length - 1]?.tags
    }
  }
}

// Type definitions
interface MetricSnapshot {
  config: MetricConfig
  currentValue: number
  sampleCount: number
  min: number
  max: number
  average: number
  lastUpdated: number
  tags?: Record<string, string>
}

interface HealthStatus {
  status: 'healthy' | 'warning' | 'critical'
  totalMetrics: number
  activeAlerts: number
  criticalAlerts: number
  isRunning: boolean
  uptime: number
}