import { EventEmitter } from 'eventemitter3'
import type { CausalEvent } from '../types'

interface CausalChain {
  rootEvent: CausalEvent
  events: CausalEvent[]
  affectedAgents: string[]
  depth: number
}

interface CausalTracerConfig {
  maxHistorySize: number
  trackMessages: boolean
  trackStateChanges: boolean
  trackDecisions: boolean
}

export class CausalTracer extends EventEmitter {
  private config: CausalTracerConfig
  private eventHistory: CausalEvent[] = []
  private causalGraph: Map<string, string[]> = new Map()
  private eventIndex: Map<string, CausalEvent> = new Map()

  constructor(config: CausalTracerConfig) {
    super()
    this.config = config
  }

  recordEvent(event: CausalEvent): void {
    // Add to history
    this.eventHistory.push(event)
    this.eventIndex.set(event.id, event)

    // Maintain history size limit
    if (this.eventHistory.length > this.config.maxHistorySize) {
      const removed = this.eventHistory.shift()!
      this.eventIndex.delete(removed.id)
      this.causalGraph.delete(removed.id)
    }

    // Update causal graph
    if (event.causedBy && event.causedBy.length > 0) {
      event.causedBy.forEach(causeId => {
        if (!this.causalGraph.has(causeId)) {
          this.causalGraph.set(causeId, [])
        }
        this.causalGraph.get(causeId)!.push(event.id)
      })
    }

    this.emit('eventRecorded', event)
  }

  traceCausality(options: {
    agent: string
    state?: string
    timestamp?: number
    maxDepth: number
  }): CausalChain {
    const rootEvents = this.findRootEvents(options)
    
    if (rootEvents.length === 0) {
      return {
        rootEvent: this.createSyntheticEvent(options.agent),
        events: [],
        affectedAgents: [options.agent],
        depth: 0
      }
    }

    // Use the most recent root event
    const rootEvent = rootEvents[rootEvents.length - 1]
    const allEvents = this.traverseCausalChain(rootEvent.id, options.maxDepth)
    const affectedAgents = this.extractAffectedAgents(allEvents)

    return {
      rootEvent,
      events: allEvents,
      affectedAgents,
      depth: this.calculateMaxDepth(allEvents)
    }
  }

  private findRootEvents(options: {
    agent: string
    state?: string
    timestamp?: number
  }): CausalEvent[] {
    return this.eventHistory.filter(event => {
      if (event.agentId !== options.agent) return false
      
      if (options.state) {
        if (event.type !== 'stateChange') return false
        if (event.data.newState !== options.state) return false
      }
      
      if (options.timestamp) {
        const timeDiff = Math.abs(event.timestamp - options.timestamp)
        if (timeDiff > 5000) return false // Within 5 seconds
      }
      
      return true
    })
  }

  private traverseCausalChain(eventId: string, maxDepth: number, visited = new Set<string>()): CausalEvent[] {
    if (visited.has(eventId) || maxDepth <= 0) {
      return []
    }

    visited.add(eventId)
    const event = this.eventIndex.get(eventId)
    if (!event) return []

    const chain = [event]
    
    // Find events caused by this event
    const causedEvents = this.causalGraph.get(eventId) || []
    
    for (const causedEventId of causedEvents) {
      const subChain = this.traverseCausalChain(causedEventId, maxDepth - 1, visited)
      chain.push(...subChain)
    }

    // Also trace backwards to find causes
    if (event.causedBy) {
      for (const causeId of event.causedBy) {
        const causeChain = this.traverseCausalChain(causeId, maxDepth - 1, visited)
        chain.unshift(...causeChain)
      }
    }

    return chain
  }

  private extractAffectedAgents(events: CausalEvent[]): string[] {
    const agents = new Set<string>()
    events.forEach(event => agents.add(event.agentId))
    return Array.from(agents)
  }

  private calculateMaxDepth(events: CausalEvent[]): number {
    // Simple depth calculation based on causality chains
    let maxDepth = 0
    const visited = new Set<string>()
    
    const calculateDepth = (eventId: string, currentDepth = 0): number => {
      if (visited.has(eventId)) return currentDepth
      visited.add(eventId)
      
      const causedEvents = this.causalGraph.get(eventId) || []
      let depth = currentDepth
      
      for (const causedId of causedEvents) {
        depth = Math.max(depth, calculateDepth(causedId, currentDepth + 1))
      }
      
      return depth
    }
    
    events.forEach(event => {
      maxDepth = Math.max(maxDepth, calculateDepth(event.id))
    })
    
    return maxDepth
  }

  private createSyntheticEvent(agentId: string): CausalEvent {
    return {
      id: `synthetic-${Date.now()}`,
      timestamp: Date.now(),
      type: 'stateChange',
      agentId,
      data: { synthetic: true }
    }
  }

  recordMessage(from: string, to: string, content: any): void {
    if (!this.config.trackMessages) return

    const event: CausalEvent = {
      id: `msg-${Date.now()}-${Math.random()}`,
      timestamp: Date.now(),
      type: 'message',
      agentId: from,
      data: {
        recipient: to,
        content,
        messageType: 'communication'
      }
    }

    this.recordEvent(event)
  }

  recordStateChange(agentId: string, oldState: any, newState: any, causedBy?: string[]): void {
    if (!this.config.trackStateChanges) return

    const event: CausalEvent = {
      id: `state-${Date.now()}-${agentId}`,
      timestamp: Date.now(),
      type: 'stateChange',
      agentId,
      causedBy,
      data: {
        oldState,
        newState,
        changeType: 'stateTransition'
      }
    }

    this.recordEvent(event)
  }

  recordDecision(agentId: string, decision: any, factors: any[], causedBy?: string[]): void {
    if (!this.config.trackDecisions) return

    const event: CausalEvent = {
      id: `decision-${Date.now()}-${agentId}`,
      timestamp: Date.now(),
      type: 'decision',
      agentId,
      causedBy,
      data: {
        decision,
        factors,
        decisionType: 'agentChoice'
      }
    }

    this.recordEvent(event)
  }

  getActiveChains(timestamp: number, timeWindow = 1000): { 
    events: CausalEvent[]
    affectedAgents: string[]
    messages: CausalEvent[]
  } {
    const activeEvents = this.eventHistory.filter(event => 
      Math.abs(event.timestamp - timestamp) <= timeWindow
    )

    const messages = activeEvents.filter(event => event.type === 'message')
    const affectedAgents = this.extractAffectedAgents(activeEvents)

    return {
      events: activeEvents,
      affectedAgents,
      messages
    }
  }

  visualizeCausalChain(chain: CausalChain, options: {
    layout: 'force-directed' | 'hierarchical' | 'timeline'
    showTimestamps: boolean
    animateFlow: boolean
    colors: Record<string, number>
  }): any {
    // This would return Three.js objects for visualization
    // Implementation would depend on the chosen 3D library
    
    const visualization = {
      type: 'causal-graph',
      events: chain.events,
      layout: options.layout,
      nodes: chain.events.map(event => ({
        id: event.id,
        type: event.type,
        agentId: event.agentId,
        timestamp: event.timestamp,
        color: options.colors[event.type] || 0x666666
      })),
      edges: this.buildEdges(chain.events)
    }

    return visualization
  }

  private buildEdges(events: CausalEvent[]): Array<{ from: string, to: string }> {
    const edges: Array<{ from: string, to: string }> = []
    
    events.forEach(event => {
      if (event.causedBy) {
        event.causedBy.forEach(causeId => {
          edges.push({ from: causeId, to: event.id })
        })
      }
    })

    return edges
  }

  getEventHistory(): CausalEvent[] {
    return [...this.eventHistory]
  }

  clearHistory(): void {
    this.eventHistory = []
    this.causalGraph.clear()
    this.eventIndex.clear()
    this.emit('historyCleared')
  }
}