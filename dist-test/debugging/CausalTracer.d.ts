import { EventEmitter } from 'eventemitter3';
import type { CausalEvent } from '../types';
interface CausalChain {
    rootEvent: CausalEvent;
    events: CausalEvent[];
    affectedAgents: string[];
    depth: number;
}
interface CausalTracerConfig {
    maxHistorySize: number;
    trackMessages: boolean;
    trackStateChanges: boolean;
    trackDecisions: boolean;
}
export declare class CausalTracer extends EventEmitter {
    private config;
    private eventHistory;
    private causalGraph;
    private eventIndex;
    constructor(config: CausalTracerConfig);
    recordEvent(event: CausalEvent): void;
    traceCausality(options: {
        agent: string;
        state?: string;
        timestamp?: number;
        maxDepth: number;
    }): CausalChain;
    private findRootEvents;
    private traverseCausalChain;
    private extractAffectedAgents;
    private calculateMaxDepth;
    private createSyntheticEvent;
    recordMessage(from: string, to: string, content: any): void;
    recordStateChange(agentId: string, oldState: any, newState: any, causedBy?: string[]): void;
    recordDecision(agentId: string, decision: any, factors: any[], causedBy?: string[]): void;
    getActiveChains(timestamp: number, timeWindow?: number): {
        events: CausalEvent[];
        affectedAgents: string[];
        messages: CausalEvent[];
    };
    visualizeCausalChain(chain: CausalChain, options: {
        layout: 'force-directed' | 'hierarchical' | 'timeline';
        showTimestamps: boolean;
        animateFlow: boolean;
        colors: Record<string, number>;
    }): any;
    private buildEdges;
    getEventHistory(): CausalEvent[];
    clearHistory(): void;
}
export {};
