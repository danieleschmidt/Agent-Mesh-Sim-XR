import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import { PerformanceMonitor } from '../monitoring/PerformanceMonitor'
import type { Agent } from '../types'

export interface BenchmarkConfig {
  name: string
  description: string
  duration: number // milliseconds
  agentCounts: number[]
  scenarios: BenchmarkScenario[]
  metrics: BenchmarkMetric[]
  baseline?: BenchmarkResult
  publishResults: boolean
}

export interface BenchmarkScenario {
  name: string
  description: string
  setup: (agentCount: number) => Promise<Agent[]>
  execute: (agents: Agent[]) => Promise<void>
  cleanup: (agents: Agent[]) => Promise<void>
  expectedPerformance?: {
    minFPS: number
    maxMemoryMB: number
    maxLatencyMs: number
  }
}

export interface BenchmarkMetric {
  name: string
  unit: string
  measure: (context: BenchmarkContext) => Promise<number>
  higherIsBetter: boolean
  significanceThreshold?: number
}

export interface BenchmarkContext {
  agents: Agent[]
  startTime: number
  duration: number
  performanceMonitor: PerformanceMonitor
  additionalData: Record<string, any>
}

export interface BenchmarkResult {
  configName: string
  scenario: string
  agentCount: number
  metrics: Record<string, number>
  performanceProfile: PerformanceProfile
  timestamp: number
  environment: EnvironmentInfo
  statisticalSignificance: boolean
  anomalies: BenchmarkAnomaly[]
}

export interface PerformanceProfile {
  avgFPS: number
  minFPS: number
  maxFPS: number
  avgMemoryMB: number
  peakMemoryMB: number
  avgCPUPercent: number
  peakCPUPercent: number
  renderTimeMs: number
  networkLatencyMs: number
  throughputOpsPerSec: number
}

export interface EnvironmentInfo {
  userAgent: string
  platform: string
  hardwareConcurrency: number
  maxTouchPoints: number
  webGL: {
    vendor: string
    renderer: string
    version: string
    extensions: string[]
  }
  memory?: {
    totalJSHeapSize: number
    usedJSHeapSize: number
    jsHeapSizeLimit: number
  }
}

export interface BenchmarkAnomaly {
  type: 'performance_spike' | 'memory_leak' | 'fps_drop' | 'latency_spike'
  severity: 'low' | 'medium' | 'high' | 'critical'
  timestamp: number
  description: string
  data: any
}

/**
 * Advanced Benchmarking Suite for scientific performance analysis
 * Supports statistical analysis, baseline comparisons, and automated anomaly detection
 */
export class AdvancedBenchmarkingSuite extends EventEmitter {
  private performanceMonitor: PerformanceMonitor
  private benchmarkResults: BenchmarkResult[] = []
  private activeMetrics: Map<string, BenchmarkMetric> = new Map()
  private environmentInfo: EnvironmentInfo
  private statisticalAnalyzer: StatisticalAnalyzer
  
  constructor(performanceMonitor: PerformanceMonitor) {
    super()
    this.performanceMonitor = performanceMonitor
    this.environmentInfo = this.gatherEnvironmentInfo()
    this.statisticalAnalyzer = new StatisticalAnalyzer()
    
    this.initializeStandardMetrics()
    
    logger.info('AdvancedBenchmarkingSuite', 'Initialized with environment', { 
      environment: this.environmentInfo 
    })
  }
  
  private initializeStandardMetrics(): void {
    // Standard performance metrics
    this.registerMetric({
      name: 'fps',
      unit: 'frames/second',
      measure: async (context) => {
        const report = context.performanceMonitor.getPerformanceReport() as any
        return report.fps || 0
      },
      higherIsBetter: true,
      significanceThreshold: 5
    })
    
    this.registerMetric({
      name: 'memory_usage',
      unit: 'MB',
      measure: async (context) => {
        const report = context.performanceMonitor.getPerformanceReport() as any
        return (report.memoryUsage || 0) * (this.environmentInfo.memory?.jsHeapSizeLimit || 100000000) / (1024 * 1024)
      },
      higherIsBetter: false,
      significanceThreshold: 10
    })
    
    this.registerMetric({
      name: 'cpu_usage',
      unit: 'percent',
      measure: async (context) => {
        const report = context.performanceMonitor.getPerformanceReport() as any
        return report.cpuUsage || 0
      },
      higherIsBetter: false,
      significanceThreshold: 10
    })
    
    this.registerMetric({
      name: 'render_time',
      unit: 'milliseconds',
      measure: async (context) => {
        const report = context.performanceMonitor.getPerformanceReport() as any
        return report.renderTime || 0
      },
      higherIsBetter: false,
      significanceThreshold: 2
    })
    
    this.registerMetric({
      name: 'agent_throughput',
      unit: 'agents/second',
      measure: async (context) => {
        return context.agents.length / (context.duration / 1000)
      },
      higherIsBetter: true,
      significanceThreshold: 100
    })
    
    this.registerMetric({
      name: 'message_throughput',
      unit: 'messages/second',
      measure: async (context) => {
        return context.agents.reduce((sum, agent) => sum + (agent.metrics?.msgPerSec || 0), 0)
      },
      higherIsBetter: true,
      significanceThreshold: 50
    })
    
    this.registerMetric({
      name: 'network_latency',
      unit: 'milliseconds',
      measure: async (context) => {
        const report = context.performanceMonitor.getPerformanceReport() as any
        return report.networkLatency || 0
      },
      higherIsBetter: false,
      significanceThreshold: 10
    })
  }
  
  registerMetric(metric: BenchmarkMetric): void {
    this.activeMetrics.set(metric.name, metric)
    logger.debug('AdvancedBenchmarkingSuite', 'Metric registered', { name: metric.name })
  }
  
  async runBenchmark(config: BenchmarkConfig): Promise<BenchmarkResult[]> {
    logger.info('AdvancedBenchmarkingSuite', 'Starting benchmark suite', { 
      name: config.name,
      scenarios: config.scenarios.length,
      agentCounts: config.agentCounts
    })
    
    const results: BenchmarkResult[] = []
    
    // Run each scenario with different agent counts
    for (const scenario of config.scenarios) {
      for (const agentCount of config.agentCounts) {
        try {
          logger.info('AdvancedBenchmarkingSuite', `Running scenario: ${scenario.name} with ${agentCount} agents`)
          
          const result = await this.runScenario(config, scenario, agentCount)
          results.push(result)
          
          this.emit('scenarioComplete', result)
          
          // Allow cleanup between scenarios
          await this.delay(1000)
          
        } catch (error) {
          logger.error('AdvancedBenchmarkingSuite', `Scenario failed: ${scenario.name}`, error as Error)
          
          const failedResult: BenchmarkResult = {
            configName: config.name,
            scenario: scenario.name,
            agentCount: agentCount,
            metrics: {},
            performanceProfile: this.createEmptyPerformanceProfile(),
            timestamp: Date.now(),
            environment: this.environmentInfo,
            statisticalSignificance: false,
            anomalies: [{
              type: 'performance_spike',
              severity: 'critical',
              timestamp: Date.now(),
              description: `Scenario failed: ${(error as Error).message}`,
              data: { error: error }
            }]
          }
          
          results.push(failedResult)
        }
      }
    }
    
    this.benchmarkResults.push(...results)
    
    // Perform statistical analysis
    const analysis = await this.performStatisticalAnalysis(config, results)
    
    // Generate benchmark report
    const report = this.generateBenchmarkReport(config, results, analysis)
    
    this.emit('benchmarkComplete', { config, results, analysis, report })
    
    // Publish results if configured
    if (config.publishResults) {
      await this.publishResults(config, results, report)
    }
    
    logger.info('AdvancedBenchmarkingSuite', 'Benchmark suite completed', {
      totalResults: results.length,
      successfulResults: results.filter(r => Object.keys(r.metrics).length > 0).length
    })
    
    return results
  }
  
  private async runScenario(config: BenchmarkConfig, scenario: BenchmarkScenario, agentCount: number): Promise<BenchmarkResult> {
    const startTime = Date.now()
    
    // Setup scenario
    const agents = await scenario.setup(agentCount)
    
    // Start performance monitoring
    this.performanceMonitor.startMonitoring()
    const monitoringStartTime = Date.now()
    
    // Execute scenario
    await scenario.execute(agents)
    
    // Wait for benchmark duration
    await this.delay(config.duration)
    
    // Gather metrics
    const context: BenchmarkContext = {
      agents,
      startTime: monitoringStartTime,
      duration: config.duration,
      performanceMonitor: this.performanceMonitor,
      additionalData: {}
    }
    
    const metrics: Record<string, number> = {}
    for (const metricName of config.metrics.map(m => m.name)) {
      const metric = this.activeMetrics.get(metricName)
      if (metric) {
        try {
          metrics[metricName] = await metric.measure(context)
        } catch (error) {
          logger.warn('AdvancedBenchmarkingSuite', `Metric measurement failed: ${metricName}`, error as Error)
          metrics[metricName] = 0
        }
      }
    }
    
    // Create performance profile
    const performanceProfile = this.createPerformanceProfile(context)
    
    // Detect anomalies
    const anomalies = this.detectAnomalies(performanceProfile, metrics)
    
    // Cleanup scenario
    await scenario.cleanup(agents)
    
    // Stop monitoring
    this.performanceMonitor.stopMonitoring()
    
    // Calculate statistical significance
    const statisticalSignificance = await this.calculateStatisticalSignificance(config, scenario.name, agentCount, metrics)
    
    return {
      configName: config.name,
      scenario: scenario.name,
      agentCount: agentCount,
      metrics,
      performanceProfile,
      timestamp: startTime,
      environment: this.environmentInfo,
      statisticalSignificance,
      anomalies
    }
  }
  
  private createPerformanceProfile(context: BenchmarkContext): PerformanceProfile {
    const report = context.performanceMonitor.getPerformanceReport() as any
    
    return {
      avgFPS: report.fps || 0,
      minFPS: report.minFPS || 0,
      maxFPS: report.maxFPS || 0,
      avgMemoryMB: (report.memoryUsage || 0) * (this.environmentInfo.memory?.jsHeapSizeLimit || 100000000) / (1024 * 1024),
      peakMemoryMB: (report.peakMemoryUsage || 0) * (this.environmentInfo.memory?.jsHeapSizeLimit || 100000000) / (1024 * 1024),
      avgCPUPercent: report.cpuUsage || 0,
      peakCPUPercent: report.peakCPUUsage || 0,
      renderTimeMs: report.renderTime || 0,
      networkLatencyMs: report.networkLatency || 0,
      throughputOpsPerSec: context.agents.reduce((sum, agent) => sum + (agent.metrics?.msgPerSec || 0), 0)
    }
  }
  
  private createEmptyPerformanceProfile(): PerformanceProfile {
    return {
      avgFPS: 0,
      minFPS: 0,
      maxFPS: 0,
      avgMemoryMB: 0,
      peakMemoryMB: 0,
      avgCPUPercent: 0,
      peakCPUPercent: 0,
      renderTimeMs: 0,
      networkLatencyMs: 0,
      throughputOpsPerSec: 0
    }
  }
  
  private detectAnomalies(profile: PerformanceProfile, metrics: Record<string, number>): BenchmarkAnomaly[] {
    const anomalies: BenchmarkAnomaly[] = []
    
    // FPS drop detection
    if (profile.avgFPS > 0 && profile.minFPS < profile.avgFPS * 0.5) {
      anomalies.push({
        type: 'fps_drop',
        severity: profile.minFPS < 15 ? 'critical' : profile.minFPS < 30 ? 'high' : 'medium',
        timestamp: Date.now(),
        description: `Significant FPS drop detected: min ${profile.minFPS}, avg ${profile.avgFPS}`,
        data: { minFPS: profile.minFPS, avgFPS: profile.avgFPS }
      })
    }
    
    // Memory spike detection
    if (profile.peakMemoryMB > profile.avgMemoryMB * 2) {
      anomalies.push({
        type: 'memory_leak',
        severity: profile.peakMemoryMB > 1000 ? 'critical' : profile.peakMemoryMB > 500 ? 'high' : 'medium',
        timestamp: Date.now(),
        description: `Memory spike detected: peak ${profile.peakMemoryMB}MB, avg ${profile.avgMemoryMB}MB`,
        data: { peakMemory: profile.peakMemoryMB, avgMemory: profile.avgMemoryMB }
      })
    }
    
    // Network latency spike detection
    if (profile.networkLatencyMs > 500) {
      anomalies.push({
        type: 'latency_spike',
        severity: profile.networkLatencyMs > 1000 ? 'critical' : 'high',
        timestamp: Date.now(),
        description: `High network latency detected: ${profile.networkLatencyMs}ms`,
        data: { latency: profile.networkLatencyMs }
      })
    }
    
    // CPU usage anomaly
    if (profile.peakCPUPercent > 90) {
      anomalies.push({
        type: 'performance_spike',
        severity: 'high',
        timestamp: Date.now(),
        description: `High CPU usage detected: ${profile.peakCPUPercent}%`,
        data: { peakCPU: profile.peakCPUPercent }
      })
    }
    
    return anomalies
  }
  
  private async calculateStatisticalSignificance(config: BenchmarkConfig, scenarioName: string, agentCount: number, metrics: Record<string, number>): Promise<boolean> {
    // Find previous results for the same scenario and agent count
    const previousResults = this.benchmarkResults.filter(r => 
      r.configName === config.name && 
      r.scenario === scenarioName && 
      r.agentCount === agentCount
    )
    
    if (previousResults.length < 3) {
      return false // Need at least 3 samples for statistical significance
    }
    
    // Perform t-test for each metric
    for (const [metricName, value] of Object.entries(metrics)) {
      const metric = this.activeMetrics.get(metricName)
      if (!metric?.significanceThreshold) continue
      
      const previousValues = previousResults.map(r => r.metrics[metricName]).filter(v => v !== undefined)
      
      if (previousValues.length >= 3) {
        const isSignificant = this.statisticalAnalyzer.performTTest(
          previousValues, 
          [value], 
          0.05 // 95% confidence level
        )
        
        if (isSignificant) {
          return true
        }
      }
    }
    
    return false
  }
  
  private async performStatisticalAnalysis(config: BenchmarkConfig, results: BenchmarkResult[]): Promise<StatisticalAnalysis> {
    return this.statisticalAnalyzer.analyzeResults(results)
  }
  
  private generateBenchmarkReport(config: BenchmarkConfig, results: BenchmarkResult[], analysis: StatisticalAnalysis): BenchmarkReport {
    const report: BenchmarkReport = {
      configName: config.name,
      description: config.description,
      timestamp: Date.now(),
      environment: this.environmentInfo,
      totalScenarios: config.scenarios.length,
      totalResults: results.length,
      successfulResults: results.filter(r => Object.keys(r.metrics).length > 0).length,
      averageMetrics: this.calculateAverageMetrics(results),
      performanceTrends: this.calculatePerformanceTrends(results),
      anomalySummary: this.summarizeAnomalies(results),
      statisticalAnalysis: analysis,
      recommendations: this.generateRecommendations(results, analysis)
    }
    
    return report
  }
  
  private calculateAverageMetrics(results: BenchmarkResult[]): Record<string, number> {
    const averages: Record<string, number> = {}
    const metricCounts: Record<string, number> = {}
    
    results.forEach(result => {
      Object.entries(result.metrics).forEach(([metric, value]) => {
        averages[metric] = (averages[metric] || 0) + value
        metricCounts[metric] = (metricCounts[metric] || 0) + 1
      })
    })
    
    Object.keys(averages).forEach(metric => {
      averages[metric] = averages[metric] / metricCounts[metric]
    })
    
    return averages
  }
  
  private calculatePerformanceTrends(results: BenchmarkResult[]): PerformanceTrend[] {
    const trends: PerformanceTrend[] = []
    
    // Group results by scenario
    const scenarioGroups = new Map<string, BenchmarkResult[]>()
    results.forEach(result => {
      if (!scenarioGroups.has(result.scenario)) {
        scenarioGroups.set(result.scenario, [])
      }
      scenarioGroups.get(result.scenario)!.push(result)
    })
    
    scenarioGroups.forEach((scenarioResults, scenario) => {
      // Sort by agent count
      scenarioResults.sort((a, b) => a.agentCount - b.agentCount)
      
      // Calculate trends for each metric
      this.activeMetrics.forEach((metric, metricName) => {
        const values = scenarioResults.map(r => ({ x: r.agentCount, y: r.metrics[metricName] || 0 }))
        
        if (values.length >= 3) {
          const trend = this.statisticalAnalyzer.calculateLinearTrend(values)
          
          trends.push({
            scenario,
            metric: metricName,
            slope: trend.slope,
            correlation: trend.correlation,
            prediction: trend.prediction,
            significance: Math.abs(trend.correlation) > 0.7 ? 'high' : Math.abs(trend.correlation) > 0.3 ? 'medium' : 'low'
          })
        }
      })
    })
    
    return trends
  }
  
  private summarizeAnomalies(results: BenchmarkResult[]): AnomalySummary {
    const summary: AnomalySummary = {
      totalAnomalies: 0,
      criticalAnomalies: 0,
      anomaliesByType: {},
      anomaliesByScenario: {},
      commonPatterns: []
    }
    
    results.forEach(result => {
      summary.totalAnomalies += result.anomalies.length
      summary.criticalAnomalies += result.anomalies.filter(a => a.severity === 'critical').length
      
      result.anomalies.forEach(anomaly => {
        summary.anomaliesByType[anomaly.type] = (summary.anomaliesByType[anomaly.type] || 0) + 1
        summary.anomaliesByScenario[result.scenario] = (summary.anomaliesByScenario[result.scenario] || 0) + 1
      })
    })
    
    // Identify common patterns
    Object.entries(summary.anomaliesByType).forEach(([type, count]) => {
      if (count > results.length * 0.3) { // More than 30% of results
        summary.commonPatterns.push({
          type: 'anomaly_pattern',
          description: `${type} anomalies occur frequently (${count}/${results.length} results)`,
          frequency: count / results.length
        })
      }
    })
    
    return summary
  }
  
  private generateRecommendations(results: BenchmarkResult[], analysis: StatisticalAnalysis): Recommendation[] {
    const recommendations: Recommendation[] = []
    
    // Performance recommendations based on trends
    analysis.trends?.forEach(trend => {
      if (trend.significance === 'high' && trend.slope < 0) {
        // Negative trend in performance metric
        const metric = this.activeMetrics.get(trend.metric)
        if (metric?.higherIsBetter) {
          recommendations.push({
            type: 'performance',
            priority: 'high',
            title: `${trend.metric} degradation with scale`,
            description: `The ${trend.metric} metric shows significant degradation (${trend.slope.toFixed(2)}) as agent count increases in ${trend.scenario} scenario.`,
            suggestedActions: [
              'Consider implementing Level-of-Detail (LOD) optimization',
              'Enable GPU acceleration for this scenario',
              'Investigate memory usage patterns',
              'Consider batching optimizations'
            ]
          })
        }
      }
    })
    
    // Memory recommendations
    const memoryResults = results.filter(r => r.performanceProfile.peakMemoryMB > 500)
    if (memoryResults.length > results.length * 0.5) {
      recommendations.push({
        type: 'memory',
        priority: 'medium',
        title: 'High memory usage detected',
        description: `${memoryResults.length} out of ${results.length} test runs exceeded 500MB memory usage.`,
        suggestedActions: [
          'Implement object pooling for frequently created objects',
          'Review agent data structures for optimization opportunities',
          'Consider implementing garbage collection optimization',
          'Monitor for memory leaks in long-running scenarios'
        ]
      })
    }
    
    // FPS recommendations
    const lowFpsResults = results.filter(r => r.performanceProfile.avgFPS < 30)
    if (lowFpsResults.length > 0) {
      recommendations.push({
        type: 'rendering',
        priority: 'high',
        title: 'Low frame rate performance',
        description: `${lowFpsResults.length} test runs had average FPS below 30.`,
        suggestedActions: [
          'Implement instanced rendering for similar agents',
          'Enable frustum culling',
          'Reduce polygon count for distant agents',
          'Consider using compute shaders for agent updates'
        ]
      })
    }
    
    return recommendations
  }
  
  private async publishResults(config: BenchmarkConfig, results: BenchmarkResult[], report: BenchmarkReport): Promise<void> {
    // Simulate publishing results to research database
    logger.info('AdvancedBenchmarkingSuite', 'Publishing benchmark results', {
      configName: config.name,
      resultCount: results.length
    })
    
    this.emit('resultsPublished', { config, results, report })
  }
  
  private gatherEnvironmentInfo(): EnvironmentInfo {
    const info: EnvironmentInfo = {
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : 'Node.js',
      platform: typeof navigator !== 'undefined' ? navigator.platform : process.platform,
      hardwareConcurrency: typeof navigator !== 'undefined' ? navigator.hardwareConcurrency : require('os').cpus().length,
      maxTouchPoints: typeof navigator !== 'undefined' ? navigator.maxTouchPoints || 0 : 0,
      webGL: {
        vendor: 'Unknown',
        renderer: 'Unknown',
        version: 'Unknown',
        extensions: []
      }
    }
    
    // Gather WebGL information if available
    if (typeof document !== 'undefined') {
      try {
        const canvas = document.createElement('canvas')
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl')
        
        if (gl && gl instanceof WebGLRenderingContext) {
          const debugInfo = gl.getExtension('WEBGL_debug_renderer_info')
          if (debugInfo) {
            info.webGL.vendor = gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL)
            info.webGL.renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL)
          }
          info.webGL.version = gl.getParameter(gl.VERSION)
          info.webGL.extensions = gl.getSupportedExtensions() || []
        }
      } catch (error) {
        // WebGL not available
      }
    }
    
    // Gather memory information if available
    if (typeof performance !== 'undefined' && 'memory' in performance) {
      const memory = (performance as any).memory
      info.memory = {
        totalJSHeapSize: memory.totalJSHeapSize,
        usedJSHeapSize: memory.usedJSHeapSize,
        jsHeapSizeLimit: memory.jsHeapSizeLimit
      }
    }
    
    return info
  }
  
  private async delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms))
  }
  
  getResults(filter?: {
    configName?: string
    scenario?: string
    since?: number
  }): BenchmarkResult[] {
    let filtered = [...this.benchmarkResults]
    
    if (filter) {
      if (filter.configName) {
        filtered = filtered.filter(r => r.configName === filter.configName)
      }
      if (filter.scenario) {
        filtered = filtered.filter(r => r.scenario === filter.scenario)
      }
      if (filter.since) {
        filtered = filtered.filter(r => r.timestamp >= filter.since!)
      }
    }
    
    return filtered.sort((a, b) => b.timestamp - a.timestamp)
  }
  
  exportResults(format: 'json' | 'csv' | 'html' = 'json'): string {
    switch (format) {
      case 'json':
        return JSON.stringify(this.benchmarkResults, null, 2)
      
      case 'csv':
        return this.exportToCSV(this.benchmarkResults)
      
      case 'html':
        return this.exportToHTML(this.benchmarkResults)
      
      default:
        return JSON.stringify(this.benchmarkResults, null, 2)
    }
  }
  
  private exportToCSV(results: BenchmarkResult[]): string {
    if (results.length === 0) return ''
    
    const headers = ['config', 'scenario', 'agentCount', 'timestamp', 'avgFPS', 'peakMemoryMB', 'avgCPU']
    const rows = [headers.join(',')]
    
    results.forEach(result => {
      rows.push([
        result.configName,
        result.scenario,
        result.agentCount.toString(),
        result.timestamp.toString(),
        result.performanceProfile.avgFPS.toFixed(2),
        result.performanceProfile.peakMemoryMB.toFixed(2),
        result.performanceProfile.avgCPUPercent.toFixed(2)
      ].join(','))
    })
    
    return rows.join('\n')
  }
  
  private exportToHTML(results: BenchmarkResult[]): string {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Benchmark Results</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; }
        table { border-collapse: collapse; width: 100%; }
        th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
        th { background-color: #f2f2f2; }
        .anomaly { background-color: #ffebee; }
      </style>
    </head>
    <body>
      <h1>Benchmark Results Report</h1>
      <p>Generated: ${new Date().toLocaleString()}</p>
      <p>Total Results: ${results.length}</p>
      
      <table>
        <tr>
          <th>Config</th>
          <th>Scenario</th>
          <th>Agents</th>
          <th>Avg FPS</th>
          <th>Peak Memory (MB)</th>
          <th>Avg CPU (%)</th>
          <th>Anomalies</th>
        </tr>
        ${results.map(result => `
          <tr ${result.anomalies.length > 0 ? 'class="anomaly"' : ''}>
            <td>${result.configName}</td>
            <td>${result.scenario}</td>
            <td>${result.agentCount}</td>
            <td>${result.performanceProfile.avgFPS.toFixed(1)}</td>
            <td>${result.performanceProfile.peakMemoryMB.toFixed(1)}</td>
            <td>${result.performanceProfile.avgCPUPercent.toFixed(1)}</td>
            <td>${result.anomalies.length}</td>
          </tr>
        `).join('')}
      </table>
    </body>
    </html>
    `
    
    return html
  }
  
  clearResults(): void {
    this.benchmarkResults = []
    logger.info('AdvancedBenchmarkingSuite', 'Benchmark results cleared')
  }
  
  dispose(): void {
    this.clearResults()
    this.activeMetrics.clear()
    this.removeAllListeners()
  }
}

// Statistical analysis helper
class StatisticalAnalyzer {
  performTTest(sample1: number[], sample2: number[], alpha: number): boolean {
    // Simplified t-test implementation
    const mean1 = sample1.reduce((a, b) => a + b, 0) / sample1.length
    const mean2 = sample2.reduce((a, b) => a + b, 0) / sample2.length
    
    const var1 = sample1.reduce((sum, x) => sum + Math.pow(x - mean1, 2), 0) / (sample1.length - 1)
    const var2 = sample2.reduce((sum, x) => sum + Math.pow(x - mean2, 2), 0) / (sample2.length - 1)
    
    const pooledVar = ((sample1.length - 1) * var1 + (sample2.length - 1) * var2) / (sample1.length + sample2.length - 2)
    const standardError = Math.sqrt(pooledVar * (1/sample1.length + 1/sample2.length))
    
    const tStatistic = Math.abs(mean1 - mean2) / standardError
    const criticalValue = 2.0 // Approximation for 95% confidence
    
    return tStatistic > criticalValue
  }
  
  calculateLinearTrend(points: {x: number, y: number}[]): LinearTrend {
    const n = points.length
    const sumX = points.reduce((sum, p) => sum + p.x, 0)
    const sumY = points.reduce((sum, p) => sum + p.y, 0)
    const sumXY = points.reduce((sum, p) => sum + p.x * p.y, 0)
    const sumXX = points.reduce((sum, p) => sum + p.x * p.x, 0)
    
    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX)
    const intercept = (sumY - slope * sumX) / n
    
    // Calculate correlation coefficient
    const meanX = sumX / n
    const meanY = sumY / n
    
    const numerator = points.reduce((sum, p) => sum + (p.x - meanX) * (p.y - meanY), 0)
    const denomX = Math.sqrt(points.reduce((sum, p) => sum + Math.pow(p.x - meanX, 2), 0))
    const denomY = Math.sqrt(points.reduce((sum, p) => sum + Math.pow(p.y - meanY, 2), 0))
    const correlation = numerator / (denomX * denomY)
    
    return {
      slope,
      intercept,
      correlation,
      prediction: (x: number) => slope * x + intercept
    }
  }
  
  analyzeResults(results: BenchmarkResult[]): StatisticalAnalysis {
    // Placeholder for comprehensive statistical analysis
    return {
      sampleSize: results.length,
      confidenceInterval: 0.95,
      significantFindings: [],
      trends: [] // Would be calculated from trends analysis
    }
  }
}

// Type definitions for analysis results
export interface StatisticalAnalysis {
  sampleSize: number
  confidenceInterval: number
  significantFindings: SignificantFinding[]
  trends?: PerformanceTrend[]
}

export interface SignificantFinding {
  metric: string
  description: string
  pValue: number
  effect: 'positive' | 'negative' | 'neutral'
}

export interface PerformanceTrend {
  scenario: string
  metric: string
  slope: number
  correlation: number
  prediction: (x: number) => number
  significance: 'low' | 'medium' | 'high'
}

export interface LinearTrend {
  slope: number
  intercept: number
  correlation: number
  prediction: (x: number) => number
}

export interface BenchmarkReport {
  configName: string
  description: string
  timestamp: number
  environment: EnvironmentInfo
  totalScenarios: number
  totalResults: number
  successfulResults: number
  averageMetrics: Record<string, number>
  performanceTrends: PerformanceTrend[]
  anomalySummary: AnomalySummary
  statisticalAnalysis: StatisticalAnalysis
  recommendations: Recommendation[]
}

export interface AnomalySummary {
  totalAnomalies: number
  criticalAnomalies: number
  anomaliesByType: Record<string, number>
  anomaliesByScenario: Record<string, number>
  commonPatterns: CommonPattern[]
}

export interface CommonPattern {
  type: string
  description: string
  frequency: number
}

export interface Recommendation {
  type: 'performance' | 'memory' | 'rendering' | 'network'
  priority: 'low' | 'medium' | 'high' | 'critical'
  title: string
  description: string
  suggestedActions: string[]
}