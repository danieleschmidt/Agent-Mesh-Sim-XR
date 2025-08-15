/**
 * Concurrency Manager
 * Advanced concurrency control with task scheduling, resource management, and deadlock prevention
 */

import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

interface Task {
  id: string
  fn: () => Promise<unknown>
  priority: number
  timestamp: number
  deadline?: number
  dependencies: string[]
  resources: string[]
  retries: number
  maxRetries: number
  timeout?: number
  category: string
}

interface Worker {
  id: string
  busy: boolean
  currentTask?: string
  totalProcessed: number
  averageProcessTime: number
  lastActive: number
  capabilities: Set<string>
  load: number
}

interface ResourceLock {
  resource: string
  holder: string
  timestamp: number
  readers: Set<string>
  exclusive: boolean
}

interface ConcurrencyStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageWaitTime: number
  averageProcessTime: number
  activeWorkers: number
  totalWorkers: number
  resourceUtilization: number
  throughput: number
}

type SchedulingStrategy = 'FIFO' | 'PRIORITY' | 'DEADLINE' | 'SHORTEST_JOB' | 'FAIR_SHARE'

export class ConcurrencyManager extends EventEmitter {
  private tasks: Map<string, Task> = new Map()
  private workers: Map<string, Worker> = new Map()
  private resourceLocks: Map<string, ResourceLock> = new Map()
  private taskQueue: string[] = []
  private completedTasks: Map<string, { result?: unknown; error?: Error; processTime: number }> = new Map()
  
  private maxWorkers: number
  private schedulingStrategy: SchedulingStrategy = 'PRIORITY'
  private deadlockDetectionEnabled = true
  private loadBalancingEnabled = true
  private resourceTimeout = 30000 // 30 seconds
  private taskTimeout = 60000 // 60 seconds
  
  private stats: ConcurrencyStats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageWaitTime: 0,
    averageProcessTime: 0,
    activeWorkers: 0,
    totalWorkers: 0,
    resourceUtilization: 0,
    throughput: 0
  }
  
  private schedulerTimer?: number
  private monitoringTimer?: number
  private deadlockTimer?: number
  
  constructor(options: {
    maxWorkers?: number
    schedulingStrategy?: SchedulingStrategy
    deadlockDetectionEnabled?: boolean
    loadBalancingEnabled?: boolean
    resourceTimeout?: number
    taskTimeout?: number
  } = {}) {
    super()
    
    this.maxWorkers = options.maxWorkers || Math.max(2, navigator.hardwareConcurrency || 4)
    this.schedulingStrategy = options.schedulingStrategy || 'PRIORITY'
    this.deadlockDetectionEnabled = options.deadlockDetectionEnabled ?? true
    this.loadBalancingEnabled = options.loadBalancingEnabled ?? true
    this.resourceTimeout = options.resourceTimeout || 30000
    this.taskTimeout = options.taskTimeout || 60000
    
    this.initializeWorkers()
    this.startScheduler()
    this.startMonitoring()
    
    if (this.deadlockDetectionEnabled) {
      this.startDeadlockDetection()
    }
    
    logger.info('ConcurrencyManager', 'Concurrency manager initialized', {
      maxWorkers: this.maxWorkers,
      schedulingStrategy: this.schedulingStrategy,
      deadlockDetectionEnabled: this.deadlockDetectionEnabled
    })
  }

  async submitTask(
    id: string,
    fn: () => Promise<unknown>,
    options: {
      priority?: number
      deadline?: number
      dependencies?: string[]
      resources?: string[]
      maxRetries?: number
      timeout?: number
      category?: string
    } = {}
  ): Promise<string> {
    const task: Task = {
      id,
      fn,
      priority: options.priority || 0,
      timestamp: Date.now(),
      deadline: options.deadline,
      dependencies: options.dependencies || [],
      resources: options.resources || [],
      retries: 0,
      maxRetries: options.maxRetries || 3,
      timeout: options.timeout || this.taskTimeout,
      category: options.category || 'general'
    }
    
    // Validate dependencies
    for (const depId of task.dependencies) {
      if (!this.completedTasks.has(depId) && !this.tasks.has(depId)) {
        throw new Error(`Dependency ${depId} not found`)
      }
    }
    
    this.tasks.set(id, task)
    this.stats.totalTasks++
    
    // Add to queue if dependencies are satisfied
    if (this.areDependenciesSatisfied(task)) {
      this.addToQueue(id)
    }
    
    this.emit('task_submitted', { id, priority: task.priority, dependencies: task.dependencies })
    
    logger.debug('ConcurrencyManager', 'Task submitted', {
      id,
      priority: task.priority,
      dependencies: task.dependencies.length,
      resources: task.resources.length
    })
    
    return id
  }

  async waitForTask(taskId: string): Promise<unknown> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const completed = this.completedTasks.get(taskId)
        if (completed) {
          if (completed.error) {
            reject(completed.error)
          } else {
            resolve(completed.result)
          }
          return
        }
        
        const task = this.tasks.get(taskId)
        if (!task) {
          reject(new Error(`Task ${taskId} not found`))
          return
        }
        
        // Check again after a delay
        setTimeout(checkCompletion, 100)
      }
      
      checkCompletion()
    })
  }

  async waitForAll(taskIds: string[]): Promise<unknown[]> {
    const results = await Promise.allSettled(
      taskIds.map(id => this.waitForTask(id))
    )
    
    return results.map(result => {
      if (result.status === 'fulfilled') {
        return result.value
      } else {
        throw result.reason
      }
    })
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    
    // Remove from queue
    const queueIndex = this.taskQueue.indexOf(taskId)
    if (queueIndex > -1) {
      this.taskQueue.splice(queueIndex, 1)
    }
    
    // Cancel if running
    const runningWorker = Array.from(this.workers.values())
      .find(w => w.currentTask === taskId)
    
    if (runningWorker) {
      // Mark as cancelled - the worker will handle cleanup
      this.completedTasks.set(taskId, { 
        error: new Error('Task cancelled'), 
        processTime: Date.now() - task.timestamp 
      })
    }
    
    this.tasks.delete(taskId)
    this.emit('task_cancelled', { id: taskId })
    
    return true
  }

  acquireResource(taskId: string, resource: string, exclusive = false): Promise<boolean> {
    return new Promise((resolve) => {
      const task = this.tasks.get(taskId)
      if (!task) {
        resolve(false)
        return
      }

      const existingLock = this.resourceLocks.get(resource)
      
      if (!existingLock) {
        // Resource is available
        const lock: ResourceLock = {
          resource,
          holder: taskId,
          timestamp: Date.now(),
          readers: exclusive ? new Set() : new Set([taskId]),
          exclusive
        }
        
        this.resourceLocks.set(resource, lock)
        this.emit('resource_acquired', { taskId, resource, exclusive })
        resolve(true)
        
      } else if (!exclusive && !existingLock.exclusive) {
        // Can add as reader
        existingLock.readers.add(taskId)
        this.emit('resource_acquired', { taskId, resource, exclusive: false })
        resolve(true)
        
      } else {
        // Resource is locked exclusively or we need exclusive access
        this.emit('resource_blocked', { taskId, resource, holder: existingLock.holder })
        
        // Set timeout for resource acquisition
        setTimeout(() => {
          const currentLock = this.resourceLocks.get(resource)
          if (currentLock && (currentLock.holder === taskId || currentLock.readers.has(taskId))) {
            resolve(true)
          } else {
            resolve(false)
          }
        }, this.resourceTimeout)
      }
    })
  }

  releaseResource(taskId: string, resource: string): boolean {
    const lock = this.resourceLocks.get(resource)
    if (!lock) return false
    
    if (lock.holder === taskId) {
      // Release exclusive lock
      this.resourceLocks.delete(resource)
      this.emit('resource_released', { taskId, resource, exclusive: true })
      
      // Check if any waiting tasks can now proceed
      this.checkWaitingTasks()
      return true
      
    } else if (lock.readers.has(taskId)) {
      // Release reader lock
      lock.readers.delete(taskId)
      
      if (lock.readers.size === 0) {
        this.resourceLocks.delete(resource)
      }
      
      this.emit('resource_released', { taskId, resource, exclusive: false })
      this.checkWaitingTasks()
      return true
    }
    
    return false
  }

  releaseAllResources(taskId: string): void {
    for (const [resource, lock] of this.resourceLocks) {
      if (lock.holder === taskId || lock.readers.has(taskId)) {
        this.releaseResource(taskId, resource)
      }
    }
  }

  private initializeWorkers(): void {
    for (let i = 0; i < this.maxWorkers; i++) {
      const worker: Worker = {
        id: `worker_${i}`,
        busy: false,
        totalProcessed: 0,
        averageProcessTime: 0,
        lastActive: Date.now(),
        capabilities: new Set(['general']),
        load: 0
      }
      
      this.workers.set(worker.id, worker)
    }
    
    this.stats.totalWorkers = this.maxWorkers
  }

  private startScheduler(): void {
    this.schedulerTimer = setInterval(() => {
      this.scheduleNextTask()
    }, 100) as unknown as number // Check every 100ms
  }

  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updateStats()
      this.checkTimeouts()
      this.balanceLoad()
    }, 5000) as unknown as number // Every 5 seconds
  }

  private startDeadlockDetection(): void {
    this.deadlockTimer = setInterval(() => {
      this.detectDeadlock()
    }, 10000) as unknown as number // Every 10 seconds
  }

  private scheduleNextTask(): void {
    if (this.taskQueue.length === 0) return
    
    const availableWorker = this.getAvailableWorker()
    if (!availableWorker) return
    
    const taskId = this.selectNextTask()
    if (!taskId) return
    
    const task = this.tasks.get(taskId)
    if (!task) return
    
    this.executeTask(availableWorker, task)
  }

  private selectNextTask(): string | null {
    if (this.taskQueue.length === 0) return null
    
    const eligibleTasks = this.taskQueue.filter(id => {
      const task = this.tasks.get(id)
      return task && this.areDependenciesSatisfied(task) && this.areResourcesAvailable(task)
    })
    
    if (eligibleTasks.length === 0) return null
    
    switch (this.schedulingStrategy) {
      case 'FIFO':
        return eligibleTasks[0]
        
      case 'PRIORITY':
        return eligibleTasks.reduce((highest, current) => {
          const highestTask = this.tasks.get(highest)!
          const currentTask = this.tasks.get(current)!
          return currentTask.priority > highestTask.priority ? current : highest
        })
        
      case 'DEADLINE':
        return eligibleTasks.reduce((earliest, current) => {
          const earliestTask = this.tasks.get(earliest)!
          const currentTask = this.tasks.get(current)!
          
          if (!earliestTask.deadline) return current
          if (!currentTask.deadline) return earliest
          
          return currentTask.deadline < earliestTask.deadline ? current : earliest
        })
        
      case 'SHORTEST_JOB':
        // Estimate based on task category and historical data
        return eligibleTasks.reduce((shortest, current) => {
          const shortestTime = this.estimateTaskTime(this.tasks.get(shortest)!)
          const currentTime = this.estimateTaskTime(this.tasks.get(current)!)
          return currentTime < shortestTime ? current : shortest
        })
        
      case 'FAIR_SHARE':
        return this.selectByFairShare(eligibleTasks)
        
      default:
        return eligibleTasks[0]
    }
  }

  private getAvailableWorker(): Worker | null {
    const availableWorkers = Array.from(this.workers.values()).filter(w => !w.busy)
    
    if (availableWorkers.length === 0) return null
    
    if (this.loadBalancingEnabled) {
      // Return worker with lowest load
      return availableWorkers.reduce((lowest, current) => 
        current.load < lowest.load ? current : lowest
      )
    }
    
    return availableWorkers[0]
  }

  private async executeTask(worker: Worker, task: Task): Promise<void> {
    const startTime = Date.now()
    
    worker.busy = true
    worker.currentTask = task.id
    worker.lastActive = startTime
    
    this.stats.activeWorkers++
    
    // Remove from queue
    const queueIndex = this.taskQueue.indexOf(task.id)
    if (queueIndex > -1) {
      this.taskQueue.splice(queueIndex, 1)
    }
    
    // Acquire resources
    const resourcesAcquired = []
    for (const resource of task.resources) {
      const acquired = await this.acquireResource(task.id, resource)
      if (acquired) {
        resourcesAcquired.push(resource)
      } else {
        // Release acquired resources and retry later
        for (const acquiredResource of resourcesAcquired) {
          this.releaseResource(task.id, acquiredResource)
        }
        
        worker.busy = false
        worker.currentTask = undefined
        this.stats.activeWorkers--
        this.addToQueue(task.id) // Re-queue task
        return
      }
    }
    
    this.emit('task_started', { id: task.id, workerId: worker.id })
    
    try {
      // Execute with timeout
      const result = await Promise.race([
        task.fn(),
        new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Task timeout')), task.timeout || this.taskTimeout)
        )
      ])
      
      const processTime = Date.now() - startTime
      
      // Update worker stats
      worker.totalProcessed++
      worker.averageProcessTime = (worker.averageProcessTime + processTime) / 2
      
      // Mark task as completed
      this.completedTasks.set(task.id, { result, processTime })
      this.stats.completedTasks++
      
      // Check dependent tasks
      this.checkDependentTasks(task.id)
      
      this.emit('task_completed', { id: task.id, workerId: worker.id, processTime })
      
      logger.debug('ConcurrencyManager', 'Task completed', {
        id: task.id,
        workerId: worker.id,
        processTime
      })
      
    } catch (error) {
      const processTime = Date.now() - startTime
      
      // Handle retry logic
      if (task.retries < task.maxRetries) {
        task.retries++
        this.addToQueue(task.id) // Re-queue for retry
        
        this.emit('task_retry', { id: task.id, retry: task.retries, error })
        
        logger.warn('ConcurrencyManager', 'Task failed, retrying', {
          id: task.id,
          retry: task.retries,
          maxRetries: task.maxRetries,
          error: (error as Error).message
        })
      } else {
        // Task failed permanently
        this.completedTasks.set(task.id, { error: error as Error, processTime })
        this.stats.failedTasks++
        
        this.emit('task_failed', { id: task.id, workerId: worker.id, error })
        
        logger.error('ConcurrencyManager', 'Task failed permanently', {
          id: task.id,
          workerId: worker.id,
          error: (error as Error).message
        })
      }
    } finally {
      // Cleanup
      worker.busy = false
      worker.currentTask = undefined
      this.stats.activeWorkers--
      
      // Release resources
      this.releaseAllResources(task.id)
      
      // Remove task if completed or permanently failed
      if (task.retries >= task.maxRetries || this.completedTasks.has(task.id)) {
        this.tasks.delete(task.id)
      }
    }
  }

  private areDependenciesSatisfied(task: Task): boolean {
    return task.dependencies.every(depId => this.completedTasks.has(depId))
  }

  private areResourcesAvailable(task: Task): boolean {
    return task.resources.every(resource => {
      const lock = this.resourceLocks.get(resource)
      return !lock || (!lock.exclusive && task.resources.length === 1)
    })
  }

  private addToQueue(taskId: string): void {
    if (!this.taskQueue.includes(taskId)) {
      this.taskQueue.push(taskId)
    }
  }

  private checkDependentTasks(completedTaskId: string): void {
    for (const [taskId, task] of this.tasks) {
      if (task.dependencies.includes(completedTaskId) && 
          this.areDependenciesSatisfied(task) && 
          !this.taskQueue.includes(taskId)) {
        this.addToQueue(taskId)
      }
    }
  }

  private checkWaitingTasks(): void {
    // Re-evaluate tasks that might be waiting for resources
    for (const taskId of this.taskQueue) {
      const task = this.tasks.get(taskId)
      if (task && this.areResourcesAvailable(task)) {
        // Task can now proceed - scheduling will pick it up
        this.emit('task_unblocked', { id: taskId })
      }
    }
  }

  private estimateTaskTime(task: Task): number {
    // Simple estimation based on task category and historical data
    const categoryStats = Array.from(this.completedTasks.values())
      .filter(completed => completed.processTime > 0)
    
    if (categoryStats.length > 0) {
      const avgTime = categoryStats.reduce((sum, c) => sum + c.processTime, 0) / categoryStats.length
      return avgTime
    }
    
    return 1000 // Default estimate
  }

  private selectByFairShare(eligibleTasks: string[]): string {
    // Implement fair share scheduling - simple round-robin for now
    return eligibleTasks[0]
  }

  private updateStats(): void {
    this.stats.activeWorkers = Array.from(this.workers.values()).filter(w => w.busy).length
    
    const completedTaskList = Array.from(this.completedTasks.values())
    if (completedTaskList.length > 0) {
      this.stats.averageProcessTime = completedTaskList
        .reduce((sum, c) => sum + c.processTime, 0) / completedTaskList.length
    }
    
    this.stats.resourceUtilization = this.resourceLocks.size / (this.resourceLocks.size + 10) // Estimate
    this.stats.throughput = this.stats.completedTasks / Math.max(1, (Date.now() - Date.now()) / 1000) // Tasks per second
  }

  private checkTimeouts(): void {
    const currentTime = Date.now()
    
    // Check task timeouts
    for (const [taskId, task] of this.tasks) {
      if (task.timeout && currentTime - task.timestamp > task.timeout) {
        this.cancelTask(taskId)
        this.emit('task_timeout', { id: taskId })
      }
    }
    
    // Check resource timeouts
    for (const [resource, lock] of this.resourceLocks) {
      if (currentTime - lock.timestamp > this.resourceTimeout) {
        this.releaseAllResources(lock.holder)
        this.emit('resource_timeout', { resource, holder: lock.holder })
      }
    }
  }

  private balanceLoad(): void {
    if (!this.loadBalancingEnabled) return
    
    // Update worker loads
    for (const worker of this.workers.values()) {
      if (worker.busy) {
        worker.load = Math.min(100, worker.load + 10)
      } else {
        worker.load = Math.max(0, worker.load - 5)
      }
    }
  }

  private detectDeadlock(): void {
    if (!this.deadlockDetectionEnabled) return
    
    // Simple deadlock detection - check for circular dependencies in resource locks
    const resourceGraph = new Map<string, Set<string>>()
    
    for (const [resource, lock] of this.resourceLocks) {
      const holder = lock.holder
      const task = this.tasks.get(holder)
      
      if (task) {
        if (!resourceGraph.has(holder)) {
          resourceGraph.set(holder, new Set())
        }
        
        for (const neededResource of task.resources) {
          if (neededResource !== resource) {
            resourceGraph.get(holder)!.add(neededResource)
          }
        }
      }
    }
    
    // Check for cycles (simplified detection)
    const visited = new Set<string>()
    const path = new Set<string>()
    
    for (const taskId of resourceGraph.keys()) {
      if (this.hasCycle(taskId, resourceGraph, visited, path)) {
        this.handleDeadlock(taskId)
        break
      }
    }
  }

  private hasCycle(taskId: string, graph: Map<string, Set<string>>, visited: Set<string>, path: Set<string>): boolean {
    if (path.has(taskId)) return true
    if (visited.has(taskId)) return false
    
    visited.add(taskId)
    path.add(taskId)
    
    const neighbors = graph.get(taskId) || new Set()
    for (const neighbor of neighbors) {
      if (this.hasCycle(neighbor, graph, visited, path)) {
        return true
      }
    }
    
    path.delete(taskId)
    return false
  }

  private handleDeadlock(taskId: string): void {
    // Simple deadlock resolution - cancel the task
    this.cancelTask(taskId)
    this.emit('deadlock_detected', { taskId })
    
    logger.warn('ConcurrencyManager', 'Deadlock detected and resolved', { taskId })
  }

  getStats(): ConcurrencyStats {
    this.updateStats()
    return { ...this.stats }
  }

  getPendingTasks(): string[] {
    return [...this.taskQueue]
  }

  getRunningTasks(): Array<{ taskId: string; workerId: string; startTime: number }> {
    const running = []
    
    for (const worker of this.workers.values()) {
      if (worker.currentTask) {
        running.push({
          taskId: worker.currentTask,
          workerId: worker.id,
          startTime: worker.lastActive
        })
      }
    }
    
    return running
  }

  dispose(): void {
    // Cancel all pending tasks
    for (const taskId of this.taskQueue) {
      this.cancelTask(taskId)
    }
    
    // Stop timers
    if (this.schedulerTimer) {
      clearInterval(this.schedulerTimer)
      this.schedulerTimer = undefined
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = undefined
    }
    
    if (this.deadlockTimer) {
      clearInterval(this.deadlockTimer)
      this.deadlockTimer = undefined
    }
    
    // Clear all data structures
    this.tasks.clear()
    this.workers.clear()
    this.resourceLocks.clear()
    this.taskQueue.length = 0
    this.completedTasks.clear()
    
    this.removeAllListeners()
    
    logger.info('ConcurrencyManager', 'Concurrency manager disposed')
  }
}