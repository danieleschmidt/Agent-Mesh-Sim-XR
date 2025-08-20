import type { Agent, NetworkConfig, XRSessionConfig } from '../types';
export declare class ValidationError extends Error {
    field?: string;
    value?: any;
    constructor(message: string, field?: string, value?: any);
}
export declare class Validator {
    static validateAgent(agent: any): agent is Agent;
    static validateAgentUpdate(update: any): boolean;
    static validateNetworkConfig(config: any): config is NetworkConfig;
    static validateXRSessionConfig(config: any): config is XRSessionConfig;
    static sanitizeString(input: string, maxLength?: number): string;
    static sanitizeAgentData(agent: any): Agent;
    private static isValidVector3;
    private static isValidAgentState;
    private static isValidMetrics;
    private static sanitizeObject;
    static validateWebSocketURL(url: string): boolean;
    static rateLimitCheck(identifier: string, maxRequests?: number, windowMs?: number): boolean;
}
