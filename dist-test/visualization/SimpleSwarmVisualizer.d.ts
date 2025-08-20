import { Scene } from 'three';
import type { Agent, SwarmVisualizationConfig } from '../types';
export declare class SimpleSwarmVisualizer {
    private scene;
    private agentGroup;
    private agentMeshes;
    private config;
    constructor(scene: Scene, config: SwarmVisualizationConfig);
    addAgent(agent: Agent): void;
    updateAgent(agent: Agent): void;
    removeAgent(agentId: string): void;
    updateAgents(agents: Agent[]): void;
    update(): void;
    private getAgentColor;
    getAgentCount(): number;
    dispose(): void;
}
