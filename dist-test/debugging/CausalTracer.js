"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CausalTracer = void 0;
const eventemitter3_1 = require("eventemitter3");
class CausalTracer extends eventemitter3_1.EventEmitter {
    config;
    eventHistory = [];
    causalGraph = new Map();
    eventIndex = new Map();
    constructor(config) {
        super();
        this.config = config;
    }
    recordEvent(event) {
        // Add to history
        this.eventHistory.push(event);
        this.eventIndex.set(event.id, event);
        // Maintain history size limit
        if (this.eventHistory.length > this.config.maxHistorySize) {
            const removed = this.eventHistory.shift();
            this.eventIndex.delete(removed.id);
            this.causalGraph.delete(removed.id);
        }
        // Update causal graph
        if (event.causedBy && event.causedBy.length > 0) {
            event.causedBy.forEach(causeId => {
                if (!this.causalGraph.has(causeId)) {
                    this.causalGraph.set(causeId, []);
                }
                this.causalGraph.get(causeId).push(event.id);
            });
        }
        this.emit('eventRecorded', event);
    }
    traceCausality(options) {
        const rootEvents = this.findRootEvents(options);
        if (rootEvents.length === 0) {
            return {
                rootEvent: this.createSyntheticEvent(options.agent),
                events: [],
                affectedAgents: [options.agent],
                depth: 0
            };
        }
        // Use the most recent root event
        const rootEvent = rootEvents[rootEvents.length - 1];
        const allEvents = this.traverseCausalChain(rootEvent.id, options.maxDepth);
        const affectedAgents = this.extractAffectedAgents(allEvents);
        return {
            rootEvent,
            events: allEvents,
            affectedAgents,
            depth: this.calculateMaxDepth(allEvents)
        };
    }
    findRootEvents(options) {
        return this.eventHistory.filter(event => {
            if (event.agentId !== options.agent)
                return false;
            if (options.state) {
                if (event.type !== 'stateChange')
                    return false;
                if (event.data.newState !== options.state)
                    return false;
            }
            if (options.timestamp) {
                const timeDiff = Math.abs(event.timestamp - options.timestamp);
                if (timeDiff > 5000)
                    return false; // Within 5 seconds
            }
            return true;
        });
    }
    traverseCausalChain(eventId, maxDepth, visited = new Set()) {
        if (visited.has(eventId) || maxDepth <= 0) {
            return [];
        }
        visited.add(eventId);
        const event = this.eventIndex.get(eventId);
        if (!event)
            return [];
        const chain = [event];
        // Find events caused by this event
        const causedEvents = this.causalGraph.get(eventId) || [];
        for (const causedEventId of causedEvents) {
            const subChain = this.traverseCausalChain(causedEventId, maxDepth - 1, visited);
            chain.push(...subChain);
        }
        // Also trace backwards to find causes
        if (event.causedBy) {
            for (const causeId of event.causedBy) {
                const causeChain = this.traverseCausalChain(causeId, maxDepth - 1, visited);
                chain.unshift(...causeChain);
            }
        }
        return chain;
    }
    extractAffectedAgents(events) {
        const agents = new Set();
        events.forEach(event => agents.add(event.agentId));
        return Array.from(agents);
    }
    calculateMaxDepth(events) {
        // Simple depth calculation based on causality chains
        let maxDepth = 0;
        const visited = new Set();
        const calculateDepth = (eventId, currentDepth = 0) => {
            if (visited.has(eventId))
                return currentDepth;
            visited.add(eventId);
            const causedEvents = this.causalGraph.get(eventId) || [];
            let depth = currentDepth;
            for (const causedId of causedEvents) {
                depth = Math.max(depth, calculateDepth(causedId, currentDepth + 1));
            }
            return depth;
        };
        events.forEach(event => {
            maxDepth = Math.max(maxDepth, calculateDepth(event.id));
        });
        return maxDepth;
    }
    createSyntheticEvent(agentId) {
        return {
            id: `synthetic-${Date.now()}`,
            timestamp: Date.now(),
            type: 'stateChange',
            agentId,
            data: { synthetic: true }
        };
    }
    recordMessage(from, to, content) {
        if (!this.config.trackMessages)
            return;
        const event = {
            id: `msg-${Date.now()}-${Math.random()}`,
            timestamp: Date.now(),
            type: 'message',
            agentId: from,
            data: {
                recipient: to,
                content,
                messageType: 'communication'
            }
        };
        this.recordEvent(event);
    }
    recordStateChange(agentId, oldState, newState, causedBy) {
        if (!this.config.trackStateChanges)
            return;
        const event = {
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
        };
        this.recordEvent(event);
    }
    recordDecision(agentId, decision, factors, causedBy) {
        if (!this.config.trackDecisions)
            return;
        const event = {
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
        };
        this.recordEvent(event);
    }
    getActiveChains(timestamp, timeWindow = 1000) {
        const activeEvents = this.eventHistory.filter(event => Math.abs(event.timestamp - timestamp) <= timeWindow);
        const messages = activeEvents.filter(event => event.type === 'message');
        const affectedAgents = this.extractAffectedAgents(activeEvents);
        return {
            events: activeEvents,
            affectedAgents,
            messages
        };
    }
    visualizeCausalChain(chain, options) {
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
        };
        return visualization;
    }
    buildEdges(events) {
        const edges = [];
        events.forEach(event => {
            if (event.causedBy) {
                event.causedBy.forEach(causeId => {
                    edges.push({ from: causeId, to: event.id });
                });
            }
        });
        return edges;
    }
    getEventHistory() {
        return [...this.eventHistory];
    }
    clearHistory() {
        this.eventHistory = [];
        this.causalGraph.clear();
        this.eventIndex.clear();
        this.emit('historyCleared');
    }
}
exports.CausalTracer = CausalTracer;
