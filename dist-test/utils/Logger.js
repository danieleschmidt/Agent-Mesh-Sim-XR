"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.Logger = exports.LogLevel = void 0;
var LogLevel;
(function (LogLevel) {
    LogLevel[LogLevel["ERROR"] = 0] = "ERROR";
    LogLevel[LogLevel["WARN"] = 1] = "WARN";
    LogLevel[LogLevel["INFO"] = 2] = "INFO";
    LogLevel[LogLevel["DEBUG"] = 3] = "DEBUG";
})(LogLevel || (exports.LogLevel = LogLevel = {}));
class Logger {
    static instance;
    logLevel = LogLevel.INFO;
    logs = [];
    maxLogs = 1000;
    listeners = [];
    constructor() { }
    static getInstance() {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }
    setLogLevel(level) {
        this.logLevel = level;
    }
    addListener(callback) {
        this.listeners.push(callback);
    }
    removeListener(callback) {
        const index = this.listeners.indexOf(callback);
        if (index > -1) {
            this.listeners.splice(index, 1);
        }
    }
    log(level, module, message, data, error) {
        if (level > this.logLevel)
            return;
        const entry = {
            timestamp: Date.now(),
            level,
            module,
            message,
            data,
            error
        };
        this.logs.push(entry);
        // Maintain log size limit
        if (this.logs.length > this.maxLogs) {
            this.logs.shift();
        }
        // Notify listeners
        this.listeners.forEach(listener => {
            try {
                listener(entry);
            }
            catch (err) {
                console.error('Logger listener error:', err);
            }
        });
        // Console output
        const levelStr = LogLevel[level];
        const timestamp = new Date(entry.timestamp).toISOString();
        const prefix = `[${timestamp}] [${levelStr}] [${module}]`;
        switch (level) {
            case LogLevel.ERROR:
                console.error(prefix, message, data, error);
                break;
            case LogLevel.WARN:
                console.warn(prefix, message, data);
                break;
            case LogLevel.INFO:
                console.info(prefix, message, data);
                break;
            case LogLevel.DEBUG:
                console.debug(prefix, message, data);
                break;
        }
    }
    error(module, message, errorOrData, data) {
        if (typeof message === 'object') {
            this.log(LogLevel.ERROR, module, JSON.stringify(message), errorOrData);
        }
        else {
            this.log(LogLevel.ERROR, module, message, data, errorOrData);
        }
    }
    warn(module, message, data) {
        if (typeof message === 'object') {
            this.log(LogLevel.WARN, module, JSON.stringify(message), data);
        }
        else {
            this.log(LogLevel.WARN, module, message, data);
        }
    }
    info(module, message, data) {
        if (typeof message === 'object') {
            this.log(LogLevel.INFO, module, JSON.stringify(message), data);
        }
        else {
            this.log(LogLevel.INFO, module, message, data);
        }
    }
    debug(module, message, data) {
        this.log(LogLevel.DEBUG, module, message, data);
    }
    getLogs(filter) {
        let filtered = [...this.logs];
        if (filter) {
            if (filter.level !== undefined) {
                filtered = filtered.filter(log => log.level <= filter.level);
            }
            if (filter.module) {
                filtered = filtered.filter(log => log.module === filter.module);
            }
            if (filter.since) {
                filtered = filtered.filter(log => log.timestamp >= filter.since);
            }
        }
        return filtered;
    }
    clearLogs() {
        this.logs = [];
    }
    exportLogs() {
        return JSON.stringify(this.logs, null, 2);
    }
}
exports.Logger = Logger;
exports.logger = Logger.getInstance();
