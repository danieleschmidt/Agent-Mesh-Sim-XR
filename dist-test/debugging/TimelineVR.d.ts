import { EventEmitter } from 'eventemitter3';
import { Group, Vector3 } from 'three';
import type { CausalEvent } from '../types';
interface TimelineVRConfig {
    length: number;
    height: number;
    position: Vector3;
    timeRange?: {
        start: number;
        end: number;
    };
}
export declare class TimelineVR extends EventEmitter {
    private config;
    private group;
    private timelineBar;
    private events;
    private currentTimeMarker;
    private timeRange;
    constructor(config: TimelineVRConfig);
    private createTimelineBar;
    private createTimeScaleMarkers;
    private createTimeMarker;
    addEvents(events: CausalEvent[]): void;
    addEvent(event: CausalEvent): void;
    private createEventMesh;
    private getEventSize;
    private getEventColor;
    private timestampToPosition;
    private positionToTimestamp;
    focusOn(timestamp: number): void;
    private updateTimeMarkerPosition;
    onScrub(callback: (timestamp: number) => void): void;
    handleControllerInteraction(controllerPosition: Vector3): void;
    handleControllerEnd(): void;
    setTimeRange(start: number, end: number): void;
    rewind(seconds: number): void;
    fastForward(seconds: number): void;
    getCurrentTime(): number;
    highlightEventsByAgent(agentId: string): void;
    highlightEventsByType(eventType: string): void;
    clearHighlights(): void;
    private clearEvents;
    getGroup(): Group;
    getEventsInTimeRange(start: number, end: number): CausalEvent[];
    dispose(): void;
}
export {};
