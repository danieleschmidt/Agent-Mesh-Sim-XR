import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

export interface PerformanceMetrics {
  fps: number
  renderTime: number
  updateTime: number
  memoryUsage: number
  agentCount: number
  triangleCount: number
  drawCalls: number
  cpuUsage: number
  gpuUsage?: number
  networkLatency?: number
  timestamp: number
}

export interface PerformanceThresholds {
  minFPS: number
  maxRenderTime: number
  maxMemoryUsage: number
  maxCPUUsage: number
}

export interface PerformanceBudget {
  targetFPS: number
  maxAgents: number
  maxTriangles: number
  maxDrawCalls: number
}

export class PerformanceMonitor extends EventEmitter {
  private metrics: PerformanceMetrics[] = []
  private currentMetrics: Partial<PerformanceMetrics> = {}
  private thresholds: PerformanceThresholds
  private budget: PerformanceBudget
  private monitoringInterval?: ReturnType<typeof setInterval>
  private isMonitoring = false
  private lastFrameTime = 0
  private frameCount = 0
  private maxHistorySize = 1000

  // Performance observers
  private performanceObserver?: PerformanceObserver
  private memoryCheckInterval?: ReturnType<typeof setInterval>

  constructor(
    thresholds: PerformanceThresholds = {
      minFPS: 30,
      maxRenderTime: 33, // ~30fps
      maxMemoryUsage: 500, // MB
      maxCPUUsage: 80 // %
    },
    budget: PerformanceBudget = {
      targetFPS: 60,
      maxAgents: 1000,
      maxTriangles: 100000,
      maxDrawCalls: 100
    }
  ) {
    super()
    this.thresholds = thresholds
    this.budget = budget
    
    this.setupPerformanceObserver()
  }

  startMonitoring(intervalMs = 1000): void {
    if (this.isMonitoring) return

    this.isMonitoring = true
    this.lastFrameTime = performance.now()
    
    this.monitoringInterval = setInterval(() => {
      this.collectMetrics()
    }, intervalMs)

    this.memoryCheckInterval = setInterval(() => {
      this.checkMemoryUsage()
    }, 5000)

    logger.info('PerformanceMonitor', 'Performance monitoring started')
  }

  stopMonitoring(): void {
    if (!this.isMonitoring) return

    this.isMonitoring = false
    
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval)
      this.monitoringInterval = undefined
    }

    if (this.memoryCheckInterval) {
      clearInterval(this.memoryCheckInterval)
      this.memoryCheckInterval = undefined
    }

    if (this.performanceObserver) {
      this.performanceObserver.disconnect()
    }

    logger.info('PerformanceMonitor', 'Performance monitoring stopped')
  }

  private setupPerformanceObserver(): void {
    if (typeof PerformanceObserver !== 'undefined') {
      try {
        this.performanceObserver = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (entry.entryType === 'measure') {
              this.handlePerformanceMeasure(entry)
            }
          }
        })
        
        this.performanceObserver.observe({ 
          entryTypes: ['measure', 'navigation', 'resource'] 
        })
      } catch (error) {
        logger.warn('PerformanceMonitor', 'Performance Observer not supported', error)
      }
    }
  }

  private handlePerformanceMeasure(entry: PerformanceEntry): void {
    switch (entry.name) {
      case 'render':
        this.currentMetrics.renderTime = entry.duration
        break
      case 'update':
        this.currentMetrics.updateTime = entry.duration
        break
    }
  }

  private collectMetrics(): void {
    const now = performance.now()
    const deltaTime = now - this.lastFrameTime
    
    const metrics: PerformanceMetrics = {
      fps: this.calculateFPS(deltaTime),
      renderTime: this.currentMetrics.renderTime || 0,
      updateTime: this.currentMetrics.updateTime || 0,
      memoryUsage: this.getMemoryUsage(),
      agentCount: this.currentMetrics.agentCount || 0,
      triangleCount: this.currentMetrics.triangleCount || 0,
      drawCalls: this.currentMetrics.drawCalls || 0,
      cpuUsage: this.estimateCPUUsage(),
      gpuUsage: this.currentMetrics.gpuUsage,
      networkLatency: this.currentMetrics.networkLatency,
      timestamp: now
    }

    this.addMetrics(metrics)
    this.checkThresholds(metrics)
    this.optimizeIfNeeded(metrics)

    this.lastFrameTime = now
  }

  private calculateFPS(deltaTime: number): number {
    if (deltaTime === 0) return 0
    return Math.round(1000 / deltaTime)
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      const memory = (performance as any).memory
      return Math.round(memory.usedJSHeapSize / 1024 / 1024) // MB
    }
    return 0
  }

  private estimateCPUUsage(): number {
    // Simple CPU usage estimation based on frame time
    const renderTime = this.currentMetrics.renderTime || 0
    const updateTime = this.currentMetrics.updateTime || 0
    const totalTime = renderTime + updateTime
    
    // Assume 60fps target (16.67ms per frame)
    const targetFrameTime = 1000 / this.budget.targetFPS
    return Math.min(100, (totalTime / targetFrameTime) * 100)
  }

  private checkMemoryUsage(): void {
    const memoryUsage = this.getMemoryUsage()
    
    if (memoryUsage > this.thresholds.maxMemoryUsage) {
      this.emit('memoryWarning', {
        current: memoryUsage,
        threshold: this.thresholds.maxMemoryUsage
      })
      
      logger.warn('PerformanceMonitor', `Memory usage high: ${memoryUsage}MB`, {
        threshold: this.thresholds.maxMemoryUsage
      })
    }
  }

  private addMetrics(metrics: PerformanceMetrics): void {
    this.metrics.push(metrics)
    
    // Maintain history size
    if (this.metrics.length > this.maxHistorySize) {
      this.metrics.shift()
    }

    this.emit('metricsUpdated', metrics)
  }

  private checkThresholds(metrics: PerformanceMetrics): void {
    const warnings: string[] = []

    if (metrics.fps < this.thresholds.minFPS) {
      warnings.push(`Low FPS: ${metrics.fps} (min: ${this.thresholds.minFPS})`)
    }

    if (metrics.renderTime > this.thresholds.maxRenderTime) {
      warnings.push(`High render time: ${metrics.renderTime}ms (max: ${this.thresholds.maxRenderTime}ms)`)
    }

    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage) {
      warnings.push(`High memory usage: ${metrics.memoryUsage}MB (max: ${this.thresholds.maxMemoryUsage}MB)`)
    }

    if (metrics.cpuUsage > this.thresholds.maxCPUUsage) {
      warnings.push(`High CPU usage: ${metrics.cpuUsage}% (max: ${this.thresholds.maxCPUUsage}%)`)
    }

    if (warnings.length > 0) {
      this.emit('performanceWarning', {
        metrics,
        warnings
      })
      
      logger.warn('PerformanceMonitor', 'Performance thresholds exceeded', { warnings, metrics })
    }
  }

  private optimizeIfNeeded(metrics: PerformanceMetrics): void {
    const suggestions: string[] = []

    // FPS optimization suggestions
    if (metrics.fps < this.thresholds.minFPS) {
      if (metrics.agentCount > this.budget.maxAgents * 0.8) {
        suggestions.push('Consider reducing agent count or implementing LOD')
      }
      
      if (metrics.triangleCount > this.budget.maxTriangles * 0.8) {
        suggestions.push('Consider using lower-poly models or instancing')
      }
      
      if (metrics.drawCalls > this.budget.maxDrawCalls * 0.8) {
        suggestions.push('Consider batching draw calls or using instanced rendering')
      }
    }

    // Memory optimization suggestions
    if (metrics.memoryUsage > this.thresholds.maxMemoryUsage * 0.8) {
      suggestions.push('Consider garbage collection or reducing cached data')
    }

    if (suggestions.length > 0) {
      this.emit('optimizationSuggestions', {
        metrics,
        suggestions
      })
    }
  }

  measurePerformance<T>(name: string, fn: () => T): T {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    
    performance.mark(startMark)
    const result = fn()
    performance.mark(endMark)
    performance.measure(name, startMark, endMark)
    
    return result
  }

  async measureAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    const startMark = `${name}-start`
    const endMark = `${name}-end`
    
    performance.mark(startMark)
    const result = await fn()
    performance.mark(endMark)
    performance.measure(name, startMark, endMark)
    
    return result
  }

  updateAgentCount(count: number): void {
    this.currentMetrics.agentCount = count
  }

  updateRenderStats(stats: {
    triangleCount?: number
    drawCalls?: number
    gpuUsage?: number
  }): void {
    Object.assign(this.currentMetrics, stats)
  }

  updateNetworkLatency(latency: number): void {
    this.currentMetrics.networkLatency = latency
  }

  getCurrentMetrics(): PerformanceMetrics | null {
    return this.metrics.length > 0 ? this.metrics[this.metrics.length - 1] : null
  }

  getMetricsHistory(since?: number): PerformanceMetrics[] {
    if (since) {
      return this.metrics.filter(m => m.timestamp >= since)
    }
    return [...this.metrics]
  }

  getAverageMetrics(windowSize = 60): Partial<PerformanceMetrics> {
    const recent = this.metrics.slice(-windowSize)
    if (recent.length === 0) return {}

    const sum = recent.reduce((acc, metrics) => ({
      fps: acc.fps + metrics.fps,
      renderTime: acc.renderTime + metrics.renderTime,
      updateTime: acc.updateTime + metrics.updateTime,
      memoryUsage: acc.memoryUsage + metrics.memoryUsage,
      cpuUsage: acc.cpuUsage + metrics.cpuUsage
    }), { fps: 0, renderTime: 0, updateTime: 0, memoryUsage: 0, cpuUsage: 0 })

    const count = recent.length
    return {
      fps: Math.round(sum.fps / count),
      renderTime: Math.round(sum.renderTime / count),
      updateTime: Math.round(sum.updateTime / count),
      memoryUsage: Math.round(sum.memoryUsage / count),
      cpuUsage: Math.round(sum.cpuUsage / count)
    }
  }

  getPerformanceReport(): {
    current: PerformanceMetrics | null
    average: Partial<PerformanceMetrics>
    thresholds: PerformanceThresholds
    budget: PerformanceBudget
    isHealthy: boolean
  } {
    const current = this.getCurrentMetrics()
    const average = this.getAverageMetrics()
    
    const isHealthy = current ? 
      current.fps >= this.thresholds.minFPS &&
      current.renderTime <= this.thresholds.maxRenderTime &&
      current.memoryUsage <= this.thresholds.maxMemoryUsage &&
      current.cpuUsage <= this.thresholds.maxCPUUsage :
      false

    return {
      current,
      average,
      thresholds: this.thresholds,
      budget: this.budget,
      isHealthy
    }
  }

  exportMetrics(): string {
    return JSON.stringify({
      metrics: this.metrics,
      thresholds: this.thresholds,
      budget: this.budget,
      exportTime: Date.now()
    }, null, 2)
  }

  clearMetrics(): void {
    this.metrics = []
    this.currentMetrics = {}
    logger.info('PerformanceMonitor', 'Metrics cleared')
  }

  dispose(): void {
    this.stopMonitoring()
    this.clearMetrics()
    this.removeAllListeners()
  }
}