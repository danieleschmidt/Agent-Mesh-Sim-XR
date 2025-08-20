import { EventEmitter } from 'eventemitter3';
import type { TimeControlConfig, Agent } from '../types';
interface HistoryFrame {
    timestamp: number;
    agents: Map<string, Agent>;
    systemState: Record<string, any>;
}
export declare class TimeController extends EventEmitter {
    private config;
    private history;
    private currentFrame;
    private recording;
    private lastRecordTime;
    private recordInterval?;
    private cleanupInterval?;
    constructor(config: TimeControlConfig);
    private startRecording;
    private recordFrame;
    private captureSystemState;
    private estimateFPS;
    private getMemoryUsage;
    private cleanupOldFrames;
    rewindTo(timestamp: number): boolean;
    rewindFrames(frames: number): boolean;
    fastForward(frames: number): boolean;
    pause(): void;
    resume(): void;
    isRecording(): boolean;
    getCurrentTimestamp(): number;
    getTimeRange(): {
        start: number;
        end: number;
    };
    private findFrameByTimestamp;
    update(): void;
    getHistoryLength(): number;
    getCurrentFrame(): HistoryFrame | null;
    dispose(): void;
}
export {};
