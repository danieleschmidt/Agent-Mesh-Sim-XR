// Quantum Planning Demo - Demonstrates the complete quantum-inspired task planning system
import { Vector3 } from 'three'
import { QuantumInspiredPlanner, Task } from '../planning/QuantumInspiredPlanner'
import { QuantumSuperpositionManager } from '../planning/QuantumSuperpositionManager'
import { QuantumInterferenceEngine } from '../planning/QuantumInterferenceEngine'
import { QuantumPerformanceOptimizer } from '../planning/QuantumPerformanceOptimizer'
import { QuantumPlanningUtils } from '../planning'
import { Agent } from '../types'

export class QuantumPlanningDemo {
  private planner: QuantumInspiredPlanner
  private superpositionManager: QuantumSuperpositionManager
  private interferenceEngine: QuantumInterferenceEngine
  private performanceOptimizer: QuantumPerformanceOptimizer
  
  constructor() {
    console.log('🌟 Initializing Quantum Planning Demo...')
    
    this.planner = new QuantumInspiredPlanner({
      annealingSteps: 1000,
      initialTemperature: 100.0,
      coolingRate: 0.995,
      coherenceThreshold: 0.7,
      maxSuperpositionStates: 8
    })
    
    this.superpositionManager = new QuantumSuperpositionManager()
    this.interferenceEngine = new QuantumInterferenceEngine(1.0)
    this.performanceOptimizer = new QuantumPerformanceOptimizer({
      cacheSize: 1000,
      cacheTTL: 300000,
      poolSizes: {
        superposition: 100,
        entanglement: 50,
        interference: 25,
        annealing: 10
      },
      workerPoolSize: 4,
      adaptiveOptimization: true
    })
    
    this.setupEventListeners()
  }

  // Create demo scenario with quantum-enhanced tasks
  public async runDemo(): Promise<void> {
    console.log('\n🚀 Starting Quantum Planning Demonstration')
    
    // Step 1: Create quantum-enhanced tasks
    const tasks = this.createDemoTasks()
    console.log(`📋 Created ${tasks.length} quantum-enhanced tasks`)
    
    // Step 2: Create mock agents
    const agents = this.createDemoAgents()
    console.log(`🤖 Created ${agents.length} demo agents`)
    
    // Step 3: Demonstrate quantum superposition
    console.log('\n⚛️  Demonstrating Quantum Superposition...')
    await this.demonstrateQuantumSuperposition(tasks)
    
    // Step 4: Demonstrate quantum interference
    console.log('\n🌊 Demonstrating Quantum Interference...')
    await this.demonstrateQuantumInterference(tasks)
    
    // Step 5: Run quantum planning with performance optimization
    console.log('\n🧠 Running Quantum-Inspired Planning...')
    const startTime = Date.now()
    
    const assignments = await this.performanceOptimizer.computeWithCache(
      'demo-planning',
      () => this.planner.planTasks(tasks, agents)
    )
    
    const planningTime = Date.now() - startTime
    console.log(`✅ Planning completed in ${planningTime}ms`)
    
    // Step 6: Analyze results
    this.analyzeResults(assignments, tasks, agents, planningTime)
    
    // Step 7: Demonstrate performance optimization
    console.log('\n⚡ Demonstrating Performance Optimization...')
    await this.demonstratePerformanceOptimization()
    
    // Step 8: Show quantum state visualization
    console.log('\n📊 Quantum State Visualization:')
    this.showQuantumVisualization()
    
    console.log('\n🎉 Quantum Planning Demo Complete!')
    console.log('🔬 This demonstration showcased:')
    console.log('  ✨ Quantum superposition for task states')
    console.log('  🔗 Quantum entanglement between related tasks')  
    console.log('  🌊 Quantum interference for priority optimization')
    console.log('  🧮 Quantum annealing for assignment optimization')
    console.log('  ⚡ Performance optimization with caching and pooling')
    console.log('  📈 Real-time monitoring and metrics')
  }

  private createDemoTasks(): Task[] {
    const taskDescriptions = [
      'Deploy agent swarm to sector Alpha',
      'Establish communication network',
      'Scan environment for anomalies',
      'Coordinate resource distribution',
      'Execute defensive formations',
      'Analyze collected sensor data',
      'Optimize patrol routes',
      'Maintain system synchronization'
    ]
    
    return taskDescriptions.map((description, index) => {
      const task = QuantumPlanningUtils.createSimpleTask(
        `task-${index + 1}`,
        description,
        Math.floor(Math.random() * 10) + 1, // Priority 1-10
        Math.floor(Math.random() * 3) + 1,  // Required agents 1-3
        Math.floor(Math.random() * 300) + 60 // Duration 60-360 seconds
      )
      
      // Add spatial positioning
      task.position = new Vector3(
        Math.random() * 20 - 10, // -10 to 10
        Math.random() * 20 - 10,
        Math.random() * 20 - 10
      )
      
      // Add dependencies for some tasks
      if (index > 0 && Math.random() < 0.4) {
        task.dependencies = [`task-${Math.floor(Math.random() * index) + 1}`]
      }
      
      return task
    })
  }

  private createDemoAgents(): Agent[] {
    const agentTypes = ['scout', 'worker', 'coordinator', 'specialist']
    
    return Array.from({ length: 12 }, (_, index) => ({
      id: `agent-${index + 1}`,
      type: agentTypes[index % agentTypes.length],
      position: new Vector3(
        Math.random() * 15 - 7.5,
        Math.random() * 15 - 7.5,
        Math.random() * 15 - 7.5
      ),
      velocity: new Vector3(0, 0, 0),
      currentState: {
        status: 'active' as const,
        behavior: Math.random() > 0.8 ? 'idle' : 'working',
        role: agentTypes[index % agentTypes.length],
        energy: Math.floor(Math.random() * 3) + 7, // 7-10
        priority: Math.floor(Math.random() * 8) + 2  // 2-10
      },
      metadata: {
        experience: Math.floor(Math.random() * 100),
        efficiency: 0.7 + Math.random() * 0.3
      },
      activeGoals: [],
      connectedPeers: [],
      metrics: {
        cpuMs: Math.floor(Math.random() * 50) + 10,
        memoryMB: Math.floor(Math.random() * 100) + 50,
        msgPerSec: Math.floor(Math.random() * 10) + 1,
        uptime: Math.floor(Math.random() * 10000) + 1000
      },
      lastUpdate: Date.now()
    }))
  }

  private async demonstrateQuantumSuperposition(tasks: Task[]): Promise<void> {
    // Create quantum systems for each task
    for (const task of tasks.slice(0, 4)) { // Demo with first 4 tasks
      const states = [
        { state: 'waiting', amplitude: 0.6 },
        { state: 'ready', amplitude: 0.5 },
        { state: 'executing', amplitude: 0.3 }
      ]
      
      this.superpositionManager.createQuantumSystem(task.id, states)
      
      console.log(`  ⚛️  ${task.id}: Created superposition with ${states.length} states`)
    }
    
    // Demonstrate quantum gate operations
    console.log('  🎛️  Applying quantum gates...')
    
    // Apply Hadamard gate to create equal superposition
    this.superpositionManager.applyQuantumGate(tasks[0].id, 'hadamard')
    console.log(`    🔄 Applied Hadamard gate to ${tasks[0].id}`)
    
    // Apply phase gates
    this.superpositionManager.applyQuantumGate(tasks[1].id, 'phase', { angle: Math.PI / 4 })
    console.log(`    📐 Applied phase gate to ${tasks[1].id}`)
    
    // Create entanglement between related tasks
    if (tasks[1].dependencies.includes(tasks[0].id)) {
      this.superpositionManager.entangleSystems(tasks[0].id, tasks[1].id, 'functional', 0.8)
      console.log(`    🔗 Entangled ${tasks[0].id} and ${tasks[1].id}`)
    }
    
    // Demonstrate measurement and wavefunction collapse
    const measurement = this.superpositionManager.measureSystem(tasks[2].id)
    console.log(`    📏 Measured ${tasks[2].id}: collapsed to "${measurement.collapsedState}" (probability: ${measurement.probability.toFixed(3)})`)
  }

  private async demonstrateQuantumInterference(tasks: Task[]): Promise<void> {
    // Create task waves for interference
    this.interferenceEngine.createTaskWaves(tasks)
    console.log(`  🌊 Created quantum waves for ${tasks.length} tasks`)
    
    // Create interference patterns
    const constructivePattern = this.interferenceEngine.createInterferencePattern(
      'constructive',
      new Vector3(0, 0, 0),
      1.5,
      2.0,
      8.0,
      15.0
    )
    console.log(`  ➕ Created constructive interference pattern: ${constructivePattern}`)
    
    const destructivePattern = this.interferenceEngine.createInterferencePattern(
      'destructive', 
      new Vector3(5, 5, 0),
      1.2,
      1.5,
      6.0,
      12.0
    )
    console.log(`  ➖ Created destructive interference pattern: ${destructivePattern}`)
    
    // Calculate interference effects on task priorities
    const interferenceResults = this.interferenceEngine.calculateInterference(tasks)
    
    console.log('  📊 Interference effects on task priorities:')
    interferenceResults.forEach(result => {
      if (Math.abs(result.interferenceContribution) > 0.1) {
        const change = result.modifiedPriority - result.originalPriority
        const direction = change > 0 ? '↑' : '↓'
        console.log(`    ${direction} ${result.taskId}: ${result.originalPriority.toFixed(1)} → ${result.modifiedPriority.toFixed(1)} (Δ${change.toFixed(2)})`)
      }
    })
    
    // Apply quantum resonance between compatible tasks
    if (tasks.length >= 2) {
      this.interferenceEngine.applyQuantumResonance(tasks[0].id, tasks[1].id, 0.7)
      console.log(`  🎵 Applied quantum resonance between ${tasks[0].id} and ${tasks[1].id}`)
    }
  }

  private analyzeResults(
    assignments: Map<string, string[]>,
    tasks: Task[],
    agents: Agent[],
    planningTime: number
  ): void {
    console.log('\n📈 Planning Results Analysis:')
    
    // Basic statistics
    const totalTasks = tasks.length
    const assignedTasks = assignments.size
    const assignmentRate = (assignedTasks / totalTasks) * 100
    
    console.log(`  📊 Assignment Rate: ${assignmentRate.toFixed(1)}% (${assignedTasks}/${totalTasks})`)
    console.log(`  ⏱️  Planning Time: ${planningTime}ms`)
    
    // Agent workload analysis
    const agentWorkload = new Map<string, number>()
    agents.forEach(agent => agentWorkload.set(agent.id, 0))
    
    let totalWorkload = 0
    assignments.forEach((assignedAgents, taskId) => {
      const task = tasks.find(t => t.id === taskId)!
      const taskWorkload = task.estimatedDuration
      totalWorkload += taskWorkload
      
      assignedAgents.forEach(agentId => {
        const currentLoad = agentWorkload.get(agentId) || 0
        agentWorkload.set(agentId, currentLoad + taskWorkload / assignedAgents.length)
      })
    })
    
    const workloads = Array.from(agentWorkload.values())
    const avgWorkload = workloads.reduce((sum, load) => sum + load, 0) / workloads.length
    const maxWorkload = Math.max(...workloads)
    const minWorkload = Math.min(...workloads)
    const workloadBalance = 1 - ((maxWorkload - minWorkload) / avgWorkload)
    
    console.log(`  ⚖️  Workload Balance: ${(workloadBalance * 100).toFixed(1)}%`)
    console.log(`  📊 Agent Workload: avg=${avgWorkload.toFixed(0)}s, max=${maxWorkload.toFixed(0)}s, min=${minWorkload.toFixed(0)}s`)
    
    // Dependency satisfaction
    let dependenciesMet = 0
    let totalDependencies = 0
    
    tasks.forEach(task => {
      totalDependencies += task.dependencies.length
      task.dependencies.forEach(depId => {
        const depAssigned = assignments.has(depId)
        const taskAssigned = assignments.has(task.id)
        if (depAssigned && taskAssigned) {
          dependenciesMet++
        }
      })
    })
    
    const dependencyRate = totalDependencies > 0 ? (dependenciesMet / totalDependencies) * 100 : 100
    console.log(`  🔗 Dependency Satisfaction: ${dependencyRate.toFixed(1)}% (${dependenciesMet}/${totalDependencies})`)
    
    // Quantum enhancement analysis
    const quantumViz = this.planner.getQuantumStateVisualization()
    console.log(`  ⚛️  Quantum Systems: ${quantumViz.tasks.length}`)
    console.log(`  🔗 Entangled Tasks: ${quantumViz.tasks.filter(t => t.quantumState.entangled.length > 0).length}`)
    
    const avgCoherence = quantumViz.tasks.reduce((sum, t) => sum + t.quantumState.coherence, 0) / quantumViz.tasks.length
    console.log(`  🌟 Average Coherence: ${avgCoherence.toFixed(3)}`)
  }

  private async demonstratePerformanceOptimization(): Promise<void> {
    // Demonstrate caching
    console.log('  💾 Testing computation caching...')
    
    const expensiveComputation = async () => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Simulate work
      return { result: 'complex-calculation', timestamp: Date.now() }
    }
    
    // First call - cache miss
    const start1 = Date.now()
    await this.performanceOptimizer.computeWithCache('expensive-calc', expensiveComputation)
    const time1 = Date.now() - start1
    
    // Second call - cache hit
    const start2 = Date.now()
    await this.performanceOptimizer.computeWithCache('expensive-calc', expensiveComputation)
    const time2 = Date.now() - start2
    
    console.log(`    🐌 Cache Miss: ${time1}ms`)
    console.log(`    ⚡ Cache Hit: ${time2}ms (${((time1 - time2) / time1 * 100).toFixed(1)}% faster)`)
    
    // Demonstrate resource pooling
    console.log('  🏊 Testing resource pooling...')
    
    const resources = []
    for (let i = 0; i < 5; i++) {
      const resource = this.performanceOptimizer.borrowResource('superposition')
      if (resource) {
        resources.push(resource)
      }
    }
    
    console.log(`    📦 Borrowed ${resources.length} superposition resources`)
    
    resources.forEach(resource => {
      this.performanceOptimizer.returnResource('superposition', resource)
    })
    
    console.log(`    ♻️  Returned ${resources.length} resources to pool`)
    
    // Demonstrate parallel processing
    console.log('  🔄 Testing parallel processing...')
    
    const parallelTasks = Array.from({ length: 8 }, (_, i) => ({
      id: `parallel-task-${i}`,
      type: 'measurement' as const,
      priority: Math.floor(Math.random() * 10),
      payload: { data: `test-data-${i}` }
    }))
    
    const parallelStart = Date.now()
    const parallelResults = await this.performanceOptimizer.executeParallel(parallelTasks)
    const parallelTime = Date.now() - parallelStart
    
    console.log(`    ⚡ Processed ${parallelTasks.length} tasks in parallel: ${parallelTime}ms`)
    console.log(`    ✅ Success rate: ${(parallelResults.size / parallelTasks.length * 100).toFixed(1)}%`)
    
    // Show performance metrics
    const metrics = this.performanceOptimizer.getPerformanceMetrics()
    console.log(`  📊 Performance Metrics:`)
    console.log(`    💾 Cache Hit Rate: ${(metrics.cacheHitRate * 100).toFixed(1)}%`)
    console.log(`    ⏱️  Avg Computation Time: ${metrics.averageComputationTime.toFixed(1)}ms`)
    console.log(`    👷 Worker Utilization: ${(metrics.workerUtilization * 100).toFixed(1)}%`)
    console.log(`    🔄 Concurrent Operations: ${metrics.concurrentOperations}`)
  }

  private showQuantumVisualization(): void {
    const viz = this.planner.getQuantumStateVisualization()
    const interferenceViz = this.interferenceEngine.getInterferenceVisualization()
    const superpositionViz = this.superpositionManager.getGlobalQuantumState()
    
    console.log('  ⚛️  Quantum State Summary:')
    console.log(`    📊 Total Quantum Tasks: ${viz.tasks.length}`)
    console.log(`    🔗 Entangled Pairs: ${viz.tasks.filter(t => t.quantumState.entangled.length > 0).length}`)
    console.log(`    🌟 Average Coherence: ${(viz.tasks.reduce((sum, t) => sum + t.quantumState.coherence, 0) / viz.tasks.length).toFixed(3)}`)
    
    console.log('  🌊 Interference Summary:')
    console.log(`    📡 Active Waves: ${interferenceViz.waves.length}`)
    console.log(`    🎵 Wave Interactions: ${interferenceViz.interactions.length}`)
    console.log(`    📐 Interference Patterns: ${interferenceViz.patterns.length}`)
    
    console.log('  🎯 Superposition Summary:')
    console.log(`    🔬 Quantum Systems: ${superpositionViz.systems.length}`)
    console.log(`    🔗 Entanglements: ${superpositionViz.entanglements.length}`)
    console.log(`    📏 Total Measurements: ${superpositionViz.measurements.length}`)
    console.log(`    🌍 Global Coherence: ${superpositionViz.globalCoherence.toFixed(3)}`)
  }

  private setupEventListeners(): void {
    // Planner events
    this.planner.on('planningComplete', (data) => {
      console.log(`🎯 Planning completed with ${data.tasks.length} tasks`)
    })
    
    this.planner.on('annealingProgress', (data) => {
      if (data.step % 200 === 0) {
        console.log(`  🔥 Annealing step ${data.step}: T=${data.temperature.toFixed(2)}, E=${data.energy.toFixed(2)}`)
      }
    })
    
    // Superposition events
    this.superpositionManager.on('systemCreated', (data) => {
      console.log(`    ⚛️  Created quantum system: ${data.systemId}`)
    })
    
    this.superpositionManager.on('measurement', (data) => {
      console.log(`    📏 Quantum measurement: ${data.systemId} → ${data.collapsedState}`)
    })
    
    // Interference events
    this.interferenceEngine.on('interferenceCalculated', (results) => {
      console.log(`    🌊 Calculated interference for ${results.length} tasks`)
    })
    
    // Performance events
    this.performanceOptimizer.on('cacheHit', (data) => {
      console.log(`    💾 Cache hit: ${data.key} (${data.hitCount} hits)`)
    })
    
    this.performanceOptimizer.on('parallelExecutionCompleted', (data) => {
      console.log(`    ⚡ Parallel execution: ${data.taskCount} tasks in ${data.duration}ms`)
    })
  }

  public dispose(): void {
    console.log('🧹 Cleaning up quantum planning demo...')
    this.superpositionManager.dispose?.()
    this.interferenceEngine.dispose?.()
    this.performanceOptimizer.dispose()
  }
}

// Demo runner
export async function runQuantumPlanningDemo(): Promise<void> {
  const demo = new QuantumPlanningDemo()
  
  try {
    await demo.runDemo()
  } catch (error) {
    console.error('❌ Demo failed:', error)
  } finally {
    demo.dispose()
  }
}

// Auto-run if this file is executed directly
if (typeof window === 'undefined' && require.main === module) {
  runQuantumPlanningDemo().then(() => {
    console.log('Demo completed successfully!')
  }).catch(error => {
    console.error('Demo failed:', error)
    process.exit(1)
  })
}