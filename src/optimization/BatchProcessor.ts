import { EventEmitter } from 'eventemitter3'
import type { Agent } from '../types'

export interface BatchConfig {
  maxBatchSize: number
  flushInterval: number // ms
  maxWaitTime: number // ms
  processingConcurrency: number
}

export interface BatchItem<T = any> {
  id: string
  data: T
  timestamp: number
  priority: number
  callback?: (result: any, error?: Error) => void
}

export interface ProcessingResult<T = any> {
  batchId: string
  items: BatchItem<T>[]
  results: any[]
  errors: Error[]
  processingTime: number
  timestamp: number
}

export class BatchProcessor<T = any> extends EventEmitter {
  private config: BatchConfig
  private pendingItems: BatchItem<T>[] = []
  private processingBatches: Map<string, Promise<ProcessingResult<T>>> = new Map()
  private flushTimer: NodeJS.Timeout | null = null
  private processor: (items: BatchItem<T>[]) => Promise<any[]>
  private batchCounter = 0
  private stats = {
    totalBatches: 0,
    totalItems: 0,
    averageBatchSize: 0,
    averageProcessingTime: 0,
    errors: 0
  }

  constructor(
    processor: (items: BatchItem<T>[]) => Promise<any[]>,
    config: BatchConfig
  ) {
    super()
    this.processor = processor
    this.config = config

    this.startFlushTimer()
  }

  add(
    data: T,
    options: {
      id?: string
      priority?: number
      callback?: (result: any, error?: Error) => void
    } = {}
  ): string {
    const item: BatchItem<T> = {
      id: options.id || this.generateId(),
      data,
      timestamp: Date.now(),
      priority: options.priority || 0,
      callback: options.callback
    }

    // Insert in priority order (higher priority first)
    const insertIndex = this.pendingItems.findIndex(
      existing => existing.priority < item.priority
    )
    
    if (insertIndex === -1) {
      this.pendingItems.push(item)
    } else {
      this.pendingItems.splice(insertIndex, 0, item)
    }

    this.emit('itemAdded', item)

    // Flush if batch is full
    if (this.pendingItems.length >= this.config.maxBatchSize) {
      this.flush()
    }

    // Flush if oldest item is too old
    const oldestItem = this.pendingItems[this.pendingItems.length - 1]
    if (oldestItem && (Date.now() - oldestItem.timestamp) > this.config.maxWaitTime) {
      this.flush()
    }

    return item.id
  }

  flush(): Promise<ProcessingResult<T> | null> {
    if (this.pendingItems.length === 0) {
      return Promise.resolve(null)
    }

    // Check concurrency limit
    if (this.processingBatches.size >= this.config.processingConcurrency) {
      this.emit('concurrencyLimitReached', {
        currentBatches: this.processingBatches.size,
        limit: this.config.processingConcurrency
      })
      return Promise.resolve(null)
    }

    const batchId = this.generateBatchId()
    const items = this.pendingItems.splice(0, this.config.maxBatchSize)
    
    const batchPromise = this.processBatch(batchId, items)
    this.processingBatches.set(batchId, batchPromise)

    // Clean up when done
    batchPromise.finally(() => {
      this.processingBatches.delete(batchId)
    })

    this.emit('batchCreated', { batchId, itemCount: items.length })
    return batchPromise
  }

  private async processBatch(batchId: string, items: BatchItem<T>[]): Promise<ProcessingResult<T>> {
    const startTime = performance.now()
    
    try {
      this.emit('batchProcessingStarted', { batchId, items })

      const results = await this.processor(items)
      const processingTime = performance.now() - startTime

      const result: ProcessingResult<T> = {
        batchId,
        items,
        results,
        errors: [],
        processingTime,
        timestamp: Date.now()
      }

      // Call individual callbacks
      items.forEach((item, index) => {
        if (item.callback) {
          try {
            item.callback(results[index])
          } catch (callbackError) {
            result.errors.push(callbackError as Error)
          }
        }
      })

      this.updateStats(result)
      this.emit('batchProcessed', result)
      
      return result

    } catch (error) {
      const processingTime = performance.now() - startTime
      const result: ProcessingResult<T> = {
        batchId,
        items,
        results: [],
        errors: [error as Error],
        processingTime,
        timestamp: Date.now()
      }

      // Call callbacks with error
      items.forEach(item => {
        if (item.callback) {
          try {
            item.callback(null, error as Error)
          } catch (callbackError) {
            result.errors.push(callbackError as Error)
          }
        }
      })

      this.updateStats(result)
      this.emit('batchError', result)
      
      return result
    }
  }

  private updateStats(result: ProcessingResult<T>): void {
    this.stats.totalBatches++
    this.stats.totalItems += result.items.length
    this.stats.errors += result.errors.length

    // Update averages
    this.stats.averageBatchSize = this.stats.totalItems / this.stats.totalBatches
    
    const totalTime = (this.stats.averageProcessingTime * (this.stats.totalBatches - 1)) + result.processingTime
    this.stats.averageProcessingTime = totalTime / this.stats.totalBatches
  }

  private startFlushTimer(): void {
    this.flushTimer = setInterval(() => {
      if (this.pendingItems.length > 0) {
        this.flush()
      }
    }, this.config.flushInterval)
  }

  private generateId(): string {
    return `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  private generateBatchId(): string {
    return `batch_${++this.batchCounter}_${Date.now()}`
  }

  getPendingCount(): number {
    return this.pendingItems.length
  }

  getProcessingCount(): number {
    return this.processingBatches.size
  }

  getStatistics(): typeof this.stats & {
    pendingItems: number
    processingBatches: number
    config: BatchConfig
  } {
    return {
      ...this.stats,
      pendingItems: this.pendingItems.length,
      processingBatches: this.processingBatches.size,
      config: this.config
    }
  }

  clear(): void {
    // Cancel pending items
    this.pendingItems.forEach(item => {
      if (item.callback) {
        item.callback(null, new Error('Batch processor cleared'))
      }
    })
    
    this.pendingItems = []
    this.emit('cleared')
  }

  dispose(): void {
    if (this.flushTimer) {
      clearInterval(this.flushTimer)
      this.flushTimer = null
    }

    this.clear()
    this.removeAllListeners()
  }
}

// Specialized batch processor for agent updates
export class AgentUpdateBatcher extends BatchProcessor<Agent> {
  constructor(
    updateProcessor: (agents: Agent[]) => Promise<void>,
    config: Partial<BatchConfig> = {}
  ) {
    const processor = async (items: BatchItem<Agent>[]) => {
      const agents = items.map(item => item.data)
      await updateProcessor(agents)
      return agents.map(() => true) // Return success for each agent
    }

    super(processor, {
      maxBatchSize: 100,
      flushInterval: 16, // ~60fps
      maxWaitTime: 33, // ~30fps max delay
      processingConcurrency: 3,
      ...config
    })
  }

  updateAgent(agent: Agent, callback?: (success: boolean, error?: Error) => void): string {
    return this.add(agent, {
      id: agent.id,
      priority: this.getAgentPriority(agent),
      callback
    })
  }

  private getAgentPriority(agent: Agent): number {
    let priority = 0

    // Higher priority for active agents
    if (agent.currentState.status === 'active') {
      priority += 10
    }

    // Higher priority for leaders
    if (agent.currentState.role === 'leader') {
      priority += 20
    }

    // Higher priority for agents with errors
    if (agent.currentState.status === 'error') {
      priority += 30
    }

    // Higher priority for recently updated agents
    const age = Date.now() - agent.lastUpdate
    if (age < 1000) { // Less than 1 second old
      priority += 15
    }

    return priority
  }
}

// Batch processor for message handling
export class MessageBatcher extends BatchProcessor<any> {
  constructor(
    messageProcessor: (messages: any[]) => Promise<any[]>,
    config: Partial<BatchConfig> = {}
  ) {
    super(messageProcessor, {
      maxBatchSize: 50,
      flushInterval: 10, // 100Hz
      maxWaitTime: 20,
      processingConcurrency: 5,
      ...config
    })
  }

  sendMessage(
    message: any,
    priority: number = 0,
    callback?: (result: any, error?: Error) => void
  ): string {
    return this.add(message, { priority, callback })
  }
}

// Manager for multiple batch processors
export class BatchProcessorManager extends EventEmitter {
  private processors: Map<string, BatchProcessor<any>> = new Map()

  register<T>(name: string, processor: BatchProcessor<T>): void {
    if (this.processors.has(name)) {
      throw new Error(`Batch processor '${name}' already exists`)
    }

    this.processors.set(name, processor)
    
    // Forward events
    processor.on('batchProcessed', (result) => {
      this.emit('batchProcessed', { processor: name, ...result })
    })
    
    processor.on('batchError', (result) => {
      this.emit('batchError', { processor: name, ...result })
    })
  }

  get<T>(name: string): BatchProcessor<T> | undefined {
    return this.processors.get(name)
  }

  flushAll(): Promise<(ProcessingResult<any> | null)[]> {
    const promises = Array.from(this.processors.values()).map(processor => 
      processor.flush()
    )
    return Promise.all(promises)
  }

  getStatistics(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    this.processors.forEach((processor, name) => {
      stats[name] = processor.getStatistics()
    })

    return stats
  }

  dispose(): void {
    this.processors.forEach(processor => processor.dispose())
    this.processors.clear()
    this.removeAllListeners()
  }
}