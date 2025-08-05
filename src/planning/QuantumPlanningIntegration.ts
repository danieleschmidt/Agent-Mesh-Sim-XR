import { EventEmitter } from 'eventemitter3'
import { Vector3 } from 'three'
import { AgentMeshXR } from '../core/AgentMeshXR'
import { QuantumInspiredPlanner, Task, TaskConstraint } from './QuantumInspiredPlanner'
import { QuantumSuperpositionManager } from './QuantumSuperpositionManager'
import { QuantumInterferenceEngine } from './QuantumInterferenceEngine'
import { QuantumAnnealingOptimizer, AnnealingConfig } from './QuantumAnnealingOptimizer'
import { Agent, AgentState } from '../types'
import { logger } from '../utils/Logger'

export interface QuantumPlanningConfig {
  enableSuperposition: boolean
  enableInterference: boolean
  enableAnnealing: boolean
  maxQuantumStates: number
  coherenceThreshold: number
  interferenceRange: number
  annealingConfig: Partial<AnnealingConfig>
}

export interface QuantumTaskResult {
  taskId: string
  assignedAgents: string[]
  quantumPriority: number
  originalPriority: number
  coherenceLevel: number
  interferencePatterns: string[]
  executionProbability: number
  estimatedStartTime: number
  estimatedCompletionTime: number
}

export interface QuantumPlanningMetrics {
  totalTasks: number
  quantumEnhancedTasks: number
  averageCoherence: number
  interferenceEvents: number
  annealingConvergence: number
  planningTime: number
  optimizationGain: number
}

export class QuantumPlanningIntegration extends EventEmitter {
  private agentMeshXR: AgentMeshXR
  private quantumPlanner: QuantumInspiredPlanner
  private superpositionManager: QuantumSuperpositionManager
  private interferenceEngine: QuantumInterferenceEngine
  private annealingOptimizer?: QuantumAnnealingOptimizer
  private config: QuantumPlanningConfig
  private activeTasks: Map<string, Task> = new Map()
  private planningResults: Map<string, QuantumTaskResult> = new Map()
  private planningActive: boolean = false

  constructor(agentMeshXR: AgentMeshXR, config: Partial<QuantumPlanningConfig> = {}) {
    super()
    
    this.agentMeshXR = agentMeshXR
    this.config = {
      enableSuperposition: true,
      enableInterference: true,
      enableAnnealing: true,
      maxQuantumStates: 10,
      coherenceThreshold: 0.7,
      interferenceRange: 5.0,
      annealingConfig: {
        initialTemperature: 100.0,
        maxIterations: 1000,
        parallelChains: 2
      },
      ...config
    }

    this.initializeQuantumComponents()
    this.setupEventListeners()
    this.startQuantumEvolution()

    logger.info('QuantumPlanningIntegration', 'Quantum planning system initialized', {
      config: this.config
    })
  }

  // Create quantum-enhanced task from regular task data
  public createQuantumTask(taskData: {
    id: string
    description: string
    priority: number
    requiredAgents: number
    estimatedDuration: number
    dependencies?: string[]
    position?: Vector3
    constraints?: TaskConstraint[]
  }): Task {
    const quantumTask: Task = {
      id: taskData.id,
      description: taskData.description,
      priority: taskData.priority,
      dependencies: taskData.dependencies || [],
      estimatedDuration: taskData.estimatedDuration,
      requiredAgents: taskData.requiredAgents,
      position: taskData.position || new Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      constraints: taskData.constraints || [],
      quantumState: {
        superposition: new Map([
          ['waiting', 0.8],
          ['ready', 0.2]
        ]),
        entangled: [],
        coherence: 1.0,
        interference: 0.0
      }
    }

    this.activeTasks.set(taskData.id, quantumTask)

    // Create quantum superposition for task if enabled
    if (this.config.enableSuperposition) {
      this.createTaskSuperposition(quantumTask)
    }

    // Add to interference engine if enabled
    if (this.config.enableInterference) {
      this.addTaskToInterference(quantumTask)
    }

    this.emit('quantumTaskCreated', {
      taskId: quantumTask.id,
      quantumState: quantumTask.quantumState
    })

    return quantumTask
  }

  // Plan tasks using quantum-inspired algorithms
  public async planTasks(
    taskIds: string[], 
    availableAgents?: string[]
  ): Promise<Map<string, QuantumTaskResult>> {
    const startTime = Date.now()
    this.planningActive = true

    try {
      // Get tasks to plan
      const tasks = taskIds.map(id => this.activeTasks.get(id)).filter(t => t) as Task[]
      if (tasks.length === 0) {
        throw new Error('No valid tasks found for planning')
      }

      // Get available agents
      const agents = availableAgents || this.agentMeshXR.getAllAgents().map(a => a.id)
      const agentObjects = this.agentMeshXR.getAllAgents().filter(a => agents.includes(a.id))

      logger.info('QuantumPlanningIntegration', 'Starting quantum planning', {
        taskCount: tasks.length,
        agentCount: agents.length
      })

      // Step 1: Apply quantum interference to adjust priorities
      let interferenceResults: any[] = []
      if (this.config.enableInterference) {
        interferenceResults = this.interferenceEngine.calculateInterference(tasks)
        this.applyInterferenceResults(tasks, interferenceResults)
      }

      // Step 2: Use quantum annealing for optimization if enabled
      let assignments: Map<string, string[]>
      if (this.config.enableAnnealing && this.annealingOptimizer) {
        assignments = await this.annealingOptimizer.optimizeTaskSchedule(
          tasks, 
          agents, 
          []
        )
      } else {
        // Fallback to quantum planner
        assignments = await this.quantumPlanner.planTasks(tasks, agentObjects)
      }

      // Step 3: Create quantum-enhanced results
      const results = new Map<string, QuantumTaskResult>()
      
      tasks.forEach(task => {
        const assignedAgents = assignments.get(task.id) || []
        const interferenceData = interferenceResults.find(r => r.taskId === task.id)
        
        const result: QuantumTaskResult = {
          taskId: task.id,
          assignedAgents,
          quantumPriority: interferenceData?.modifiedPriority || task.priority,
          originalPriority: task.priority,
          coherenceLevel: task.quantumState.coherence,
          interferencePatterns: interferenceData?.dominantPatterns || [],
          executionProbability: this.calculateExecutionProbability(task, assignedAgents),
          estimatedStartTime: this.calculateStartTime(task, assignments),
          estimatedCompletionTime: this.calculateCompletionTime(task, assignedAgents)
        }

        results.set(task.id, result)
        this.planningResults.set(task.id, result)
      })

      // Step 4: Update quantum states based on planning results
      this.updateQuantumStatesFromPlanning(tasks, results)

      const planningTime = Date.now() - startTime
      const metrics = this.calculatePlanningMetrics(tasks, results, planningTime)

      this.emit('quantumPlanningComplete', {
        results: Array.from(results.values()),
        metrics,
        interferenceResults
      })

      logger.info('QuantumPlanningIntegration', 'Quantum planning completed', {
        planningTime,
        taskCount: tasks.length,
        metrics
      })

      return results

    } catch (error) {
      logger.error('QuantumPlanningIntegration', 'Quantum planning failed', { error })
      this.emit('quantumPlanningError', error)
      throw error
    } finally {
      this.planningActive = false
    }
  }

  // Execute quantum-planned tasks
  public async executeQuantumPlan(planResults: Map<string, QuantumTaskResult>): Promise<void> {
    logger.info('QuantumPlanningIntegration', 'Executing quantum plan', {
      taskCount: planResults.size
    })

    // Sort tasks by quantum priority and execution probability
    const sortedTasks = Array.from(planResults.values()).sort((a, b) => {
      const priorityDiff = b.quantumPriority - a.quantumPriority
      if (Math.abs(priorityDiff) < 0.1) {
        return b.executionProbability - a.executionProbability
      }
      return priorityDiff
    })

    // Execute tasks in quantum-optimized order
    for (const taskResult of sortedTasks) {
      await this.executeQuantumTask(taskResult)
    }

    this.emit('quantumPlanExecuted', {
      executedTasks: sortedTasks.length,
      totalTime: Date.now()
    })
  }

  // Get current quantum state visualization data
  public getQuantumVisualizationData(): any {
    return {
      superposition: this.config.enableSuperposition ? 
        this.superpositionManager.getGlobalQuantumState() : null,
      interference: this.config.enableInterference ? 
        this.interferenceEngine.getInterferenceVisualization() : null,
      planner: this.quantumPlanner.getQuantumStateVisualization(),
      tasks: Array.from(this.activeTasks.entries()).map(([id, task]) => ({
        id,
        position: task.position?.toArray(),
        quantumState: task.quantumState,
        planningResult: this.planningResults.get(id)
      })),
      metrics: this.getQuantumMetrics()
    }
  }

  // Get quantum planning metrics
  public getQuantumMetrics(): QuantumPlanningMetrics {
    const tasks = Array.from(this.activeTasks.values())
    const quantumEnhanced = tasks.filter(t => t.quantumState.coherence > this.config.coherenceThreshold)
    
    return {
      totalTasks: tasks.length,
      quantumEnhancedTasks: quantumEnhanced.length,
      averageCoherence: tasks.reduce((sum, t) => sum + t.quantumState.coherence, 0) / tasks.length,
      interferenceEvents: this.config.enableInterference ? 
        this.interferenceEngine.getInterferenceVisualization().interactions.length : 0,
      annealingConvergence: 0.85, // Placeholder - would come from optimizer
      planningTime: 0, // Updated during planning
      optimizationGain: this.calculateOptimizationGain()
    }
  }

  // Apply quantum evolution effects to tasks
  public evolveQuantumStates(deltaTime: number): void {
    this.activeTasks.forEach(task => {
      // Natural decoherence
      task.quantumState.coherence *= (1 - 0.01 * deltaTime)
      
      // Quantum tunneling for stuck tasks
      if (task.quantumState.coherence < 0.3) {
        task.quantumState.superposition.clear()
        task.quantumState.superposition.set('waiting', 1.0)
        task.quantumState.coherence = 0.1
      }
      
      // Entanglement decay
      if (task.quantumState.entangled.length > 0 && Math.random() < 0.01) {
        const index = Math.floor(Math.random() * task.quantumState.entangled.length)
        task.quantumState.entangled.splice(index, 1)
      }
    })

    // Propagate waves in interference engine
    if (this.config.enableInterference) {
      this.interferenceEngine.propagateWaves(deltaTime)
    }
  }

  // Private implementation methods

  private initializeQuantumComponents(): void {
    // Initialize quantum planner
    this.quantumPlanner = new QuantumInspiredPlanner({
      annealingSteps: this.config.annealingConfig.maxIterations || 1000,
      coherenceThreshold: this.config.coherenceThreshold,
      maxSuperpositionStates: this.config.maxQuantumStates
    })

    // Initialize superposition manager if enabled
    if (this.config.enableSuperposition) {
      this.superpositionManager = new QuantumSuperpositionManager()
    }

    // Initialize interference engine if enabled
    if (this.config.enableInterference) {
      this.interferenceEngine = new QuantumInterferenceEngine(1.0)
    }

    // Initialize annealing optimizer if enabled
    if (this.config.enableAnnealing) {
      this.annealingOptimizer = new QuantumAnnealingOptimizer(
        this.config.annealingConfig,
        (solution) => this.calculatePlanningEnergy(solution),
        (solution) => this.generatePlanningNeighbors(solution)
      )
    }
  }

  private setupEventListeners(): void {
    // Listen to agent updates from main system
    this.agentMeshXR.on('agentAdded', (agent: Agent) => {
      this.onAgentAdded(agent)
    })

    this.agentMeshXR.on('agentUpdated', (agent: Agent) => {
      this.onAgentUpdated(agent)
    })

    this.agentMeshXR.on('agentRemoved', (agent: Agent) => {
      this.onAgentRemoved(agent)
    })

    // Listen to quantum component events
    if (this.config.enableSuperposition) {
      this.superpositionManager.on('measurement', (measurement) => {
        this.onQuantumMeasurement(measurement)
      })
    }

    if (this.config.enableInterference) {
      this.interferenceEngine.on('interferenceCalculated', (results) => {
        this.onInterferenceCalculated(results)
      })
    }
  }

  private createTaskSuperposition(task: Task): void {
    const states = [
      { state: 'waiting', amplitude: 0.6 },
      { state: 'ready', amplitude: 0.3 },
      { state: 'executing', amplitude: 0.1 }
    ]

    this.superpositionManager.createQuantumSystem(task.id, states)
  }

  private addTaskToInterference(task: Task): void {
    const tasks = Array.from(this.activeTasks.values())
    this.interferenceEngine.createTaskWaves(tasks)
  }

  private applyInterferenceResults(tasks: Task[], results: any[]): void {
    results.forEach(result => {
      const task = tasks.find(t => t.id === result.taskId)
      if (task) {
        task.priority = result.modifiedPriority
        task.quantumState.interference = result.interferenceContribution
      }
    })
  }

  private calculateExecutionProbability(task: Task, assignedAgents: string[]): number {
    let probability = 0.5 // Base probability
    
    // Agent assignment factor
    const agentRatio = assignedAgents.length / task.requiredAgents
    probability *= Math.min(1.0, agentRatio)
    
    // Coherence factor
    probability *= task.quantumState.coherence
    
    // Priority factor
    probability *= (task.priority / 10.0)
    
    // Dependency factor
    const dependenciesMet = task.dependencies.every(depId => {
      const depTask = this.activeTasks.get(depId)
      return depTask && depTask.quantumState.superposition.has('completed')
    })
    if (!dependenciesMet) probability *= 0.3
    
    return Math.max(0, Math.min(1, probability))
  }

  private calculateStartTime(task: Task, assignments: Map<string, string[]>): number {
    // Simplified start time calculation
    const dependencyDelays = task.dependencies.map(depId => {
      const depTask = this.activeTasks.get(depId)
      return depTask ? depTask.estimatedDuration : 0
    })
    
    const maxDependencyTime = Math.max(0, ...dependencyDelays)
    const agentAvailability = this.calculateAgentAvailability(assignments.get(task.id) || [])
    
    return Date.now() + maxDependencyTime * 1000 + agentAvailability * 1000
  }

  private calculateCompletionTime(task: Task, assignedAgents: string[]): number {
    const startTime = this.calculateStartTime(task, new Map([[task.id, assignedAgents]]))
    const agentEfficiency = this.calculateAgentEfficiency(assignedAgents)
    const adjustedDuration = task.estimatedDuration / agentEfficiency
    
    return startTime + adjustedDuration * 1000
  }

  private calculateAgentAvailability(agentIds: string[]): number {
    // Simplified agent availability calculation
    return Math.random() * 5 // 0-5 seconds average wait time
  }

  private calculateAgentEfficiency(agentIds: string[]): number {
    const agents = agentIds.map(id => this.agentMeshXR.getAgent(id)).filter(a => a)
    if (agents.length === 0) return 0.1
    
    const totalEfficiency = agents.reduce((sum, agent) => {
      return sum + (agent?.currentState.energy || 1) / 10
    }, 0)
    
    return totalEfficiency / agents.length
  }

  private updateQuantumStatesFromPlanning(tasks: Task[], results: Map<string, QuantumTaskResult>): void {
    tasks.forEach(task => {
      const result = results.get(task.id)
      if (result && result.assignedAgents.length > 0) {
        // Transition to 'ready' state with high probability
        task.quantumState.superposition.clear()
        task.quantumState.superposition.set('ready', 0.8)
        task.quantumState.superposition.set('waiting', 0.2)
        
        // Increase coherence for successfully planned tasks
        task.quantumState.coherence = Math.min(1.0, task.quantumState.coherence + 0.2)
      }
    })
  }

  private calculatePlanningMetrics(
    tasks: Task[], 
    results: Map<string, QuantumTaskResult>, 
    planningTime: number
  ): QuantumPlanningMetrics {
    const quantumEnhanced = tasks.filter(t => t.quantumState.coherence > this.config.coherenceThreshold)
    const avgCoherence = tasks.reduce((sum, t) => sum + t.quantumState.coherence, 0) / tasks.length
    
    return {
      totalTasks: tasks.length,
      quantumEnhancedTasks: quantumEnhanced.length,
      averageCoherence: avgCoherence,
      interferenceEvents: this.config.enableInterference ? 
        this.interferenceEngine.getInterferenceVisualization().interactions.length : 0,
      annealingConvergence: 0.85, // Would come from actual annealing process
      planningTime,
      optimizationGain: this.calculateOptimizationGain()
    }
  }

  private calculateOptimizationGain(): number {
    // Simplified optimization gain calculation
    const totalTasks = this.activeTasks.size
    const optimizedTasks = Array.from(this.planningResults.values())
      .filter(r => r.quantumPriority !== r.originalPriority).length
    
    return totalTasks > 0 ? optimizedTasks / totalTasks : 0
  }

  private async executeQuantumTask(taskResult: QuantumTaskResult): Promise<void> {
    // Emit task execution event to XR system
    this.emit('taskExecutionStarted', taskResult)
    
    // Update task quantum state to 'executing'
    const task = this.activeTasks.get(taskResult.taskId)
    if (task && this.config.enableSuperposition) {
      this.superpositionManager.measureSystem(taskResult.taskId, 'interaction')
    }
    
    // Simulate task execution (in real system, this would trigger actual work)
    await new Promise(resolve => setTimeout(resolve, 100)) // Simulated delay
    
    this.emit('taskExecutionCompleted', taskResult)
  }

  private calculatePlanningEnergy(solution: Map<string, any>): number {
    // Energy function for annealing optimizer
    let energy = 0
    
    // Add energy penalties for poor assignments
    solution.forEach((assignment, taskId) => {
      const task = this.activeTasks.get(taskId)
      if (task) {
        const agents = assignment as string[]
        const mismatch = Math.abs(agents.length - task.requiredAgents)
        energy += mismatch * 10
      }
    })
    
    return energy
  }

  private generatePlanningNeighbors(solution: Map<string, any>): Map<string, any>[] {
    // Generate neighbor solutions for annealing
    const neighbors: Map<string, any>[] = []
    const allAgentIds = this.agentMeshXR.getAllAgents().map(a => a.id)
    
    // Try reassigning agents for each task
    solution.forEach((assignment, taskId) => {
      const currentAgents = assignment as string[]
      
      for (let i = 0; i < Math.min(5, allAgentIds.length); i++) {
        const newSolution = new Map(solution)
        const availableAgents = allAgentIds.filter(id => !currentAgents.includes(id))
        
        if (availableAgents.length > 0) {
          const randomAgent = availableAgents[Math.floor(Math.random() * availableAgents.length)]
          const newAssignment = [...currentAgents.slice(0, -1), randomAgent]
          newSolution.set(taskId, newAssignment)
          neighbors.push(newSolution)
        }
      }
    })
    
    return neighbors
  }

  private startQuantumEvolution(): void {
    // Start quantum state evolution loop
    setInterval(() => {
      if (!this.planningActive) {
        this.evolveQuantumStates(0.1) // 10 Hz evolution
      }
    }, 100)
  }

  // Event handlers
  private onAgentAdded(agent: Agent): void {
    logger.debug('QuantumPlanningIntegration', 'Agent added to quantum system', { agentId: agent.id })
    // Potentially trigger re-planning if agent capabilities are relevant
  }

  private onAgentUpdated(agent: Agent): void {
    // Update quantum calculations based on agent state changes
    if (agent.currentState.status === 'error') {
      // Handle agent errors in quantum planning
      this.handleAgentError(agent)
    }
  }

  private onAgentRemoved(agent: Agent): void {
    // Re-evaluate task assignments that involved this agent
    this.handleAgentRemoval(agent.id)
  }

  private onQuantumMeasurement(measurement: any): void {
    // React to quantum measurements
    const task = this.activeTasks.get(measurement.systemId)
    if (task) {
      logger.debug('QuantumPlanningIntegration', 'Quantum measurement observed', {
        taskId: task.id,
        collapsedState: measurement.collapsedState
      })
    }
  }

  private onInterferenceCalculated(results: any[]): void {
    // React to interference calculations
    logger.debug('QuantumPlanningIntegration', 'Interference patterns calculated', {
      affectedTasks: results.length
    })
  }

  private handleAgentError(agent: Agent): void {
    // Find tasks assigned to this agent and reassign or adjust quantum states
    this.planningResults.forEach(result => {
      if (result.assignedAgents.includes(agent.id)) {
        result.executionProbability *= 0.5 // Reduce execution probability
        
        // Trigger quantum tunneling to find alternative assignments
        const task = this.activeTasks.get(result.taskId)
        if (task && this.config.enableSuperposition) {
          this.superpositionManager.applyQuantumGate(task.id, 'hadamard')
        }
      }
    })
  }

  private handleAgentRemoval(agentId: string): void {
    // Remove agent from all assignments and trigger re-planning if needed
    let needsReplanning = false
    
    this.planningResults.forEach(result => {
      const index = result.assignedAgents.indexOf(agentId)
      if (index !== -1) {
        result.assignedAgents.splice(index, 1)
        result.executionProbability *= 0.3 // Significantly reduce probability
        needsReplanning = true
      }
    })
    
    if (needsReplanning) {
      this.emit('replanningRequired', { cause: 'agentRemoval', agentId })
    }
  }

  // Cleanup
  public dispose(): void {
    logger.info('QuantumPlanningIntegration', 'Disposing quantum planning system')
    
    this.planningActive = false
    this.activeTasks.clear()
    this.planningResults.clear()
    this.removeAllListeners()
  }
}