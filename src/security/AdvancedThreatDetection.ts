import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import type { Agent } from '../types'

export interface ThreatSignature {
  id: string
  name: string
  pattern: RegExp | ((data: any) => boolean)
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  mitigation: string[]
}

export interface AnomalyDetectionConfig {
  enableBehaviorAnalysis: boolean
  enableNetworkAnalysis: boolean
  enablePatternMatching: boolean
  anomalyThreshold: number
  learningPeriodHours: 24
  maxSamplesPerAgent: 1000
}

export class AdvancedThreatDetection extends EventEmitter {
  private signatures: Map<string, ThreatSignature> = new Map()
  private behaviorBaselines: Map<string, AgentBehaviorBaseline> = new Map()
  private networkBaselines: Map<string, NetworkBehaviorBaseline> = new Map()
  private config: AnomalyDetectionConfig
  private isActive = false

  constructor(config?: Partial<AnomalyDetectionConfig>) {
    super()
    
    this.config = {
      enableBehaviorAnalysis: true,
      enableNetworkAnalysis: true,
      enablePatternMatching: true,
      anomalyThreshold: 0.7,
      learningPeriodHours: 24,
      maxSamplesPerAgent: 1000,
      ...config
    }

    this.initializeSignatures()
    logger.info('AdvancedThreatDetection initialized', { config: this.config })
  }

  private initializeSignatures(): void {
    // SQL Injection patterns
    this.addSignature({
      id: 'sql_injection',
      name: 'SQL Injection Attack',
      pattern: /(union\s+select|drop\s+table|insert\s+into|delete\s+from)/i,
      severity: 'high',
      description: 'Potential SQL injection attempt detected',
      mitigation: ['sanitize_input', 'use_parameterized_queries', 'validate_data_types']
    })

    // XSS patterns
    this.addSignature({
      id: 'xss_attack',
      name: 'Cross-Site Scripting',
      pattern: /<script[^>]*>|javascript:|onload\s*=|onerror\s*=/i,
      severity: 'high',
      description: 'Cross-site scripting attempt detected',
      mitigation: ['escape_html', 'sanitize_input', 'content_security_policy']
    })

    // Command injection
    this.addSignature({
      id: 'command_injection',
      name: 'Command Injection',
      pattern: /(\|\s*|\&\&\s*|\;\s*)(rm\s|cat\s|ls\s|wget\s|curl\s|nc\s)/i,
      severity: 'critical',
      description: 'Command injection attempt detected',
      mitigation: ['validate_input', 'whitelist_commands', 'sandbox_execution']
    })

    // Behavioral anomalies
    this.addSignature({
      id: 'rapid_agent_creation',
      name: 'Rapid Agent Creation',
      pattern: (data: any) => {
        if (data.type === 'agent_creation' && data.agentCount > 100 && data.timespan < 10000) {
          return true
        }
        return false
      },
      severity: 'medium',
      description: 'Unusually rapid agent creation detected',
      mitigation: ['rate_limit', 'user_verification', 'resource_quota']
    })

    // Memory exhaustion attempts
    this.addSignature({
      id: 'memory_exhaustion',
      name: 'Memory Exhaustion Attack',
      pattern: (data: any) => {
        if (data.type === 'memory_usage' && data.memoryMB > 1000 && data.growthRate > 100) {
          return true
        }
        return false
      },
      severity: 'high',
      description: 'Potential memory exhaustion attack',
      mitigation: ['memory_limits', 'garbage_collection', 'resource_monitoring']
    })

    logger.info('Threat signatures initialized', { signatureCount: this.signatures.size })
  }

  public addSignature(signature: ThreatSignature): void {
    this.signatures.set(signature.id, signature)
    logger.info('Threat signature added', { id: signature.id, name: signature.name })
  }

  public start(): void {
    if (this.isActive) {
      logger.warn('AdvancedThreatDetection', 'Already active')
      return
    }

    this.isActive = true
    this.startBehaviorLearning()
    logger.info('AdvancedThreatDetection', 'Started')
    this.emit('started')
  }

  public stop(): void {
    this.isActive = false
    logger.info('AdvancedThreatDetection', 'Stopped')
    this.emit('stopped')
  }

  public analyzeData(data: any, context: string): ThreatAnalysisResult {
    if (!this.isActive) {
      return { threats: [], anomalies: [], riskScore: 0 }
    }

    const threats: DetectedThreat[] = []
    const anomalies: DetectedAnomaly[] = []

    // Pattern matching
    if (this.config.enablePatternMatching) {
      threats.push(...this.detectPatternThreats(data))
    }

    // Behavior analysis
    if (this.config.enableBehaviorAnalysis && data.agent) {
      anomalies.push(...this.detectBehaviorAnomalies(data.agent))
    }

    // Network analysis
    if (this.config.enableNetworkAnalysis && data.networkActivity) {
      anomalies.push(...this.detectNetworkAnomalies(data.networkActivity))
    }

    const riskScore = this.calculateRiskScore(threats, anomalies)

    if (riskScore > this.config.anomalyThreshold) {
      this.emit('highRiskDetected', { threats, anomalies, riskScore, context })
      logger.warn('High risk activity detected', { riskScore, threatCount: threats.length, anomalyCount: anomalies.length })
    }

    return { threats, anomalies, riskScore }
  }

  public analyzeAgent(agent: Agent): AgentThreatAnalysis {
    const behaviorAnomaly = this.analyzeBehaviorAnomaly(agent)
    const communicationAnomaly = this.analyzeCommunicationAnomaly(agent)
    const resourceUsageAnomaly = this.analyzeResourceUsageAnomaly(agent)

    const overallRisk = Math.max(
      behaviorAnomaly.riskScore,
      communicationAnomaly.riskScore,
      resourceUsageAnomaly.riskScore
    )

    return {
      agentId: agent.id,
      overallRisk,
      behaviorAnomaly,
      communicationAnomaly,
      resourceUsageAnomaly,
      recommendations: this.generateSecurityRecommendations(overallRisk)
    }
  }

  private detectPatternThreats(data: any): DetectedThreat[] {
    const threats: DetectedThreat[] = []
    
    for (const [id, signature] of this.signatures) {
      try {
        let matches = false
        
        if (signature.pattern instanceof RegExp) {
          const dataStr = JSON.stringify(data)
          matches = signature.pattern.test(dataStr)
        } else if (typeof signature.pattern === 'function') {
          matches = signature.pattern(data)
        }

        if (matches) {
          threats.push({
            id: `threat_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            signatureId: id,
            name: signature.name,
            severity: signature.severity,
            description: signature.description,
            timestamp: Date.now(),
            data: data,
            mitigation: signature.mitigation
          })
        }
      } catch (error) {
        logger.error('Error in pattern matching', { signatureId: id, error })
      }
    }

    return threats
  }

  private detectBehaviorAnomalies(agent: Agent): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = []
    const baseline = this.behaviorBaselines.get(agent.id)
    
    if (!baseline) {
      this.initializeBehaviorBaseline(agent)
      return anomalies
    }

    // Check movement patterns
    const movementAnomaly = this.checkMovementAnomaly(agent, baseline)
    if (movementAnomaly.isAnomaly) {
      anomalies.push(movementAnomaly)
    }

    // Check communication patterns
    const communicationAnomaly = this.checkCommunicationAnomaly(agent, baseline)
    if (communicationAnomaly.isAnomaly) {
      anomalies.push(communicationAnomaly)
    }

    return anomalies
  }

  private detectNetworkAnomalies(networkActivity: any): DetectedAnomaly[] {
    const anomalies: DetectedAnomaly[] = []
    // Implementation for network anomaly detection
    // This would analyze network traffic patterns, connection frequencies, etc.
    return anomalies
  }

  private analyzeBehaviorAnomaly(agent: Agent): BehaviorAnomalyResult {
    const baseline = this.behaviorBaselines.get(agent.id)
    
    if (!baseline) {
      return {
        riskScore: 0,
        anomalies: [],
        confidence: 0,
        recommendation: 'establish_baseline'
      }
    }

    const anomalies: string[] = []
    let riskScore = 0

    // Analyze position changes
    if (agent.position) {
      const positionVariance = this.calculatePositionVariance(agent, baseline)
      if (positionVariance > baseline.normalPositionVariance * 3) {
        anomalies.push('unusual_movement_pattern')
        riskScore += 0.3
      }
    }

    // Analyze state changes
    const stateChangeFrequency = this.calculateStateChangeFrequency(agent, baseline)
    if (stateChangeFrequency > baseline.normalStateChangeFrequency * 2) {
      anomalies.push('unusual_state_changes')
      riskScore += 0.2
    }

    return {
      riskScore: Math.min(riskScore, 1.0),
      anomalies,
      confidence: Math.min(baseline.sampleCount / this.config.maxSamplesPerAgent, 1.0),
      recommendation: riskScore > 0.5 ? 'investigate_agent' : 'continue_monitoring'
    }
  }

  private analyzeCommunicationAnomaly(agent: Agent): CommunicationAnomalyResult {
    // Analyze communication patterns for anomalies
    return {
      riskScore: 0,
      anomalies: [],
      confidence: 0.8,
      recommendation: 'continue_monitoring'
    }
  }

  private analyzeResourceUsageAnomaly(agent: Agent): ResourceUsageAnomalyResult {
    // Analyze resource usage patterns for anomalies
    return {
      riskScore: 0,
      anomalies: [],
      confidence: 0.8,
      recommendation: 'continue_monitoring'
    }
  }

  private calculateRiskScore(threats: DetectedThreat[], anomalies: DetectedAnomaly[]): number {
    let score = 0

    // Weight threats by severity
    for (const threat of threats) {
      switch (threat.severity) {
        case 'low': score += 0.1; break
        case 'medium': score += 0.3; break
        case 'high': score += 0.6; break
        case 'critical': score += 1.0; break
      }
    }

    // Add anomaly scores
    for (const anomaly of anomalies) {
      score += anomaly.severity * 0.5
    }

    return Math.min(score, 1.0)
  }

  private startBehaviorLearning(): void {
    // Initialize behavior learning process
    logger.info('AdvancedThreatDetection', 'Behavior learning started')
  }

  private initializeBehaviorBaseline(agent: Agent): void {
    const baseline: AgentBehaviorBaseline = {
      agentId: agent.id,
      sampleCount: 0,
      firstSeen: Date.now(),
      lastUpdate: Date.now(),
      normalPositionVariance: 0,
      normalStateChangeFrequency: 0,
      normalCommunicationFrequency: 0,
      positions: [],
      states: [],
      communications: []
    }
    
    this.behaviorBaselines.set(agent.id, baseline)
  }

  private checkMovementAnomaly(agent: Agent, baseline: AgentBehaviorBaseline): DetectedAnomaly {
    // Implementation for movement anomaly detection
    return {
      id: 'movement_check',
      type: 'movement',
      isAnomaly: false,
      severity: 0,
      description: 'Movement pattern analysis',
      timestamp: Date.now()
    }
  }

  private checkCommunicationAnomaly(agent: Agent, baseline: AgentBehaviorBaseline): DetectedAnomaly {
    // Implementation for communication anomaly detection
    return {
      id: 'communication_check', 
      type: 'communication',
      isAnomaly: false,
      severity: 0,
      description: 'Communication pattern analysis',
      timestamp: Date.now()
    }
  }

  private calculatePositionVariance(agent: Agent, baseline: AgentBehaviorBaseline): number {
    // Calculate position variance from baseline
    return 0
  }

  private calculateStateChangeFrequency(agent: Agent, baseline: AgentBehaviorBaseline): number {
    // Calculate state change frequency
    return 0
  }

  private generateSecurityRecommendations(riskScore: number): string[] {
    const recommendations: string[] = []
    
    if (riskScore > 0.8) {
      recommendations.push('immediate_investigation_required')
      recommendations.push('isolate_agent')
      recommendations.push('audit_agent_history')
    } else if (riskScore > 0.5) {
      recommendations.push('enhanced_monitoring')
      recommendations.push('review_agent_permissions')
    } else if (riskScore > 0.3) {
      recommendations.push('continue_monitoring')
      recommendations.push('log_activities')
    }
    
    return recommendations
  }

  public getActiveThreatSignatures(): ThreatSignature[] {
    return Array.from(this.signatures.values())
  }

  public dispose(): void {
    this.stop()
    this.signatures.clear()
    this.behaviorBaselines.clear()
    this.networkBaselines.clear()
    this.removeAllListeners()
    logger.info('AdvancedThreatDetection', 'Disposed')
  }
}

// Type definitions
interface AgentBehaviorBaseline {
  agentId: string
  sampleCount: number
  firstSeen: number
  lastUpdate: number
  normalPositionVariance: number
  normalStateChangeFrequency: number
  normalCommunicationFrequency: number
  positions: Array<{ x: number; y: number; z: number; timestamp: number }>
  states: Array<{ state: string; timestamp: number }>
  communications: Array<{ messageCount: number; timestamp: number }>
}

interface NetworkBehaviorBaseline {
  connectionId: string
  normalMessageFrequency: number
  normalMessageSize: number
  normalConnectionDuration: number
  suspiciousPatterns: string[]
}

interface DetectedThreat {
  id: string
  signatureId: string
  name: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  description: string
  timestamp: number
  data: any
  mitigation: string[]
}

interface DetectedAnomaly {
  id: string
  type: string
  isAnomaly: boolean
  severity: number
  description: string
  timestamp: number
}

interface ThreatAnalysisResult {
  threats: DetectedThreat[]
  anomalies: DetectedAnomaly[]
  riskScore: number
}

interface AgentThreatAnalysis {
  agentId: string
  overallRisk: number
  behaviorAnomaly: BehaviorAnomalyResult
  communicationAnomaly: CommunicationAnomalyResult
  resourceUsageAnomaly: ResourceUsageAnomalyResult
  recommendations: string[]
}

interface BehaviorAnomalyResult {
  riskScore: number
  anomalies: string[]
  confidence: number
  recommendation: string
}

interface CommunicationAnomalyResult {
  riskScore: number
  anomalies: string[]
  confidence: number
  recommendation: string
}

interface ResourceUsageAnomalyResult {
  riskScore: number
  anomalies: string[]
  confidence: number
  recommendation: string
}