import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { Vector3 } from 'three'
import { QuantumInspiredPlanner, Task } from '../../planning/QuantumInspiredPlanner'
import { Agent } from '../../types'

describe('QuantumInspiredPlanner', () => {
  let planner: QuantumInspiredPlanner
  let mockTasks: Task[]
  let mockAgents: Agent[]

  beforeEach(() => {
    planner = new QuantumInspiredPlanner({
      annealingSteps: 100,
      initialTemperature: 50.0,
      coolingRate: 0.95,
      coherenceThreshold: 0.5,
      maxSuperpositionStates: 5
    })

    mockTasks = [
      {
        id: 'task1',
        description: 'Test task 1',
        priority: 8,
        dependencies: [],
        estimatedDuration: 100,
        requiredAgents: 2,
        position: new Vector3(0, 0, 0),
        constraints: [],
        quantumState: {
          superposition: new Map([
            ['waiting', 0.8],
            ['ready', 0.2]
          ]),
          entangled: [],
          coherence: 1.0,
          interference: 0.0
        }
      },
      {
        id: 'task2',
        description: 'Test task 2',
        priority: 6,
        dependencies: ['task1'],
        estimatedDuration: 150,
        requiredAgents: 3,
        position: new Vector3(5, 0, 0),
        constraints: [{
          type: 'time',
          value: 200,
          weight: 1.0
        }],
        quantumState: {
          superposition: new Map([
            ['waiting', 1.0]
          ]),
          entangled: ['task1'],
          coherence: 0.9,
          interference: 0.1
        }
      }
    ]

    mockAgents = [
      {
        id: 'agent1',
        type: 'worker',
        position: new Vector3(1, 0, 0),
        velocity: new Vector3(0, 0, 0),
        currentState: {
          status: 'active',
          behavior: 'idle',
          role: 'worker',
          energy: 8,
          priority: 5
        },
        metadata: {},
        activeGoals: [],
        connectedPeers: [],
        metrics: {
          cpuMs: 10,
          memoryMB: 50,
          msgPerSec: 1,
          uptime: 1000
        },
        lastUpdate: Date.now()
      },
      {
        id: 'agent2',
        type: 'worker',
        position: new Vector3(2, 0, 0),
        velocity: new Vector3(0, 0, 0),
        currentState: {
          status: 'active',
          behavior: 'working',
          role: 'specialist',
          energy: 9,
          priority: 7
        },
        metadata: {},
        activeGoals: ['task1'],
        connectedPeers: ['agent1'],
        metrics: {
          cpuMs: 15,
          memoryMB: 60,
          msgPerSec: 2,
          uptime: 2000
        },
        lastUpdate: Date.now()
      },
      {
        id: 'agent3',
        type: 'coordinator',
        position: new Vector3(3, 0, 0),
        velocity: new Vector3(0, 0, 0),
        currentState: {
          status: 'active',
          behavior: 'coordinating',
          role: 'coordinator',
          energy: 7,
          priority: 9
        },
        metadata: {},
        activeGoals: [],
        connectedPeers: ['agent1', 'agent2'],
        metrics: {
          cpuMs: 20,
          memoryMB: 80,
          msgPerSec: 5,
          uptime: 3000
        },
        lastUpdate: Date.now()
      }
    ]
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultPlanner = new QuantumInspiredPlanner()
      expect(defaultPlanner).toBeDefined()
    })

    it('should initialize with custom configuration', () => {
      const config = {
        annealingSteps: 500,
        initialTemperature: 200.0,
        coolingRate: 0.99,
        coherenceThreshold: 0.8,
        maxSuperpositionStates: 10
      }
      
      const customPlanner = new QuantumInspiredPlanner(config)
      expect(customPlanner).toBeDefined()
    })
  })

  describe('Task Planning', () => {
    it('should plan tasks and return assignments', async () => {
      const assignments = await planner.planTasks(mockTasks, mockAgents)
      
      expect(assignments).toBeDefined()
      expect(assignments.size).toBe(mockTasks.length)
      
      // Check that all tasks are assigned
      mockTasks.forEach(task => {
        expect(assignments.has(task.id)).toBe(true)
        const assignedAgents = assignments.get(task.id)!
        expect(Array.isArray(assignedAgents)).toBe(true)
      })
    })

    it('should respect task dependencies', async () => {
      const assignments = await planner.planTasks(mockTasks, mockAgents)
      
      // Task2 depends on task1, so it should be planned accordingly
      const task1Agents = assignments.get('task1')!
      const task2Agents = assignments.get('task2')!
      
      expect(task1Agents.length).toBeGreaterThan(0)
      expect(task2Agents.length).toBeGreaterThan(0)
    })

    it('should handle empty task list', async () => {
      const assignments = await planner.planTasks([], mockAgents)
      expect(assignments.size).toBe(0)
    })

    it('should handle empty agent list', async () => {
      const assignments = await planner.planTasks(mockTasks, [])
      
      // Should still return assignments, but they might be empty
      expect(assignments).toBeDefined()
      expect(assignments.size).toBe(mockTasks.length)
    })

    it('should emit planning events', async () => {
      const planningCompleteCallback = vi.fn()
      const annealingProgressCallback = vi.fn()
      
      planner.on('planningComplete', planningCompleteCallback)
      planner.on('annealingProgress', annealingProgressCallback)
      
      await planner.planTasks(mockTasks, mockAgents)
      
      expect(planningCompleteCallback).toHaveBeenCalledTimes(1)
      expect(annealingProgressCallback).toHaveBeenCalled()
    })
  })

  describe('Quantum State Management', () => {
    it('should initialize quantum states for tasks', async () => {
      await planner.planTasks(mockTasks, mockAgents)
      
      mockTasks.forEach(task => {
        expect(task.quantumState.superposition.size).toBeGreaterThan(0)
        expect(task.quantumState.coherence).toBeGreaterThanOrEqual(0)
        expect(task.quantumState.coherence).toBeLessThanOrEqual(1)
      })
    })

    it('should create quantum entanglement between dependent tasks', async () => {
      await planner.planTasks(mockTasks, mockAgents)
      
      const task1 = mockTasks.find(t => t.id === 'task1')!
      const task2 = mockTasks.find(t => t.id === 'task2')!
      
      // Task2 depends on task1, so they should be entangled
      expect(task2.quantumState.entangled).toContain('task1')
    })

    it('should apply quantum interference effects', async () => {
      const beforeInterference = mockTasks.map(t => ({ ...t.quantumState }))
      
      await planner.planTasks(mockTasks, mockAgents)
      
      // Check that interference values have been calculated
      mockTasks.forEach((task, index) => {
        // Interference should be calculated (may be zero, but should be a number)
        expect(typeof task.quantumState.interference).toBe('number')
      })
    })
  })

  describe('Quantum Annealing', () => {
    it('should perform annealing optimization', async () => {
      const plannerSpy = vi.spyOn(planner as any, 'quantumAnnealing')
      
      await planner.planTasks(mockTasks, mockAgents)
      
      expect(plannerSpy).toHaveBeenCalled()
    })

    it('should reduce temperature during annealing', async () => {
      const annealingProgressEvents: any[] = []
      
      planner.on('annealingProgress', (event) => {
        annealingProgressEvents.push(event)
      })
      
      await planner.planTasks(mockTasks, mockAgents)
      
      if (annealingProgressEvents.length > 1) {
        // Temperature should decrease over time
        const firstEvent = annealingProgressEvents[0]
        const lastEvent = annealingProgressEvents[annealingProgressEvents.length - 1]
        
        expect(lastEvent.temperature).toBeLessThan(firstEvent.temperature)
      }
    })

    it('should find better solutions over time', async () => {
      const annealingProgressEvents: any[] = []
      
      planner.on('annealingProgress', (event) => {
        annealingProgressEvents.push(event)
      })
      
      await planner.planTasks(mockTasks, mockAgents)
      
      if (annealingProgressEvents.length > 1) {
        // Energy should generally decrease (better solutions)
        const firstEvent = annealingProgressEvents[0]
        const lastEvent = annealingProgressEvents[annealingProgressEvents.length - 1]
        
        expect(lastEvent.energy).toBeLessThanOrEqual(firstEvent.energy)
      }
    })
  })

  describe('Performance and Metrics', () => {
    it('should calculate planning metrics', async () => {
      const planningCompleteEvent = await new Promise<any>((resolve) => {
        planner.on('planningComplete', resolve)
        planner.planTasks(mockTasks, mockAgents)
      })
      
      expect(planningCompleteEvent.metrics).toBeDefined()
      expect(planningCompleteEvent.metrics.totalTasks).toBe(mockTasks.length)
      expect(planningCompleteEvent.metrics.averageCoherence).toBeGreaterThanOrEqual(0)
      expect(planningCompleteEvent.metrics.averageCoherence).toBeLessThanOrEqual(1)
    })

    it('should provide quantum state visualization data', async () => {
      await planner.planTasks(mockTasks, mockAgents)
      
      const vizData = planner.getQuantumStateVisualization()
      
      expect(vizData).toBeDefined()
      expect(vizData.tasks).toBeDefined()
      expect(vizData.planningGraph).toBeDefined()
      expect(Array.isArray(vizData.tasks)).toBe(true)
      expect(Array.isArray(vizData.planningGraph)).toBe(true)
    })

    it('should complete planning within reasonable time', async () => {
      const startTime = Date.now()
      
      await planner.planTasks(mockTasks, mockAgents)
      
      const duration = Date.now() - startTime
      
      // Should complete within 5 seconds for small test
      expect(duration).toBeLessThan(5000)
    }, 10000)
  })

  describe('Edge Cases and Error Handling', () => {
    it('should handle tasks with circular dependencies gracefully', async () => {
      const circularTasks: Task[] = [
        {
          ...mockTasks[0],
          id: 'taskA',
          dependencies: ['taskB']
        },
        {
          ...mockTasks[1],
          id: 'taskB',
          dependencies: ['taskA']
        }
      ]
      
      // Should not throw error
      await expect(planner.planTasks(circularTasks, mockAgents)).resolves.toBeDefined()
    })

    it('should handle tasks with invalid quantum states', async () => {
      const invalidTask: Task = {
        ...mockTasks[0],
        quantumState: {
          superposition: new Map([
            ['invalid', -1] // Invalid negative amplitude
          ]),
          entangled: [],
          coherence: 2.0, // Invalid coherence > 1
          interference: 0.0
        }
      }
      
      // Should not throw error and should normalize states
      await expect(planner.planTasks([invalidTask], mockAgents)).resolves.toBeDefined()
    })

    it('should handle very large task sets', async () => {
      const largeTasks: Task[] = Array.from({ length: 100 }, (_, i) => ({
        id: `task${i}`,
        description: `Large task ${i}`,
        priority: Math.floor(Math.random() * 10),
        dependencies: i > 0 ? [`task${i-1}`] : [],
        estimatedDuration: Math.floor(Math.random() * 200) + 50,
        requiredAgents: Math.floor(Math.random() * 3) + 1,
        constraints: [],
        quantumState: {
          superposition: new Map([
            ['waiting', 0.8],
            ['ready', 0.2]
          ]),
          entangled: [],
          coherence: 1.0,
          interference: 0.0
        }
      }))
      
      const startTime = Date.now()
      const assignments = await planner.planTasks(largeTasks, mockAgents)
      const duration = Date.now() - startTime
      
      expect(assignments.size).toBe(largeTasks.length)
      expect(duration).toBeLessThan(10000) // Should complete within 10 seconds
    }, 15000)

    it('should maintain quantum coherence bounds', async () => {
      await planner.planTasks(mockTasks, mockAgents)
      
      mockTasks.forEach(task => {
        expect(task.quantumState.coherence).toBeGreaterThanOrEqual(0)
        expect(task.quantumState.coherence).toBeLessThanOrEqual(1)
      })
    })

    it('should normalize quantum amplitudes', async () => {
      await planner.planTasks(mockTasks, mockAgents)
      
      mockTasks.forEach(task => {
        const amplitudes = Array.from(task.quantumState.superposition.values())
        const totalProbability = amplitudes.reduce((sum, amp) => sum + amp * amp, 0)
        
        // Should be approximately normalized (allowing for floating point errors)
        expect(Math.abs(totalProbability - 1.0)).toBeLessThan(0.1)
      })
    })
  })

  describe('Integration with Agent System', () => {
    it('should consider agent capabilities in assignment', async () => {
      const assignments = await planner.planTasks(mockTasks, mockAgents)
      
      assignments.forEach((assignedAgents, taskId) => {
        assignedAgents.forEach(agentId => {
          const agent = mockAgents.find(a => a.id === agentId)
          expect(agent).toBeDefined()
          expect(agent!.currentState.status).toBe('active')
        })
      })
    })

    it('should balance workload across agents', async () => {
      const assignments = await planner.planTasks(mockTasks, mockAgents)
      
      const agentWorkload = new Map<string, number>()
      mockAgents.forEach(agent => {
        agentWorkload.set(agent.id, 0)
      })
      
      assignments.forEach((assignedAgents, taskId) => {
        const task = mockTasks.find(t => t.id === taskId)!
        assignedAgents.forEach(agentId => {
          const currentLoad = agentWorkload.get(agentId) || 0
          agentWorkload.set(agentId, currentLoad + task.estimatedDuration)
        })
      })
      
      const workloads = Array.from(agentWorkload.values())
      const avgWorkload = workloads.reduce((sum, load) => sum + load, 0) / workloads.length
      const maxWorkload = Math.max(...workloads)
      
      // Max workload shouldn't be more than 3x average (reasonable balance)
      expect(maxWorkload).toBeLessThanOrEqual(avgWorkload * 3)
    })

    it('should consider agent positions for spatial tasks', async () => {
      const spatialTasks = mockTasks.map(task => ({
        ...task,
        position: new Vector3(Math.random() * 10, 0, 0)
      }))
      
      const assignments = await planner.planTasks(spatialTasks, mockAgents)
      
      // Should successfully assign tasks considering spatial constraints
      expect(assignments.size).toBe(spatialTasks.length)
    })
  })
})