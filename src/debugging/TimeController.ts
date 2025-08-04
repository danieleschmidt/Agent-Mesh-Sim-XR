import { EventEmitter } from 'eventemitter3'
import type { TimeControlConfig, Agent } from '../types'

interface HistoryFrame {
  timestamp: number
  agents: Map<string, Agent>
  systemState: Record<string, any>
}

export class TimeController extends EventEmitter {
  private config: TimeControlConfig
  private history: HistoryFrame[] = []
  private currentFrame = 0
  private recording = true
  private lastRecordTime = 0

  constructor(config: TimeControlConfig) {
    super()
    this.config = config
    this.startRecording()
  }

  private startRecording(): void {
    const recordInterval = setInterval(() => {
      if (this.recording) {
        this.recordFrame()
      }
    }, this.config.recordInterval * 1000)

    // Clean up old frames
    const cleanupInterval = setInterval(() => {
      this.cleanupOldFrames()
    }, 10000) // Every 10 seconds
  }

  private recordFrame(): void {
    const now = Date.now()
    if (now - this.lastRecordTime < this.config.recordInterval * 1000) {
      return
    }

    const frame: HistoryFrame = {
      timestamp: now,
      agents: new Map(), // Would be populated from current agent state
      systemState: this.captureSystemState()
    }

    this.history.push(frame)
    this.currentFrame = this.history.length - 1
    this.lastRecordTime = now
  }

  private captureSystemState(): Record<string, any> {
    return {
      frameCount: this.history.length,
      timestamp: Date.now(),
      performance: {
        fps: this.estimateFPS(),
        memoryUsage: this.getMemoryUsage()
      }
    }
  }

  private estimateFPS(): number {
    if (this.history.length < 2) return 0
    
    const recent = this.history.slice(-10)
    const timeSpan = recent[recent.length - 1].timestamp - recent[0].timestamp
    return (recent.length - 1) / (timeSpan / 1000)
  }

  private getMemoryUsage(): number {
    if ('memory' in performance) {
      return (performance as any).memory.usedJSHeapSize / 1024 / 1024
    }
    return 0
  }

  private cleanupOldFrames(): void {
    const maxAge = this.config.maxRewind * 1000
    const cutoffTime = Date.now() - maxAge
    
    this.history = this.history.filter(frame => frame.timestamp > cutoffTime)
    
    if (this.currentFrame >= this.history.length) {
      this.currentFrame = Math.max(0, this.history.length - 1)
    }
  }

  rewindTo(timestamp: number): boolean {
    const targetFrame = this.findFrameByTimestamp(timestamp)
    if (targetFrame === -1) {
      return false
    }

    this.currentFrame = targetFrame
    const frame = this.history[targetFrame]
    
    this.emit('rewind', timestamp)
    this.emit('frameChanged', frame)
    
    return true
  }

  rewindFrames(frames: number): boolean {
    const targetFrame = Math.max(0, this.currentFrame - frames)
    
    if (targetFrame === this.currentFrame) {
      return false
    }

    this.currentFrame = targetFrame
    const frame = this.history[targetFrame]
    
    this.emit('rewind', frame.timestamp)
    this.emit('frameChanged', frame)
    
    return true
  }

  fastForward(frames: number): boolean {
    const targetFrame = Math.min(this.history.length - 1, this.currentFrame + frames)
    
    if (targetFrame === this.currentFrame) {
      return false
    }

    this.currentFrame = targetFrame
    const frame = this.history[targetFrame]
    
    this.emit('fastForward', frame.timestamp)
    this.emit('frameChanged', frame)
    
    return true
  }

  pause(): void {
    this.recording = false
    this.emit('paused')
  }

  resume(): void {
    this.recording = true
    this.emit('resumed')
  }

  isRecording(): boolean {
    return this.recording
  }

  getCurrentTimestamp(): number {
    if (this.history.length === 0) return Date.now()
    return this.history[this.currentFrame].timestamp
  }

  getTimeRange(): { start: number; end: number } {
    if (this.history.length === 0) {
      const now = Date.now()
      return { start: now, end: now }
    }
    
    return {
      start: this.history[0].timestamp,
      end: this.history[this.history.length - 1].timestamp
    }
  }

  private findFrameByTimestamp(timestamp: number): number {
    let closest = -1
    let minDiff = Infinity
    
    for (let i = 0; i < this.history.length; i++) {
      const diff = Math.abs(this.history[i].timestamp - timestamp)
      if (diff < minDiff) {
        minDiff = diff
        closest = i
      }
    }
    
    return closest
  }

  update(): void {
    if (this.recording) {
      this.recordFrame()
    }
  }

  getHistoryLength(): number {
    return this.history.length
  }

  getCurrentFrame(): HistoryFrame | null {
    if (this.currentFrame < 0 || this.currentFrame >= this.history.length) {
      return null
    }
    return this.history[this.currentFrame]
  }

  dispose(): void {
    this.recording = false
    this.history = []
    this.removeAllListeners()
  }
}