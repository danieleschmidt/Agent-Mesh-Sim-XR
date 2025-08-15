/**
 * Simplified GPU Acceleration for Agent Updates
 * Provides batch processing capabilities without complex WebGL compute shaders
 */

import { Vector3 } from 'three'
import { logger } from '../utils/Logger'
import type { Agent } from '../types'

interface GPUAcceleratorConfig {
  maxBatchSize: number
  enableInstancing: boolean
  useWebWorkers: boolean
  workerCount: number
}

interface BatchUpdateResult {
  processed: number
  timeMs: number
  errors: number
}

export class SimpleGPUAccelerator {
  private config: GPUAcceleratorConfig
  private workers: Worker[] = []
  private batchQueue: Agent[][] = []
  private processing = false
  private stats = {
    totalProcessed: 0,
    totalTime: 0,
    averageTime: 0,
    errorCount: 0
  }

  constructor(config: Partial<GPUAcceleratorConfig> = {}) {
    this.config = {
      maxBatchSize: 100,
      enableInstancing: true,
      useWebWorkers: typeof Worker !== 'undefined' && typeof URL !== 'undefined' && typeof URL.createObjectURL !== 'undefined',
      workerCount: Math.min(navigator.hardwareConcurrency || 4, 8),
      ...config
    }

    if (this.config.useWebWorkers) {
      this.initializeWorkers()
    }

    logger.info('SimpleGPUAccelerator', 'GPU Accelerator initialized', { 
      config: this.config,
      workersAvailable: this.workers.length
    })
  }

  private initializeWorkers(): void {
    try {
      // Create worker blob for agent processing
      const workerCode = `
        self.onmessage = function(e) {
          const { agents, batchId } = e.data
          const startTime = performance.now()
          
          try {
            // Simulate GPU-accelerated processing
            const processed = agents.map(agent => {
              const newPosition = new Vector3(
                agent.position.x + (agent.velocity?.x || 0) * 0.016,
                agent.position.y + (agent.velocity?.y || 0) * 0.016,
                agent.position.z + (agent.velocity?.z || 0) * 0.016
              )
              
              return {
                ...agent,
                lastUpdate: Date.now(),
                position: newPosition,
                currentState: {
                  ...agent.currentState,
                  lastUpdateTime: Date.now()
                }
              }
            })
            
            const endTime = performance.now()
            
            self.postMessage({
              batchId,
              processed,
              success: true,
              timeMs: endTime - startTime,
              count: processed.length
            })
          } catch (error) {
            self.postMessage({
              batchId,
              success: false,
              error: error.message,
              timeMs: performance.now() - startTime
            })
          }
        }
      `

      const blob = new Blob([workerCode], { type: 'application/javascript' })
      const workerUrl = URL.createObjectURL(blob)

      for (let i = 0; i < this.config.workerCount; i++) {
        const worker = new Worker(workerUrl)
        this.workers.push(worker)
      }

      URL.revokeObjectURL(workerUrl)
      
    } catch (error) {
      logger.warn('SimpleGPUAccelerator', 'Failed to initialize workers, falling back to main thread', error as Error)
      this.config.useWebWorkers = false
    }
  }

  async processAgentBatch(agents: Agent[]): Promise<BatchUpdateResult> {
    const startTime = performance.now()

    try {
      if (agents.length === 0) {
        return { processed: 0, timeMs: 0, errors: 0 }
      }

      let processedAgents: Agent[]
      let errorCount = 0

      if (this.config.useWebWorkers && this.workers.length > 0) {
        processedAgents = await this.processWithWorkers(agents)
      } else {
        processedAgents = await this.processOnMainThread(agents)
      }

      const endTime = performance.now()
      const timeMs = endTime - startTime

      // Update statistics
      this.stats.totalProcessed += processedAgents.length
      this.stats.totalTime += timeMs
      this.stats.averageTime = this.stats.totalTime / this.stats.totalProcessed

      const result: BatchUpdateResult = {
        processed: processedAgents.length,
        timeMs,
        errors: errorCount
      }

      if (timeMs > 16) { // Warn if processing takes longer than one frame at 60fps
        logger.warn('SimpleGPUAccelerator', 'Batch processing exceeded frame budget', {
          agents: agents.length,
          timeMs,
          frameBudget: 16
        })
      }

      return result

    } catch (error) {
      logger.error('SimpleGPUAccelerator', 'Batch processing failed', error as Error)
      this.stats.errorCount++
      return { processed: 0, timeMs: performance.now() - startTime, errors: 1 }
    }
  }

  private async processWithWorkers(agents: Agent[]): Promise<Agent[]> {
    const batchSize = Math.ceil(agents.length / this.workers.length)
    const batches: Agent[][] = []
    
    for (let i = 0; i < agents.length; i += batchSize) {
      batches.push(agents.slice(i, i + batchSize))
    }

    const promises = batches.map((batch, index) => {
      return new Promise<Agent[]>((resolve, reject) => {
        const worker = this.workers[index % this.workers.length]
        const batchId = `${Date.now()}_${index}`
        
        const timeout = setTimeout(() => {
          reject(new Error('Worker timeout'))
        }, 100) // 100ms timeout

        const onMessage = (e: MessageEvent) => {
          if (e.data.batchId === batchId) {
            clearTimeout(timeout)
            worker.removeEventListener('message', onMessage)
            
            if (e.data.success) {
              resolve(e.data.processed)
            } else {
              reject(new Error(e.data.error))
            }
          }
        }

        worker.addEventListener('message', onMessage)
        worker.postMessage({ agents: batch, batchId })
      })
    })

    const results = await Promise.allSettled(promises)
    const processedBatches: Agent[] = []

    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        processedBatches.push(...result.value)
      } else {
        logger.warn('SimpleGPUAccelerator', 'Worker batch failed, falling back to main thread', {
          batchIndex: index,
          error: result.reason?.message
        })
        // Process failed batch on main thread
        const failedBatch = batches[index]
        processedBatches.push(...this.processAgentsSync(failedBatch))
      }
    })

    return processedBatches
  }

  private async processOnMainThread(agents: Agent[]): Promise<Agent[]> {
    // Use requestIdleCallback if available for better performance
    if (typeof requestIdleCallback !== 'undefined') {
      return new Promise((resolve) => {
        requestIdleCallback(() => {
          resolve(this.processAgentsSync(agents))
        })
      })
    } else {
      return this.processAgentsSync(agents)
    }
  }

  private processAgentsSync(agents: Agent[]): Agent[] {
    const deltaTime = 0.016 // 60fps

    return agents.map(agent => {
      const newPosition = new Vector3(
        agent.position.x + (agent.velocity?.x || 0) * deltaTime,
        agent.position.y + (agent.velocity?.y || 0) * deltaTime,
        agent.position.z + (agent.velocity?.z || 0) * deltaTime
      )

      return {
        ...agent,
        lastUpdate: Date.now(),
        position: newPosition,
        currentState: {
          ...agent.currentState,
          lastUpdateTime: Date.now()
        }
      }
    })
  }

  optimizeBatchSize(currentFPS: number, targetFPS = 60): number {
    const performanceRatio = currentFPS / targetFPS
    
    if (performanceRatio < 0.8) {
      // Performance is poor, reduce batch size
      return Math.max(10, Math.floor(this.config.maxBatchSize * 0.7))
    } else if (performanceRatio > 1.2) {
      // Performance is good, can increase batch size
      return Math.min(500, Math.floor(this.config.maxBatchSize * 1.3))
    }
    
    return this.config.maxBatchSize
  }

  getStatistics() {
    return {
      ...this.stats,
      workersActive: this.workers.length,
      configuration: this.config
    }
  }

  dispose(): void {
    this.processing = false
    
    // Terminate all workers
    this.workers.forEach(worker => {
      worker.terminate()
    })
    this.workers = []

    // Clear queue
    this.batchQueue = []

    logger.info('SimpleGPUAccelerator', 'GPU Accelerator disposed')
  }
}