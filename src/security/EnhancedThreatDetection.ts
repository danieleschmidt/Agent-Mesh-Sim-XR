/**
 * Enhanced Threat Detection System
 * Advanced threat detection with machine learning capabilities
 */

import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

interface ThreatPattern {
  type: 'anomaly' | 'injection' | 'flooding' | 'reconnaissance' | 'privilege_escalation'
  severity: 'low' | 'medium' | 'high' | 'critical'
  patterns: RegExp[]
  threshold: number
  timeWindow: number
  description: string
}

interface ThreatEvent {
  id: string
  type: string
  severity: string
  timestamp: number
  source: string
  details: unknown
  risk_score: number
  confidence: number
}

interface BehaviorProfile {
  userId: string
  normalActionRate: number
  typicalActionTypes: Set<string>
  averageSessionDuration: number
  commonEndpoints: Set<string>
  lastActivity: number
  anomalyScore: number
}

export class EnhancedThreatDetection extends EventEmitter {
  private threatPatterns: Map<string, ThreatPattern> = new Map()
  private eventHistory: Map<string, ThreatEvent[]> = new Map()
  private behaviorProfiles: Map<string, BehaviorProfile> = new Map()
  private anomalyDetector: AnomalyDetector
  private isMonitoring = false
  private cleanupInterval?: number
  
  constructor() {
    super()
    this.anomalyDetector = new AnomalyDetector()
    this.initializeDefaultPatterns()
    this.startCleanupTimer()
    
    logger.info('EnhancedThreatDetection', 'Enhanced threat detection initialized')
  }

  private initializeDefaultPatterns(): void {
    // SQL Injection patterns
    this.threatPatterns.set('sql_injection', {
      type: 'injection',
      severity: 'high',
      patterns: [
        /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC)\b)/i,
        /(UNION\s+SELECT)/i,
        /('\s*OR\s+'\d+'\s*=\s*'\d+)/i,
        /(;\s*DROP\s+TABLE)/i
      ],
      threshold: 1,
      timeWindow: 60000,
      description: 'SQL injection attempt detected'
    })

    // XSS patterns
    this.threatPatterns.set('xss_attack', {
      type: 'injection',
      severity: 'high',
      patterns: [
        /<script[\s\S]*?>[\s\S]*?<\/script>/gi,
        /javascript:/gi,
        /on\w+\s*=/gi,
        /<iframe[\s\S]*?>/gi
      ],
      threshold: 1,
      timeWindow: 60000,
      description: 'Cross-site scripting attempt detected'
    })

    // Rate limiting violations
    this.threatPatterns.set('rate_limit_violation', {
      type: 'flooding',
      severity: 'medium',
      patterns: [],
      threshold: 100,
      timeWindow: 60000,
      description: 'Excessive request rate detected'
    })

    // Reconnaissance patterns
    this.threatPatterns.set('reconnaissance', {
      type: 'reconnaissance',
      severity: 'medium',
      patterns: [
        /\.\.\/\.\.\//g,
        /\/etc\/passwd/gi,
        /\/proc\/version/gi,
        /admin|administrator|root/gi
      ],
      threshold: 5,
      timeWindow: 300000,
      description: 'System reconnaissance attempt detected'
    })

    // Privilege escalation
    this.threatPatterns.set('privilege_escalation', {
      type: 'privilege_escalation',
      severity: 'critical',
      patterns: [
        /sudo|su\s+/gi,
        /chmod\s+777/gi,
        /\/etc\/shadow/gi,
        /whoami|id\s/gi
      ],
      threshold: 1,
      timeWindow: 60000,
      description: 'Privilege escalation attempt detected'
    })
  }

  startMonitoring(): void {
    this.isMonitoring = true
    logger.info('EnhancedThreatDetection', 'Threat monitoring started')
  }

  stopMonitoring(): void {
    this.isMonitoring = false
    logger.info('EnhancedThreatDetection', 'Threat monitoring stopped')
  }

  analyzeInput(input: string, source: string, context: unknown = {}): ThreatEvent | null {
    if (!this.isMonitoring) return null

    const threats: ThreatEvent[] = []
    
    // Pattern-based detection
    for (const [patternName, pattern] of this.threatPatterns) {
      if (this.matchesPattern(input, pattern)) {
        const threat: ThreatEvent = {
          id: this.generateThreatId(),
          type: pattern.type,
          severity: pattern.severity,
          timestamp: Date.now(),
          source,
          details: { pattern: patternName, input, context },
          risk_score: this.calculateRiskScore(pattern.severity),
          confidence: 0.8
        }
        threats.push(threat)
      }
    }

    // Behavioral analysis
    const behaviorThreat = this.analyzeBehavior(source, input, context)
    if (behaviorThreat) {
      threats.push(behaviorThreat)
    }

    // Anomaly detection
    const anomalyThreat = this.anomalyDetector.detectAnomaly(input, source, context)
    if (anomalyThreat) {
      threats.push(anomalyThreat)
    }

    // Return highest severity threat
    if (threats.length > 0) {
      const highestThreat = threats.reduce((prev, current) => 
        prev.risk_score > current.risk_score ? prev : current
      )
      
      this.recordThreatEvent(highestThreat)
      this.emit('threat_detected', highestThreat)
      
      logger.warn('EnhancedThreatDetection', 'Threat detected', {
        type: highestThreat.type,
        severity: highestThreat.severity,
        source: highestThreat.source,
        confidence: highestThreat.confidence
      })

      return highestThreat
    }

    return null
  }

  private matchesPattern(input: string, pattern: ThreatPattern): boolean {
    return pattern.patterns.some(regex => regex.test(input))
  }

  private analyzeBehavior(source: string, input: string, context: unknown): ThreatEvent | null {
    const profile = this.getOrCreateBehaviorProfile(source)
    const currentTime = Date.now()
    
    // Update behavior profile
    this.updateBehaviorProfile(profile, input, context, currentTime)
    
    // Calculate anomaly score
    const anomalyScore = this.calculateAnomalyScore(profile, input, context)
    profile.anomalyScore = anomalyScore

    // Detect behavioral anomalies
    if (anomalyScore > 0.7) {
      return {
        id: this.generateThreatId(),
        type: 'anomaly',
        severity: anomalyScore > 0.9 ? 'critical' : 'high',
        timestamp: currentTime,
        source,
        details: { anomalyScore, behavior: 'unusual_activity', context },
        risk_score: Math.floor(anomalyScore * 100),
        confidence: anomalyScore
      }
    }

    return null
  }

  private getOrCreateBehaviorProfile(source: string): BehaviorProfile {
    if (!this.behaviorProfiles.has(source)) {
      this.behaviorProfiles.set(source, {
        userId: source,
        normalActionRate: 10, // actions per minute
        typicalActionTypes: new Set(),
        averageSessionDuration: 1800000, // 30 minutes
        commonEndpoints: new Set(),
        lastActivity: Date.now(),
        anomalyScore: 0
      })
    }
    return this.behaviorProfiles.get(source)!
  }

  private updateBehaviorProfile(profile: BehaviorProfile, input: string, context: unknown, currentTime: number): void {
    const timeSinceLastActivity = currentTime - profile.lastActivity
    
    // Update activity timing
    if (timeSinceLastActivity < 60000) { // Within 1 minute
      // Fast activity - potential indicator
      profile.anomalyScore += 0.1
    }
    
    profile.lastActivity = currentTime
    
    // Learn normal patterns
    if (typeof context === 'object' && context !== null) {
      const ctx = context as { actionType?: string; endpoint?: string }
      if (ctx.actionType) {
        profile.typicalActionTypes.add(ctx.actionType)
      }
      if (ctx.endpoint) {
        profile.commonEndpoints.add(ctx.endpoint)
      }
    }
  }

  private calculateAnomalyScore(profile: BehaviorProfile, input: string, context: unknown): number {
    let score = 0
    
    // Check for unusual input patterns
    if (input.length > 1000) score += 0.2
    if (input.includes('<script') || input.includes('javascript:')) score += 0.4
    if (/['";-]/.test(input)) score += 0.1
    
    // Check behavioral patterns
    const currentTime = Date.now()
    const timeSinceLastActivity = currentTime - profile.lastActivity
    
    if (timeSinceLastActivity < 100) score += 0.3 // Very fast actions
    if (timeSinceLastActivity > 3600000) score += 0.1 // Long gaps unusual
    
    // Context analysis
    if (typeof context === 'object' && context !== null) {
      const ctx = context as { actionType?: string; endpoint?: string; userAgent?: string }
      
      if (ctx.actionType && !profile.typicalActionTypes.has(ctx.actionType)) {
        score += 0.2 // Unusual action type
      }
      
      if (ctx.endpoint && !profile.commonEndpoints.has(ctx.endpoint)) {
        score += 0.1 // New endpoint
      }

      if (ctx.userAgent && (ctx.userAgent.includes('curl') || ctx.userAgent.includes('wget'))) {
        score += 0.3 // Automated tools
      }
    }
    
    return Math.min(score, 1.0)
  }

  private recordThreatEvent(threat: ThreatEvent): void {
    const sourceEvents = this.eventHistory.get(threat.source) || []
    sourceEvents.push(threat)
    this.eventHistory.set(threat.source, sourceEvents)
    
    // Maintain event history size
    if (sourceEvents.length > 100) {
      sourceEvents.shift()
    }
  }

  private calculateRiskScore(severity: string): number {
    const severityScores = {
      low: 25,
      medium: 50,
      high: 75,
      critical: 100
    }
    return severityScores[severity as keyof typeof severityScores] || 0
  }

  private generateThreatId(): string {
    return `threat_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`
  }

  private startCleanupTimer(): void {
    this.cleanupInterval = setInterval(() => {
      this.cleanupOldEvents()
      this.cleanupOldProfiles()
    }, 3600000) as unknown as number // Every hour
  }

  private cleanupOldEvents(): void {
    const cutoffTime = Date.now() - 86400000 // 24 hours
    
    for (const [source, events] of this.eventHistory) {
      const recentEvents = events.filter(event => event.timestamp > cutoffTime)
      if (recentEvents.length === 0) {
        this.eventHistory.delete(source)
      } else {
        this.eventHistory.set(source, recentEvents)
      }
    }
  }

  private cleanupOldProfiles(): void {
    const cutoffTime = Date.now() - 604800000 // 7 days
    
    for (const [source, profile] of this.behaviorProfiles) {
      if (profile.lastActivity < cutoffTime) {
        this.behaviorProfiles.delete(source)
      }
    }
  }

  getThreatReport(source?: string): unknown {
    const report = {
      timestamp: Date.now(),
      totalThreats: 0,
      threatsByType: {} as Record<string, number>,
      threatsBySeverity: {} as Record<string, number>,
      recentThreats: [] as ThreatEvent[],
      behaviorProfiles: this.behaviorProfiles.size
    }

    const allEvents = source 
      ? (this.eventHistory.get(source) || [])
      : Array.from(this.eventHistory.values()).flat()

    report.totalThreats = allEvents.length
    report.recentThreats = allEvents
      .filter(event => event.timestamp > Date.now() - 3600000)
      .slice(-10)

    // Aggregate by type and severity
    for (const event of allEvents) {
      report.threatsByType[event.type] = (report.threatsByType[event.type] || 0) + 1
      report.threatsBySeverity[event.severity] = (report.threatsBySeverity[event.severity] || 0) + 1
    }

    return report
  }

  dispose(): void {
    this.stopMonitoring()
    
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
      this.cleanupInterval = undefined
    }
    
    this.eventHistory.clear()
    this.behaviorProfiles.clear()
    this.threatPatterns.clear()
    this.removeAllListeners()
    
    logger.info('EnhancedThreatDetection', 'Threat detection system disposed')
  }
}

class AnomalyDetector {
  private baselineMetrics: Map<string, number[]> = new Map()
  
  detectAnomaly(input: string, source: string, context: unknown): ThreatEvent | null {
    const metrics = this.extractMetrics(input, context)
    const anomalyScore = this.calculateAnomalyScore(source, metrics)
    
    if (anomalyScore > 0.8) {
      return {
        id: `anomaly_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
        type: 'anomaly',
        severity: anomalyScore > 0.95 ? 'critical' : 'high',
        timestamp: Date.now(),
        source,
        details: { anomalyScore, metrics, context },
        risk_score: Math.floor(anomalyScore * 100),
        confidence: anomalyScore
      }
    }
    
    return null
  }

  private extractMetrics(input: string, context: unknown): number[] {
    return [
      input.length,
      (input.match(/[^a-zA-Z0-9\s]/g) || []).length, // Special characters
      (input.match(/\b\w+\b/g) || []).length, // Word count
      input.split('\n').length, // Line count
      typeof context === 'object' ? Object.keys(context || {}).length : 0
    ]
  }

  private calculateAnomalyScore(source: string, metrics: number[]): number {
    const baseline = this.baselineMetrics.get(source) || []
    
    if (baseline.length < 10) {
      // Learning phase
      baseline.push(...metrics)
      this.baselineMetrics.set(source, baseline.slice(-50))
      return 0
    }
    
    // Calculate z-score
    const mean = baseline.reduce((a, b) => a + b, 0) / baseline.length
    const variance = baseline.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / baseline.length
    const stdDev = Math.sqrt(variance)
    
    const avgMetric = metrics.reduce((a, b) => a + b, 0) / metrics.length
    const zScore = Math.abs(avgMetric - mean) / (stdDev || 1)
    
    // Update baseline
    baseline.push(...metrics)
    this.baselineMetrics.set(source, baseline.slice(-50))
    
    return Math.min(zScore / 3, 1) // Normalize to 0-1
  }
}