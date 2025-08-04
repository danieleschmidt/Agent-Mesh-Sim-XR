import { describe, it, expect, beforeEach, vi } from 'vitest'
import { PerformanceMonitor } from '../../monitoring/PerformanceMonitor'

// Mock performance API
Object.defineProperty(global.performance, 'now', {
  value: vi.fn(() => Date.now()),
  writable: true
})

Object.defineProperty(global.performance, 'mark', {
  value: vi.fn(),
  writable: true
})

Object.defineProperty(global.performance, 'measure', {
  value: vi.fn(),
  writable: true
})

describe('PerformanceMonitor', () => {
  let monitor: PerformanceMonitor

  beforeEach(() => {
    monitor = new PerformanceMonitor({
      minFPS: 30,
      maxRenderTime: 33,
      maxMemoryUsage: 500,
      maxCPUUsage: 80
    }, {
      targetFPS: 60,
      maxAgents: 1000,
      maxTriangles: 100000,
      maxDrawCalls: 100
    })
  })

  it('should initialize with correct thresholds', () => {
    const report = monitor.getPerformanceReport()
    expect(report.thresholds.minFPS).toBe(30)
    expect(report.budget.targetFPS).toBe(60)
  })

  it('should measure performance correctly', () => {
    const testFunction = vi.fn(() => 'result')
    const result = monitor.measurePerformance('test', testFunction)
    
    expect(result).toBe('result')
    expect(testFunction).toHaveBeenCalled()
    expect(global.performance.mark).toHaveBeenCalledWith('test-start')
    expect(global.performance.mark).toHaveBeenCalledWith('test-end')
    expect(global.performance.measure).toHaveBeenCalledWith('test', 'test-start', 'test-end')
  })

  it('should measure async performance correctly', async () => {
    const testFunction = vi.fn(async () => 'async-result')
    const result = await monitor.measureAsync('async-test', testFunction)
    
    expect(result).toBe('async-result')
    expect(testFunction).toHaveBeenCalled()
  })

  it('should update agent count', () => {
    monitor.updateAgentCount(500)
    monitor.startMonitoring(100)
    
    // Wait for metrics collection
    setTimeout(() => {
      const current = monitor.getCurrentMetrics()
      expect(current?.agentCount).toBe(500)
    }, 150)
  })

  it('should update render stats', () => {
    const stats = {
      triangleCount: 50000,
      drawCalls: 25,
      gpuUsage: 60
    }
    
    monitor.updateRenderStats(stats)
    monitor.startMonitoring(100)
    
    setTimeout(() => {
      const current = monitor.getCurrentMetrics()
      expect(current?.triangleCount).toBe(50000)
      expect(current?.drawCalls).toBe(25)
      expect(current?.gpuUsage).toBe(60)
    }, 150)
  })

  it('should emit warnings when thresholds exceeded', (done) => {
    monitor.on('performanceWarning', (data) => {
      expect(data.warnings).toBeDefined()
      expect(data.metrics).toBeDefined()
      done()
    })

    // Simulate poor performance
    monitor.updateRenderStats({ drawCalls: 200 }) // Over budget
    monitor.startMonitoring(50)
  })

  it('should provide performance averages', () => {
    // Add some mock metrics
    for (let i = 0; i < 10; i++) {
      monitor.updateAgentCount(100 + i)
    }
    
    monitor.startMonitoring(10)
    
    setTimeout(() => {
      const average = monitor.getAverageMetrics(5)
      expect(average.fps).toBeDefined()
      expect(typeof average.fps).toBe('number')
    }, 100)
  })

  it('should clear metrics', () => {
    monitor.updateAgentCount(100)
    monitor.clearMetrics()
    
    const history = monitor.getMetricsHistory()
    expect(history).toHaveLength(0)
  })

  it('should stop monitoring', () => {
    monitor.startMonitoring()
    expect(() => monitor.stopMonitoring()).not.toThrow()
  })

  it('should dispose properly', () => {
    monitor.startMonitoring()
    expect(() => monitor.dispose()).not.toThrow()
  })
})