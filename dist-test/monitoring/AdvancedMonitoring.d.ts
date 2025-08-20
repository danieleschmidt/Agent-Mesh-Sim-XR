import { EventEmitter } from 'eventemitter3';
import type { Agent } from '../types';
export interface MetricConfig {
    id: string;
    name: string;
    description: string;
    unit: string;
    type: 'counter' | 'gauge' | 'histogram' | 'summary';
    tags?: Record<string, string>;
    thresholds?: {
        warning?: number;
        critical?: number;
        info?: number;
    };
}
export interface AlertRule {
    id: string;
    name: string;
    description: string;
    metricId: string;
    condition: 'greater_than' | 'less_than' | 'equals' | 'not_equals' | 'change_rate';
    threshold: number;
    duration: number;
    severity: 'low' | 'medium' | 'high' | 'critical';
    enabled: boolean;
    actions: AlertAction[];
}
export interface AlertAction {
    type: 'log' | 'email' | 'webhook' | 'slack' | 'auto_recovery';
    config: Record<string, any>;
}
export interface Alert {
    id: string;
    ruleId: string;
    ruleName: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    message: string;
    timestamp: number;
    value: number;
    threshold: number;
    status: 'active' | 'resolved' | 'acknowledged';
    tags: Record<string, string>;
}
export declare class AdvancedMonitoring extends EventEmitter {
    private metrics;
    private metricConfigs;
    private alertRules;
    private activeAlerts;
    private alertHistory;
    private collectionInterval;
    private alertEvaluationInterval;
    private isRunning;
    constructor(config?: {
        collectionInterval?: number;
        alertEvaluationInterval?: number;
    });
    private initializeDefaultMetrics;
    defineMetric(config: MetricConfig): void;
    recordMetric(id: string, value: number, tags?: Record<string, string>): void;
    incrementCounter(id: string, amount?: number, tags?: Record<string, string>): void;
    setGauge(id: string, value: number, tags?: Record<string, string>): void;
    getMetric(id: string): MetricSnapshot | null;
    getAllMetrics(): Record<string, MetricSnapshot>;
    addAlertRule(rule: AlertRule): void;
    removeAlertRule(id: string): void;
    enableAlertRule(id: string): void;
    disableAlertRule(id: string): void;
    private evaluateAlerts;
    private evaluateCondition;
    private generateAlertMessage;
    private executeAlertActions;
    private executeAction;
    acknowledgeAlert(alertId: string): void;
    getActiveAlerts(): Alert[];
    getAlertHistory(limit?: number): Alert[];
    collectSystemMetrics(): void;
    collectAgentMetrics(agents: Agent[]): void;
    collectNetworkMetrics(latency: number, messageRate: number, errors: number): void;
    collectXRMetrics(sessionActive: boolean, trackingQuality: number): void;
    private getCpuUsage;
    private getMemoryUsage;
    start(): void;
    stop(): void;
    getHealth(): HealthStatus;
    private startTime;
    dispose(): void;
}
interface MetricSnapshot {
    config: MetricConfig;
    currentValue: number;
    sampleCount: number;
    min: number;
    max: number;
    average: number;
    lastUpdated: number;
    tags?: Record<string, string>;
}
interface HealthStatus {
    status: 'healthy' | 'warning' | 'critical';
    totalMetrics: number;
    activeAlerts: number;
    criticalAlerts: number;
    isRunning: boolean;
    uptime: number;
}
export {};
