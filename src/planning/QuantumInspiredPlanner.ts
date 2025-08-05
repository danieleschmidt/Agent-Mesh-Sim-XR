import { EventEmitter } from 'eventemitter3'
import { Vector3 } from 'three'
import { Agent, AgentState, CausalEvent } from '../types'

export interface Task {
  id: string
  description: string
  priority: number
  dependencies: string[]
  estimatedDuration: number
  requiredAgents: number
  position?: Vector3
  constraints: TaskConstraint[]
  quantumState: QuantumTaskState
}

export interface TaskConstraint {
  type: 'time' | 'resource' | 'dependency' | 'spatial'
  value: any
  weight: number
}

export interface QuantumTaskState {
  superposition: Map<string, number> // state -> probability amplitude
  entangled: string[] // entangled task IDs
  coherence: number // 0-1, higher = more quantum effects
  interference: number // -1 to 1, affects priority
}

export interface PlanningNode {
  taskId: string
  state: string
  probability: number
  energy: number
  neighbors: string[]
}

export interface QuantumPlanningConfig {
  annealingSteps: number
  initialTemperature: number
  coolingRate: number
  coherenceThreshold: number
  maxSuperpositionStates: number
}

export class QuantumInspiredPlanner extends EventEmitter {
  private tasks: Map<string, Task> = new Map()
  private agents: Map<string, Agent> = new Map()
  private planningGraph: Map<string, PlanningNode> = new Map()
  private config: QuantumPlanningConfig
  private temperature: number
  private currentStep: number = 0

  constructor(config: Partial<QuantumPlanningConfig> = {}) {
    super()
    
    this.config = {
      annealingSteps: 1000,
      initialTemperature: 100.0,
      coolingRate: 0.995,
      coherenceThreshold: 0.8,
      maxSuperpositionStates: 5,
      ...config
    }
    
    this.temperature = this.config.initialTemperature
  }

  // Core quantum-inspired planning algorithm
  public async planTasks(tasks: Task[], agents: Agent[]): Promise<Map<string, string[]>> {
    this.tasks.clear()
    this.agents.clear()
    this.planningGraph.clear()
    
    // Initialize quantum states
    tasks.forEach(task => {
      this.tasks.set(task.id, this.initializeQuantumState(task))
    })
    
    agents.forEach(agent => {
      this.agents.set(agent.id, agent)
    })
    
    // Build quantum planning graph
    this.buildPlanningGraph()
    
    // Apply quantum annealing optimization
    const optimizedPlan = await this.quantumAnnealing()
    
    this.emit('planningComplete', {
      tasks: Array.from(this.tasks.values()),
      assignments: optimizedPlan,
      metrics: this.calculatePlanningMetrics()
    })
    
    return optimizedPlan
  }

  // Initialize task with quantum superposition of possible states
  private initializeQuantumState(task: Task): Task {
    const quantumTask = { ...task }
    
    // Create superposition of possible execution states
    const states = ['waiting', 'ready', 'executing', 'paused', 'completed']
    const amplitudes = new Map<string, number>()
    
    // Initial equal superposition with slight bias toward 'waiting'
    states.forEach(state => {
      amplitudes.set(state, state === 'waiting' ? 0.6 : 0.1)
    })
    
    quantumTask.quantumState = {
      superposition: amplitudes,
      entangled: [],
      coherence: 1.0,
      interference: 0.0
    }
    
    return quantumTask
  }

  // Build quantum planning graph with entanglement relationships
  private buildPlanningGraph(): void {
    const tasks = Array.from(this.tasks.values())
    
    tasks.forEach(task => {
      task.quantumState.superposition.forEach((amplitude, state) => {
        const nodeId = `${task.id}_${state}`
        
        this.planningGraph.set(nodeId, {
          taskId: task.id,
          state,
          probability: amplitude * amplitude, // |amplitude|^2
          energy: this.calculateStateEnergy(task, state),
          neighbors: []
        })
      })
    })
    
    // Create entanglement between dependent tasks
    this.createQuantumEntanglement()
    
    // Apply quantum interference effects
    this.applyQuantumInterference()
  }

  // Create quantum entanglement between related tasks
  private createQuantumEntanglement(): void {
    const tasks = Array.from(this.tasks.values())
    
    tasks.forEach(task => {
      // Entangle with dependency tasks
      task.dependencies.forEach(depId => {
        const depTask = this.tasks.get(depId)
        if (depTask) {
          task.quantumState.entangled.push(depId)
          depTask.quantumState.entangled.push(task.id)
        }
      })
      
      // Entangle spatially close tasks
      tasks.forEach(otherTask => {
        if (task.id !== otherTask.id && task.position && otherTask.position) {
          const distance = task.position.distanceTo(otherTask.position)
          if (distance < 5.0) { // 5 unit threshold
            const entanglementStrength = Math.exp(-distance / 2.0)
            if (entanglementStrength > 0.3) {
              task.quantumState.entangled.push(otherTask.id)
            }
          }
        }
      })
    })
  }

  // Apply quantum interference to adjust task priorities
  private applyQuantumInterference(): void {
    this.tasks.forEach(task => {
      let interferenceSum = 0
      
      task.quantumState.entangled.forEach(entangledId => {
        const entangledTask = this.tasks.get(entangledId)
        if (entangledTask) {
          // Calculate interference based on phase relationship
          const phase1 = this.calculateTaskPhase(task)
          const phase2 = this.calculateTaskPhase(entangledTask)
          const phaseDiff = Math.abs(phase1 - phase2)
          
          // Constructive interference increases priority
          const interference = Math.cos(phaseDiff) * entangledTask.quantumState.coherence
          interferenceSum += interference
        }
      })
      
      task.quantumState.interference = Math.tanh(interferenceSum / Math.max(1, task.quantumState.entangled.length))
    })
  }

  // Calculate quantum phase for task based on its properties
  private calculateTaskPhase(task: Task): number {
    return (task.priority * task.estimatedDuration) % (2 * Math.PI)
  }

  // Quantum annealing optimization for task assignment
  private async quantumAnnealing(): Promise<Map<string, string[]>> {
    let bestAssignment = this.generateRandomAssignment()
    let bestEnergy = this.calculateSystemEnergy(bestAssignment)
    
    for (let step = 0; step < this.config.annealingSteps; step++) {
      this.currentStep = step
      
      // Generate neighboring solution using quantum tunneling
      const newAssignment = this.quantumTunnel(bestAssignment)
      const newEnergy = this.calculateSystemEnergy(newAssignment)
      
      // Quantum acceptance probability
      const deltaE = newEnergy - bestEnergy
      const acceptanceProbability = deltaE < 0 ? 1.0 : Math.exp(-deltaE / this.temperature)
      
      if (Math.random() < acceptanceProbability) {
        bestAssignment = newAssignment
        bestEnergy = newEnergy
        
        // Update quantum states based on acceptance
        this.updateQuantumStates(newAssignment)
      }
      
      // Quantum decoherence - reduce coherence over time
      this.applyDecoherence()
      
      // Cool down temperature
      this.temperature *= this.config.coolingRate
      
      // Emit progress
      if (step % 100 === 0) {
        this.emit('annealingProgress', {
          step,
          temperature: this.temperature,
          energy: bestEnergy,
          assignment: bestAssignment
        })
      }
    }
    
    return bestAssignment
  }

  // Quantum tunneling to explore solution space
  private quantumTunnel(currentAssignment: Map<string, string[]>): Map<string, string[]> {
    const newAssignment = new Map(currentAssignment)
    const tasks = Array.from(this.tasks.keys())
    const agents = Array.from(this.agents.keys())
    
    // Select random task with probability based on quantum coherence
    const task = this.selectTaskByCoherence(tasks)
    const currentAgents = newAssignment.get(task) || []
    
    // Quantum tunneling: reassign with probability based on superposition
    const taskObj = this.tasks.get(task)!
    const tunnelingProbability = taskObj.quantumState.coherence * this.temperature / this.config.initialTemperature
    
    if (Math.random() < tunnelingProbability) {
      // Reassign using quantum probability amplitudes
      const newAgentCount = Math.min(taskObj.requiredAgents, agents.length)
      const selectedAgents = this.selectAgentsByQuantumProbability(agents, newAgentCount)
      newAssignment.set(task, selectedAgents)
    }
    
    return newAssignment
  }

  // Select task based on quantum coherence probability
  private selectTaskByCoherence(tasks: string[]): string {
    const weights = tasks.map(taskId => {
      const task = this.tasks.get(taskId)!
      return task.quantumState.coherence
    })
    
    return this.weightedRandomSelect(tasks, weights)
  }

  // Select agents using quantum probability distribution
  private selectAgentsByQuantumProbability(agents: string[], count: number): string[] {
    const agentWeights = agents.map(agentId => {
      const agent = this.agents.get(agentId)!
      // Weight based on agent state and quantum interference
      return agent.currentState.energy * (1 + Math.random() * 0.2) // quantum uncertainty
    })
    
    const selected: string[] = []
    const availableAgents = [...agents]
    const availableWeights = [...agentWeights]
    
    for (let i = 0; i < count && availableAgents.length > 0; i++) {
      const selectedIndex = this.weightedRandomSelectIndex(availableWeights)
      selected.push(availableAgents[selectedIndex])
      
      // Remove selected agent
      availableAgents.splice(selectedIndex, 1)
      availableWeights.splice(selectedIndex, 1)
    }
    
    return selected
  }

  // Weighted random selection utility
  private weightedRandomSelect(items: string[], weights: number[]): string {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const random = Math.random() * totalWeight
    
    let weightSum = 0
    for (let i = 0; i < items.length; i++) {
      weightSum += weights[i]
      if (random <= weightSum) {
        return items[i]
      }
    }
    
    return items[items.length - 1]
  }

  private weightedRandomSelectIndex(weights: number[]): number {
    const totalWeight = weights.reduce((sum, w) => sum + w, 0)
    const random = Math.random() * totalWeight
    
    let weightSum = 0
    for (let i = 0; i < weights.length; i++) {
      weightSum += weights[i]
      if (random <= weightSum) {
        return i
      }
    }
    
    return weights.length - 1
  }

  // Calculate energy of a task in a given state
  private calculateStateEnergy(task: Task, state: string): number {
    let energy = 0
    
    // Base energy from priority (higher priority = lower energy)
    energy += (10 - task.priority) * 10
    
    // Duration penalty
    energy += task.estimatedDuration * 0.1
    
    // State-specific energy
    switch (state) {
      case 'waiting':
        energy += 0
        break
      case 'ready':
        energy -= 5 // Preferred state
        break
      case 'executing':
        energy += task.estimatedDuration * 0.05
        break
      case 'paused':
        energy += 20 // High penalty
        break
      case 'completed':
        energy -= 50 // Very low energy (stable)
        break
    }
    
    // Constraint penalties
    task.constraints.forEach(constraint => {
      energy += constraint.weight * this.evaluateConstraintViolation(constraint, state)
    })
    
    return energy
  }

  // Calculate total system energy for assignment
  private calculateSystemEnergy(assignment: Map<string, string[]>): number {
    let totalEnergy = 0
    
    assignment.forEach((agentIds, taskId) => {
      const task = this.tasks.get(taskId)!
      
      // Task assignment energy
      const assignmentPenalty = Math.abs(agentIds.length - task.requiredAgents) * 50
      totalEnergy += assignmentPenalty
      
      // Agent workload energy
      agentIds.forEach(agentId => {
        const agent = this.agents.get(agentId)!
        totalEnergy += (10 - agent.currentState.energy) * 2
      })
      
      // Quantum interference contribution
      totalEnergy += task.quantumState.interference * -10 // Negative = good
    })
    
    // Entanglement energy
    totalEnergy += this.calculateEntanglementEnergy(assignment)
    
    return totalEnergy
  }

  // Calculate energy contribution from quantum entanglement
  private calculateEntanglementEnergy(assignment: Map<string, string[]>): number {
    let entanglementEnergy = 0
    
    this.tasks.forEach(task => {
      task.quantumState.entangled.forEach(entangledId => {
        const entangledTask = this.tasks.get(entangledId)
        if (entangledTask) {
          const task1Agents = assignment.get(task.id) || []
          const task2Agents = assignment.get(entangledId) || []
          
          // Energy bonus for compatible assignments
          const sharedAgents = task1Agents.filter(id => task2Agents.includes(id))
          entanglementEnergy -= sharedAgents.length * 5 // Bonus for shared agents
          
          // Penalty for conflicting temporal assignments
          if (this.hasTemporalConflict(task, entangledTask)) {
            entanglementEnergy += 25
          }
        }
      })
    })
    
    return entanglementEnergy
  }

  // Check for temporal conflicts between entangled tasks
  private hasTemporalConflict(task1: Task, task2: Task): boolean {
    // Simplified temporal conflict detection
    return task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)
  }

  // Generate random initial assignment
  private generateRandomAssignment(): Map<string, string[]> {
    const assignment = new Map<string, string[]>()
    const agents = Array.from(this.agents.keys())
    
    this.tasks.forEach(task => {
      const requiredAgents = Math.min(task.requiredAgents, agents.length)
      const shuffled = [...agents].sort(() => Math.random() - 0.5)
      assignment.set(task.id, shuffled.slice(0, requiredAgents))
    })
    
    return assignment
  }

  // Update quantum states based on annealing step
  private updateQuantumStates(assignment: Map<string, string[]>): void {
    this.tasks.forEach(task => {
      const assignedAgents = assignment.get(task.id) || []
      
      // Update superposition based on assignment success
      const success = assignedAgents.length === task.requiredAgents
      
      task.quantumState.superposition.forEach((amplitude, state) => {
        if (state === 'ready' && success) {
          task.quantumState.superposition.set(state, Math.min(1.0, amplitude * 1.1))
        } else if (state === 'waiting' && !success) {
          task.quantumState.superposition.set(state, Math.min(1.0, amplitude * 1.05))
        }
      })
      
      // Normalize amplitudes
      this.normalizeQuantumAmplitudes(task)
    })
  }

  // Apply quantum decoherence
  private applyDecoherence(): void {
    const decoherenceRate = 0.99 - (this.currentStep / this.config.annealingSteps) * 0.1
    
    this.tasks.forEach(task => {
      task.quantumState.coherence *= decoherenceRate
      
      // Reduce superposition as coherence decreases
      if (task.quantumState.coherence < this.config.coherenceThreshold) {
        this.collapseQuantumState(task)
      }
    })
  }

  // Collapse quantum superposition to classical state
  private collapseQuantumState(task: Task): void {
    let maxAmplitude = 0
    let dominantState = 'waiting'
    
    task.quantumState.superposition.forEach((amplitude, state) => {
      if (amplitude > maxAmplitude) {
        maxAmplitude = amplitude
        dominantState = state
      }
    })
    
    // Collapse to dominant state
    task.quantumState.superposition.clear()
    task.quantumState.superposition.set(dominantState, 1.0)
    task.quantumState.coherence = 0.0
  }

  // Normalize quantum amplitude probabilities
  private normalizeQuantumAmplitudes(task: Task): void {
    const amplitudes = Array.from(task.quantumState.superposition.values())
    const norm = Math.sqrt(amplitudes.reduce((sum, amp) => sum + amp * amp, 0))
    
    if (norm > 0) {
      task.quantumState.superposition.forEach((amplitude, state) => {
        task.quantumState.superposition.set(state, amplitude / norm)
      })
    }
  }

  // Evaluate constraint violation penalty
  private evaluateConstraintViolation(constraint: TaskConstraint, state: string): number {
    switch (constraint.type) {
      case 'time':
        return state === 'paused' ? constraint.value : 0
      case 'resource':
        return state === 'executing' ? constraint.value * 0.5 : 0
      case 'dependency':
        return state === 'ready' && !this.areDependenciesMet(constraint.value) ? 100 : 0
      case 'spatial':
        return 0 // Simplified for now
      default:
        return 0
    }
  }

  // Check if task dependencies are met
  private areDependenciesMet(dependencies: string[]): boolean {
    return dependencies.every(depId => {
      const depTask = this.tasks.get(depId)
      return depTask && depTask.quantumState.superposition.has('completed')
    })
  }

  // Calculate planning metrics
  private calculatePlanningMetrics(): any {
    const totalTasks = this.tasks.size
    const entangledTasks = Array.from(this.tasks.values()).filter(t => t.quantumState.entangled.length > 0).length
    const avgCoherence = Array.from(this.tasks.values()).reduce((sum, t) => sum + t.quantumState.coherence, 0) / totalTasks
    
    return {
      totalTasks,
      entangledTasks,
      entanglementRatio: entangledTasks / totalTasks,
      averageCoherence: avgCoherence,
      finalTemperature: this.temperature,
      annealingSteps: this.currentStep
    }
  }

  // Get current quantum state visualization data
  public getQuantumStateVisualization(): any {
    const stateData = Array.from(this.tasks.entries()).map(([taskId, task]) => ({
      taskId,
      superposition: Array.from(task.quantumState.superposition.entries()),
      entangled: task.quantumState.entangled,
      coherence: task.quantumState.coherence,
      interference: task.quantumState.interference
    }))
    
    return {
      tasks: stateData,
      planningGraph: Array.from(this.planningGraph.entries()).map(([nodeId, node]) => ({
        nodeId,
        ...node
      }))
    }
  }
}