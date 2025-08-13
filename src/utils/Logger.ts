export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3
}

interface LogEntry {
  timestamp: number
  level: LogLevel
  module: string
  message: string
  data?: any
  error?: Error
}

export class Logger {
  private static instance: Logger
  private logLevel: LogLevel = LogLevel.INFO
  private logs: LogEntry[] = []
  private maxLogs = 1000
  private listeners: ((entry: LogEntry) => void)[] = []

  private constructor() {}

  static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger()
    }
    return Logger.instance
  }

  setLogLevel(level: LogLevel): void {
    this.logLevel = level
  }

  addListener(callback: (entry: LogEntry) => void): void {
    this.listeners.push(callback)
  }

  removeListener(callback: (entry: LogEntry) => void): void {
    const index = this.listeners.indexOf(callback)
    if (index > -1) {
      this.listeners.splice(index, 1)
    }
  }

  private log(level: LogLevel, module: string, message: string, data?: any, error?: Error): void {
    if (level > this.logLevel) return

    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      module,
      message,
      data,
      error
    }

    this.logs.push(entry)
    
    // Maintain log size limit
    if (this.logs.length > this.maxLogs) {
      this.logs.shift()
    }

    // Notify listeners
    this.listeners.forEach(listener => {
      try {
        listener(entry)
      } catch (err) {
        console.error('Logger listener error:', err)
      }
    })

    // Console output
    const levelStr = LogLevel[level]
    const timestamp = new Date(entry.timestamp).toISOString()
    const prefix = `[${timestamp}] [${levelStr}] [${module}]`
    
    switch (level) {
      case LogLevel.ERROR:
        console.error(prefix, message, data, error)
        break
      case LogLevel.WARN:
        console.warn(prefix, message, data)
        break
      case LogLevel.INFO:
        console.info(prefix, message, data)
        break
      case LogLevel.DEBUG:
        console.debug(prefix, message, data)
        break
    }
  }

  error(module: string, message: string, error?: Error, data?: any): void
  error(module: string, message: any, data?: any): void
  error(module: string, message: string | any, errorOrData?: Error | any, data?: any): void {
    if (typeof message === 'object') {
      this.log(LogLevel.ERROR, module, JSON.stringify(message), errorOrData)
    } else {
      this.log(LogLevel.ERROR, module, message, data, errorOrData as Error)
    }
  }

  warn(module: string, message: string, data?: any): void
  warn(module: string, message: any, data?: any): void
  warn(module: string, message: string | any, data?: any): void {
    if (typeof message === 'object') {
      this.log(LogLevel.WARN, module, JSON.stringify(message), data)
    } else {
      this.log(LogLevel.WARN, module, message, data)
    }
  }

  info(module: string, message: string, data?: any): void
  info(module: string, message: any, data?: any): void
  info(module: string, message: string | any, data?: any): void {
    if (typeof message === 'object') {
      this.log(LogLevel.INFO, module, JSON.stringify(message), data)
    } else {
      this.log(LogLevel.INFO, module, message, data)
    }
  }

  debug(module: string, message: string, data?: any): void {
    this.log(LogLevel.DEBUG, module, message, data)
  }

  getLogs(filter?: {
    level?: LogLevel
    module?: string
    since?: number
  }): LogEntry[] {
    let filtered = [...this.logs]

    if (filter) {
      if (filter.level !== undefined) {
        filtered = filtered.filter(log => log.level <= filter.level!)
      }
      if (filter.module) {
        filtered = filtered.filter(log => log.module === filter.module)
      }
      if (filter.since) {
        filtered = filtered.filter(log => log.timestamp >= filter.since!)
      }
    }

    return filtered
  }

  clearLogs(): void {
    this.logs = []
  }

  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2)
  }
}

export const logger = Logger.getInstance()