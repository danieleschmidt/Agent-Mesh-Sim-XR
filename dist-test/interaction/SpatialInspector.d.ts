import { EventEmitter } from 'eventemitter3';
import { Group, Vector3 } from 'three';
import type { Agent } from '../types';
interface SpatialInspectorConfig {
    followUser: boolean;
    anchorDistance: number;
    autoHide: boolean;
    maxPanels: number;
}
export declare class SpatialInspector extends EventEmitter {
    private config;
    private panels;
    private mainGroup;
    private userPosition;
    private selectedAgent;
    constructor(config?: Partial<SpatialInspectorConfig>);
    private setupUpdateLoop;
    inspectAgent(agent: Agent): void;
    private createAgentPanel;
    private renderPanelContent;
    addSection(agentId: string, sectionName: string, data: any): void;
    updateAgent(agent: Agent): void;
    closePanel(agentId: string): void;
    closeAllPanels(): void;
    showPanel(agentId: string): void;
    hidePanel(agentId: string): void;
    setUserPosition(position: Vector3): void;
    private updatePanelPositions;
    getSelectedAgent(): Agent | null;
    getPanelCount(): number;
    getMainGroup(): Group;
    setVisible(visible: boolean): void;
    isVisible(): boolean;
    handleControllerSelect(controllerPosition: Vector3, agentGetter: (position: Vector3) => Agent | null): void;
    handleRaycast(origin: Vector3, direction: Vector3, agentGetter: (origin: Vector3, direction: Vector3) => Agent | null): void;
    cyclePanels(): void;
    resize(scale: number): void;
    dispose(): void;
}
export {};
