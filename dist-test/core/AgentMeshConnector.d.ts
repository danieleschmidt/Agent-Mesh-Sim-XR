import { EventEmitter } from 'eventemitter3';
import type { NetworkConfig } from '../types';
export declare class AgentMeshConnector extends EventEmitter {
    private ws;
    private config;
    private reconnectTimer;
    private heartbeatTimer;
    private reconnectAttempts;
    private isConnected;
    constructor(config?: NetworkConfig);
    connect(endpoint: string): Promise<void>;
    disconnect(): void;
    sendMessage(type: string, data: any): void;
    private handleMessage;
    private handleAgentUpdate;
    private normalizeAgent;
    private startHeartbeat;
    private stopHeartbeat;
    private attemptReconnect;
    private stopReconnect;
    reconnect(): Promise<void>;
    getConnectionStatus(): boolean;
}
