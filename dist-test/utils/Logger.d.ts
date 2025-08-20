export declare enum LogLevel {
    ERROR = 0,
    WARN = 1,
    INFO = 2,
    DEBUG = 3
}
interface LogEntry {
    timestamp: number;
    level: LogLevel;
    module: string;
    message: string;
    data?: unknown;
    error?: Error;
}
export declare class Logger {
    private static instance;
    private logLevel;
    private logs;
    private maxLogs;
    private listeners;
    private constructor();
    static getInstance(): Logger;
    setLogLevel(level: LogLevel): void;
    addListener(callback: (entry: LogEntry) => void): void;
    removeListener(callback: (entry: LogEntry) => void): void;
    private log;
    error(module: string, message: string | unknown, errorOrData?: Error | unknown, data?: unknown): void;
    warn(module: string, message: string | unknown, data?: unknown): void;
    info(module: string, message: string | unknown, data?: unknown): void;
    debug(module: string, message: string, data?: unknown): void;
    getLogs(filter?: {
        level?: LogLevel;
        module?: string;
        since?: number;
    }): LogEntry[];
    clearLogs(): void;
    exportLogs(): string;
}
export declare const logger: Logger;
export {};
