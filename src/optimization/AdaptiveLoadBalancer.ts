import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

export interface WorkerNode {
  id: string
  name: string
  type: 'cpu' | 'gpu' | 'hybrid'
  capabilities: string[]
  maxLoad: number
  currentLoad: number
  processingTime: number[]
  errorRate: number
  status: 'active' | 'idle' | 'overloaded' | 'error' | 'offline'
  lastHeartbeat: number
  priority: number
}

export interface Task {
  id: string
  type: string
  priority: number
  estimatedTime: number
  requiredCapabilities: string[]
  payload: any
  callback?: (result: any, error?: Error) => void
  retryCount: number
  maxRetries: number
  createdAt: number
  startedAt?: number
}

export interface LoadBalancingStrategy {
  name: string
  selectNode: (task: Task, availableNodes: WorkerNode[]) => WorkerNode | null
}

export class AdaptiveLoadBalancer extends EventEmitter {
  private nodes: Map<string, WorkerNode> = new Map()
  private taskQueue: Task[] = []
  private activeTasks: Map<string, { task: Task; nodeId: string; startedAt: number }> = new Map()
  private completedTasks: Map<string, { task: Task; completedAt: number; processingTime: number }> = new Map()
  private strategies: Map<string, LoadBalancingStrategy> = new Map()
  private currentStrategy = 'weighted_round_robin'
  private isRunning = false
  private processingInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor() {
    super()
    this.initializeStrategies()
    logger.info('AdaptiveLoadBalancer initialized')
  }

  private initializeStrategies(): void {
    // Round Robin Strategy
    this.strategies.set('round_robin', {
      name: 'Round Robin',
      selectNode: (task: Task, availableNodes: WorkerNode[]): WorkerNode | null => {
        if (availableNodes.length === 0) return null
        
        // Simple round robin - select next available node
        const sortedNodes = availableNodes.sort((a, b) => a.currentLoad - b.currentLoad)
        return sortedNodes[0]
      }
    })

    // Weighted Round Robin Strategy
    this.strategies.set('weighted_round_robin', {
      name: 'Weighted Round Robin',
      selectNode: (task: Task, availableNodes: WorkerNode[]): WorkerNode | null => {
        if (availableNodes.length === 0) return null
        
        // Calculate weighted scores based on load, processing time, and error rate
        const scoredNodes = availableNodes.map(node => {
          const loadFactor = 1 - (node.currentLoad / node.maxLoad)
          const speedFactor = node.processingTime.length > 0 
            ? 1 / (node.processingTime.reduce((a, b) => a + b) / node.processingTime.length)
            : 1
          const reliabilityFactor = 1 - node.errorRate
          const priorityFactor = node.priority / 10
          
          const score = (loadFactor * 0.4) + (speedFactor * 0.3) + (reliabilityFactor * 0.2) + (priorityFactor * 0.1)
          
          return { node, score }
        })

        // Sort by score (highest first)
        scoredNodes.sort((a, b) => b.score - a.score)
        return scoredNodes[0].node
      }
    })

    // Least Connections Strategy
    this.strategies.set('least_connections', {
      name: 'Least Connections',
      selectNode: (task: Task, availableNodes: WorkerNode[]): WorkerNode | null => {
        if (availableNodes.length === 0) return null
        
        // Select node with least current load
        return availableNodes.reduce((min, node) => 
          node.currentLoad < min.currentLoad ? node : min
        )
      }
    })

    // Resource-Based Strategy
    this.strategies.set('resource_based', {
      name: 'Resource Based',
      selectNode: (task: Task, availableNodes: WorkerNode[]): WorkerNode | null => {
        if (availableNodes.length === 0) return null
        
        // Filter nodes by required capabilities
        const capableNodes = availableNodes.filter(node =>
          task.requiredCapabilities.every(cap => node.capabilities.includes(cap))
        )
        
        if (capableNodes.length === 0) return null
        
        // Select based on resource availability and task type
        if (task.type === 'gpu_compute') {
          const gpuNodes = capableNodes.filter(node => node.type === 'gpu' || node.type === 'hybrid')
          return gpuNodes.length > 0 ? gpuNodes[0] : capableNodes[0]
        }
        
        if (task.type === 'cpu_intensive') {
          const cpuNodes = capableNodes.filter(node => node.type === 'cpu' || node.type === 'hybrid')
          return cpuNodes.length > 0 ? cpuNodes[0] : capableNodes[0]
        }
        
        return capableNodes[0]
      }
    })

    // Predictive Strategy
    this.strategies.set('predictive', {
      name: 'Predictive',
      selectNode: (task: Task, availableNodes: WorkerNode[]): WorkerNode | null => {
        if (availableNodes.length === 0) return null
        
        // Predict completion time for each node
        const predictions = availableNodes.map(node => {
          const avgProcessingTime = node.processingTime.length > 0
            ? node.processingTime.reduce((a, b) => a + b) / node.processingTime.length
            : task.estimatedTime
          
          const queueTime = (node.currentLoad / node.maxLoad) * avgProcessingTime
          const predictedCompletionTime = avgProcessingTime + queueTime
          
          return { node, predictedTime: predictedCompletionTime }
        })

        // Select node with shortest predicted completion time
        predictions.sort((a, b) => a.predictedTime - b.predictedTime)
        return predictions[0].node
      }
    })
  }

  public addNode(node: Omit<WorkerNode, 'currentLoad' | 'processingTime' | 'errorRate' | 'lastHeartbeat'>): void {
    const fullNode: WorkerNode = {
      ...node,
      currentLoad: 0,
      processingTime: [],
      errorRate: 0,
      lastHeartbeat: Date.now()
    }

    this.nodes.set(node.id, fullNode)
    logger.info('Worker node added', { 
      id: node.id, 
      name: node.name, 
      type: node.type,
      capabilities: node.capabilities
    })
    
    this.emit('nodeAdded', fullNode)
  }

  public removeNode(nodeId: string): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      // Cancel any active tasks on this node
      for (const [taskId, activeTask] of this.activeTasks) {
        if (activeTask.nodeId === nodeId) {
          this.requeueTask(activeTask.task, `Node ${nodeId} removed`)
        }
      }

      this.nodes.delete(nodeId)
      logger.info('Worker node removed', { id: nodeId })
      this.emit('nodeRemoved', { id: nodeId })
    }
  }

  public updateNodeStatus(nodeId: string, status: WorkerNode['status']): void {
    const node = this.nodes.get(nodeId)
    if (node) {
      node.status = status
      node.lastHeartbeat = Date.now()
      logger.debug('Node status updated', { id: nodeId, status })
    }
  }

  public submitTask(task: Omit<Task, 'createdAt' | 'retryCount'>): string {
    const fullTask: Task = {
      ...task,
      createdAt: Date.now(),
      retryCount: 0
    }

    // Insert task in priority order
    this.insertTaskByPriority(fullTask)
    
    logger.info('Task submitted', { 
      id: fullTask.id, 
      type: fullTask.type, 
      priority: fullTask.priority,
      queueLength: this.taskQueue.length
    })
    
    this.emit('taskSubmitted', fullTask)
    return fullTask.id
  }

  private insertTaskByPriority(task: Task): void {
    let insertIndex = 0
    
    // Find insertion point (higher priority first)
    while (insertIndex < this.taskQueue.length && 
           this.taskQueue[insertIndex].priority >= task.priority) {
      insertIndex++
    }
    
    this.taskQueue.splice(insertIndex, 0, task)
  }

  public cancelTask(taskId: string): boolean {
    // Check if task is in queue
    const queueIndex = this.taskQueue.findIndex(task => task.id === taskId)
    if (queueIndex !== -1) {
      const task = this.taskQueue.splice(queueIndex, 1)[0]
      logger.info('Task cancelled from queue', { id: taskId })
      this.emit('taskCancelled', task)
      return true
    }

    // Check if task is active
    const activeTask = this.activeTasks.get(taskId)
    if (activeTask) {
      // TODO: Send cancellation signal to worker node
      this.activeTasks.delete(taskId)
      logger.info('Task cancelled (active)', { id: taskId, nodeId: activeTask.nodeId })
      this.emit('taskCancelled', activeTask.task)
      return true
    }

    return false
  }

  private async processTaskQueue(): Promise<void> {
    if (this.taskQueue.length === 0) return

    const availableNodes = this.getAvailableNodes()
    if (availableNodes.length === 0) return

    const strategy = this.strategies.get(this.currentStrategy)!
    
    while (this.taskQueue.length > 0 && this.getAvailableNodes().length > 0) {
      const task = this.taskQueue.shift()!
      const selectedNode = strategy.selectNode(task, this.getAvailableNodes())

      if (!selectedNode) {
        // Put task back in queue if no suitable node found
        this.taskQueue.unshift(task)
        break
      }

      await this.assignTaskToNode(task, selectedNode)
    }
  }

  private async assignTaskToNode(task: Task, node: WorkerNode): Promise<void> {
    try {
      // Update node load
      node.currentLoad++
      task.startedAt = Date.now()
      
      // Track active task
      this.activeTasks.set(task.id, {
        task,
        nodeId: node.id,
        startedAt: task.startedAt
      })

      logger.info('Task assigned to node', { 
        taskId: task.id, 
        nodeId: node.id, 
        nodeLoad: node.currentLoad 
      })

      this.emit('taskAssigned', { task, node })

      // Simulate task execution (in real implementation, this would send to worker)
      setTimeout(() => {
        this.completeTask(task.id, { success: true, data: 'mock result' })
      }, task.estimatedTime + Math.random() * 1000)

    } catch (error) {
      logger.error('Failed to assign task to node', { 
        taskId: task.id, 
        nodeId: node.id, 
        error 
      })
      
      this.handleTaskError(task, error as Error)
    }
  }

  public completeTask(taskId: string, result: any): void {
    const activeTask = this.activeTasks.get(taskId)
    
    if (!activeTask) {
      logger.warn('Completed task not found in active tasks', { taskId })
      return
    }

    const { task, nodeId, startedAt } = activeTask
    const node = this.nodes.get(nodeId)
    
    if (node) {
      // Update node metrics
      node.currentLoad = Math.max(0, node.currentLoad - 1)
      
      const processingTime = Date.now() - startedAt
      node.processingTime.push(processingTime)
      
      // Keep only recent processing times (last 100)
      if (node.processingTime.length > 100) {
        node.processingTime = node.processingTime.slice(-100)
      }
    }

    // Remove from active tasks
    this.activeTasks.delete(taskId)
    
    // Add to completed tasks
    this.completedTasks.set(taskId, {
      task,
      completedAt: Date.now(),
      processingTime: Date.now() - startedAt
    })

    // Keep only recent completed tasks (last 1000)
    if (this.completedTasks.size > 1000) {
      const oldestKey = this.completedTasks.keys().next().value
      this.completedTasks.delete(oldestKey)
    }

    logger.info('Task completed', { 
      taskId, 
      nodeId, 
      processingTime: Date.now() - startedAt 
    })

    // Execute callback
    if (task.callback) {
      try {
        task.callback(result)
      } catch (callbackError) {
        logger.error('Task callback error', { taskId, error: callbackError })
      }
    }

    this.emit('taskCompleted', { task, result, processingTime: Date.now() - startedAt })
  }

  public failTask(taskId: string, error: Error): void {
    const activeTask = this.activeTasks.get(taskId)
    
    if (!activeTask) {
      logger.warn('Failed task not found in active tasks', { taskId })
      return
    }

    const { task, nodeId } = activeTask
    const node = this.nodes.get(nodeId)
    
    if (node) {
      node.currentLoad = Math.max(0, node.currentLoad - 1)
      node.errorRate = Math.min(1, node.errorRate + 0.01) // Increase error rate
    }

    // Remove from active tasks
    this.activeTasks.delete(taskId)

    this.handleTaskError(task, error)
  }

  private handleTaskError(task: Task, error: Error): void {
    logger.error('Task failed', { taskId: task.id, error: error.message, retryCount: task.retryCount })

    if (task.retryCount < task.maxRetries) {
      // Retry task
      task.retryCount++
      this.insertTaskByPriority(task)
      
      logger.info('Task requeued for retry', { 
        taskId: task.id, 
        retryCount: task.retryCount, 
        maxRetries: task.maxRetries 
      })
      
      this.emit('taskRetried', { task, error })
    } else {
      // Max retries exceeded
      logger.error('Task failed permanently', { taskId: task.id, maxRetries: task.maxRetries })
      
      if (task.callback) {
        try {
          task.callback(null, error)
        } catch (callbackError) {
          logger.error('Task error callback failed', { taskId: task.id, error: callbackError })
        }
      }
      
      this.emit('taskFailed', { task, error })
    }
  }

  private requeueTask(task: Task, reason: string): void {
    logger.info('Requeuing task', { taskId: task.id, reason })
    
    // Reset task state
    task.startedAt = undefined
    this.insertTaskByPriority(task)
    
    this.emit('taskRequeued', { task, reason })
  }

  private getAvailableNodes(): WorkerNode[] {
    return Array.from(this.nodes.values()).filter(node => 
      node.status === 'active' || node.status === 'idle'
    ).filter(node => 
      node.currentLoad < node.maxLoad
    )
  }

  private performHealthChecks(): void {
    const now = Date.now()
    const healthCheckTimeout = 30000 // 30 seconds
    
    for (const [nodeId, node] of this.nodes) {
      if (now - node.lastHeartbeat > healthCheckTimeout) {
        logger.warn('Node health check failed', { 
          nodeId, 
          lastHeartbeat: node.lastHeartbeat,
          timeSinceHeartbeat: now - node.lastHeartbeat
        })
        
        if (node.status !== 'offline') {
          node.status = 'offline'
          this.emit('nodeOffline', node)
          
          // Requeue any active tasks on this node
          for (const [taskId, activeTask] of this.activeTasks) {
            if (activeTask.nodeId === nodeId) {
              this.requeueTask(activeTask.task, `Node ${nodeId} went offline`)
              this.activeTasks.delete(taskId)
            }
          }
        }
      }
    }
  }

  public setStrategy(strategyName: string): void {
    if (this.strategies.has(strategyName)) {
      this.currentStrategy = strategyName
      logger.info('Load balancing strategy changed', { strategy: strategyName })
      this.emit('strategyChanged', strategyName)
    } else {
      logger.error('Unknown load balancing strategy', { strategy: strategyName })
    }
  }

  public getStatistics(): LoadBalancerStats {
    const totalTasks = this.activeTasks.size + this.completedTasks.size
    const completedTasksArray = Array.from(this.completedTasks.values())
    
    const averageProcessingTime = completedTasksArray.length > 0
      ? completedTasksArray.reduce((sum, task) => sum + task.processingTime, 0) / completedTasksArray.length
      : 0

    const throughput = completedTasksArray.length > 0
      ? completedTasksArray.length / ((Date.now() - completedTasksArray[0].completedAt) / 1000)
      : 0

    const nodeStats = Array.from(this.nodes.values()).map(node => ({
      id: node.id,
      name: node.name,
      type: node.type,
      status: node.status,
      currentLoad: node.currentLoad,
      maxLoad: node.maxLoad,
      loadPercentage: (node.currentLoad / node.maxLoad) * 100,
      averageProcessingTime: node.processingTime.length > 0
        ? node.processingTime.reduce((a, b) => a + b) / node.processingTime.length
        : 0,
      errorRate: node.errorRate
    }))

    return {
      totalNodes: this.nodes.size,
      activeNodes: Array.from(this.nodes.values()).filter(n => n.status === 'active').length,
      queueLength: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      completedTasks: this.completedTasks.size,
      totalTasks,
      averageProcessingTime,
      throughput,
      currentStrategy: this.currentStrategy,
      nodeStats
    }
  }

  public start(): void {
    if (this.isRunning) {
      logger.warn('AdaptiveLoadBalancer already running')
      return
    }

    this.isRunning = true
    
    // Start task processing
    this.processingInterval = setInterval(() => {
      this.processTaskQueue()
    }, 100) // Process every 100ms

    // Start health checks
    this.healthCheckInterval = setInterval(() => {
      this.performHealthChecks()
    }, 10000) // Health check every 10 seconds

    logger.info('AdaptiveLoadBalancer started')
    this.emit('started')
  }

  public stop(): void {
    if (!this.isRunning) return

    this.isRunning = false

    if (this.processingInterval) {
      clearInterval(this.processingInterval)
      this.processingInterval = null
    }

    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
      this.healthCheckInterval = null
    }

    logger.info('AdaptiveLoadBalancer stopped')
    this.emit('stopped')
  }

  public dispose(): void {
    this.stop()
    this.nodes.clear()
    this.taskQueue.splice(0)
    this.activeTasks.clear()
    this.completedTasks.clear()
    this.strategies.clear()
    this.removeAllListeners()
    logger.info('AdaptiveLoadBalancer disposed')
  }
}

interface LoadBalancerStats {
  totalNodes: number
  activeNodes: number
  queueLength: number
  activeTasks: number
  completedTasks: number
  totalTasks: number
  averageProcessingTime: number
  throughput: number
  currentStrategy: string
  nodeStats: Array<{
    id: string
    name: string
    type: string
    status: string
    currentLoad: number
    maxLoad: number
    loadPercentage: number
    averageProcessingTime: number
    errorRate: number
  }>
}