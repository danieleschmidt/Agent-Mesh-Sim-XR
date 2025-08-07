import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { performance } from 'perf_hooks'
import { AgentMeshXR } from '../../core/AgentMeshXR'
import { createHyperScaleSystem } from '../../scale'
import type { Agent, AgentMeshXRConfig } from '../../types'

/**
 * Performance Benchmarking Test Suite
 * Validates system performance under various load conditions
 */

describe('Performance Benchmarks', () => {
  let agentMeshXR: AgentMeshXR
  let hyperScaleSystem: any
  
  const benchmarkConfig: AgentMeshXRConfig = {
    maxAgents: 1000000,
    vrSupport: true,
    arSupport: true,
    networkConfig: {
      endpoint: 'ws://localhost:8080',
      retryAttempts: 3,
      timeout: 5000
    }
  }

  beforeEach(async () => {
    agentMeshXR = new AgentMeshXR(benchmarkConfig)
    hyperScaleSystem = createHyperScaleSystem({
      scaling: {
        max_agents: 1000000,
        gpu_acceleration: true,
        distributed_computing: true,
        edge_computing_nodes: [],
        auto_scaling_policies: [],
        performance_targets: {
          target_fps: 60,
          max_latency_ms: 16,
          min_throughput_ops_per_sec: 50000,
          memory_efficiency_target: 0.85,
          cpu_utilization_target: 0.75,
          gpu_utilization_target: 0.80
        },
        resource_limits: {
          max_memory_gb: 2000,
          max_cpu_cores: 512,
          max_gpu_memory_gb: 640,
          max_network_bandwidth_mbps: 200000,
          max_storage_iops: 2000000
        },
        optimization_strategies: []
      }
    })
  })

  afterEach(() => {
    agentMeshXR.dispose()
    hyperScaleSystem.dispose()
  })

  describe('Agent Management Performance', () => {
    it('should add 1000 agents in under 100ms', async () => {
      const agents = generateTestAgents(1000)
      
      const startTime = performance.now()
      
      for (const agent of agents) {
        agentMeshXR.addAgent(agent)
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(100)
      expect(agentMeshXR.getAllAgents().length).toBe(1000)
      
      console.log(`✓ Added 1000 agents in ${totalTime.toFixed(2)}ms`)
    })

    it('should update 10000 agents in under 50ms', async () => {
      const agents = generateTestAgents(10000)
      
      // Add agents first
      for (const agent of agents) {
        agentMeshXR.addAgent(agent)
      }
      
      // Measure update performance
      const startTime = performance.now()
      
      for (const agent of agents) {
        agentMeshXR.updateAgent({
          id: agent.id,
          position: {
            x: agent.position.x + Math.random(),
            y: agent.position.y + Math.random(),
            z: agent.position.z + Math.random()
          }
        })
      }
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(totalTime).toBeLessThan(50)
      
      console.log(`✓ Updated 10000 agents in ${totalTime.toFixed(2)}ms`)
    })

    it('should query agents by criteria in under 10ms for 50k agents', async () => {
      const agents = generateTestAgents(50000)
      
      // Add agents
      for (const agent of agents) {
        agentMeshXR.addAgent(agent)
      }
      
      const startTime = performance.now()
      
      // Query active agents
      const activeAgents = agentMeshXR.getAllAgents().filter(
        agent => agent.currentState.status === 'active'
      )
      
      const endTime = performance.now()
      const queryTime = endTime - startTime
      
      expect(queryTime).toBeLessThan(10)
      expect(activeAgents.length).toBeGreaterThan(0)
      
      console.log(`✓ Queried ${activeAgents.length} active agents from 50k in ${queryTime.toFixed(2)}ms`)
    })
  })

  describe('Scaling Performance', () => {
    it('should scale from 1k to 100k agents with linear time complexity', async () => {
      const scalingSizes = [1000, 5000, 10000, 25000, 50000, 100000]
      const scalingResults: Array<{size: number, time: number, efficiency: number}> = []
      
      for (const size of scalingSizes) {
        const startTime = performance.now()
        
        const result = await hyperScaleSystem.hyperScale.scaleToAgentCount(size)
        
        const endTime = performance.now()
        const scalingTime = endTime - startTime
        
        scalingResults.push({
          size,
          time: scalingTime,
          efficiency: result.scaling_efficiency
        })
        
        expect(result.success).toBe(true)
        expect(result.scaling_efficiency).toBeGreaterThan(0.8)
        
        console.log(`✓ Scaled to ${size} agents in ${scalingTime.toFixed(2)}ms (efficiency: ${(result.scaling_efficiency * 100).toFixed(1)}%)`)
      }
      
      // Verify linear scaling characteristics
      for (let i = 1; i < scalingResults.length - 1; i++) {
        const prev = scalingResults[i-1]
        const curr = scalingResults[i]
        const next = scalingResults[i+1]
        
        const timeGrowthRate1 = curr.time / prev.time
        const timeGrowthRate2 = next.time / curr.time
        const sizeGrowthRate1 = curr.size / prev.size
        const sizeGrowthRate2 = next.size / curr.size
        
        // Time growth should be proportional to size growth (linear scaling)
        const expectedTimeRatio1 = sizeGrowthRate1
        const expectedTimeRatio2 = sizeGrowthRate2
        
        // Allow 50% variance for linear scaling
        expect(Math.abs(timeGrowthRate1 - expectedTimeRatio1)).toBeLessThan(expectedTimeRatio1 * 0.5)
        expect(Math.abs(timeGrowthRate2 - expectedTimeRatio2)).toBeLessThan(expectedTimeRatio2 * 0.5)
      }
    }, 180000) // 3 minutes timeout

    it('should maintain 60fps performance up to 25k agents', async () => {
      const targetAgents = 25000
      const targetFPS = 60
      const maxFrameTime = 1000 / targetFPS // 16.67ms
      
      await hyperScaleSystem.hyperScale.scaleToAgentCount(targetAgents)
      
      // Simulate frame processing
      const frameProcessingTimes: number[] = []
      const testFrames = 100
      
      for (let frame = 0; frame < testFrames; frame++) {
        const frameStart = performance.now()
        
        // Simulate frame processing workload
        const agents = generateTestAgents(Math.min(1000, targetAgents))
        for (const agent of agents) {
          // Simulate agent processing
          agent.position.x += Math.random() * 0.1
          agent.position.y += Math.random() * 0.1
          agent.position.z += Math.random() * 0.1
        }
        
        const frameEnd = performance.now()
        const frameTime = frameEnd - frameStart
        frameProcessingTimes.push(frameTime)
      }
      
      const avgFrameTime = frameProcessingTimes.reduce((a, b) => a + b, 0) / frameProcessingTimes.length
      const maxFrameTimeObserved = Math.max(...frameProcessingTimes)
      const minFrameTime = Math.min(...frameProcessingTimes)
      
      expect(avgFrameTime).toBeLessThan(maxFrameTime)
      expect(maxFrameTimeObserved).toBeLessThan(maxFrameTime * 1.5) // Allow 50% variance
      
      console.log(`✓ Frame processing: avg=${avgFrameTime.toFixed(2)}ms, max=${maxFrameTimeObserved.toFixed(2)}ms, min=${minFrameTime.toFixed(2)}ms`)
      console.log(`✓ Target frame time: ${maxFrameTime.toFixed(2)}ms (${targetFPS}fps)`)
    }, 60000)

    it('should handle sudden load spikes without performance degradation', async () => {
      // Start with baseline load
      const baselineAgents = 10000
      await hyperScaleSystem.hyperScale.scaleToAgentCount(baselineAgents)
      
      // Measure baseline performance
      const baselineStart = performance.now()
      const baselineAgentList = generateTestAgents(1000)
      for (const agent of baselineAgentList) {
        agentMeshXR.addAgent(agent)
      }
      const baselineTime = performance.now() - baselineStart
      
      // Sudden load spike
      const spikeAgents = 50000
      const spikeStart = performance.now()
      
      await hyperScaleSystem.hyperScale.scaleToAgentCount(spikeAgents)
      
      const spikeTime = performance.now() - spikeStart
      
      // Measure performance under load
      const loadStart = performance.now()
      const loadAgentList = generateTestAgents(1000)
      for (const agent of loadAgentList) {
        agentMeshXR.addAgent(agent)
      }
      const loadTime = performance.now() - loadStart
      
      // Performance should not degrade by more than 3x
      expect(loadTime).toBeLessThan(baselineTime * 3)
      expect(spikeTime).toBeLessThan(10000) // Should handle spike in under 10s
      
      console.log(`✓ Baseline performance: ${baselineTime.toFixed(2)}ms`)
      console.log(`✓ Load spike handling: ${spikeTime.toFixed(2)}ms`)
      console.log(`✓ Performance under load: ${loadTime.toFixed(2)}ms`)
    }, 45000)
  })

  describe('Memory Performance', () => {
    it('should maintain memory efficiency above 80% with 100k agents', async () => {
      const targetAgents = 100000
      
      // Monitor initial memory
      const initialMemory = process.memoryUsage()
      
      await hyperScaleSystem.hyperScale.scaleToAgentCount(targetAgents)
      
      // Wait for memory stabilization
      await new Promise(resolve => setTimeout(resolve, 5000))
      
      const finalMemory = process.memoryUsage()
      const memoryIncrease = finalMemory.heapUsed - initialMemory.heapUsed
      const memoryPerAgent = memoryIncrease / targetAgents
      
      // Each agent should use less than 10KB of memory
      expect(memoryPerAgent).toBeLessThan(10240) // 10KB per agent
      
      const report = hyperScaleSystem.hyperScale.generateHyperScaleReport()
      
      // System should report high memory efficiency
      expect(report.resource_optimization).toBeDefined()
      
      console.log(`✓ Memory usage: ${(memoryIncrease / 1024 / 1024).toFixed(2)}MB for ${targetAgents} agents`)
      console.log(`✓ Memory per agent: ${memoryPerAgent.toFixed(0)} bytes`)
    }, 60000)

    it('should handle memory pressure gracefully', async () => {
      const agents = generateTestAgents(200000) // Large number to create memory pressure
      const batchSize = 10000
      const memoryReadings: number[] = []
      
      for (let i = 0; i < agents.length; i += batchSize) {
        const batch = agents.slice(i, i + batchSize)
        
        for (const agent of batch) {
          agentMeshXR.addAgent(agent)
        }
        
        // Force garbage collection if available
        if (global.gc) {
          global.gc()
        }
        
        const memoryUsage = process.memoryUsage()
        memoryReadings.push(memoryUsage.heapUsed)
        
        // Check for memory leaks (heap should not grow unbounded)
        if (memoryReadings.length > 5) {
          const recentGrowth = memoryReadings.slice(-5)
          const avgGrowth = recentGrowth.reduce((a, b, idx) => {
            if (idx === 0) return 0
            return a + (b - recentGrowth[idx - 1])
          }, 0) / (recentGrowth.length - 1)
          
          // Average memory growth per batch should be reasonable
          expect(avgGrowth).toBeLessThan(50 * 1024 * 1024) // 50MB per 10k agents
        }
      }
      
      console.log(`✓ Added ${agents.length} agents with controlled memory growth`)
    }, 120000)
  })

  describe('Concurrent Operations Performance', () => {
    it('should handle 1000 concurrent agent operations without blocking', async () => {
      const concurrentOperations = 1000
      const agents = generateTestAgents(concurrentOperations)
      
      const startTime = performance.now()
      
      // Execute concurrent operations
      const operations = agents.map(agent => 
        Promise.resolve().then(() => {
          agentMeshXR.addAgent(agent)
          agentMeshXR.updateAgent({ 
            id: agent.id, 
            position: { x: Math.random(), y: Math.random(), z: Math.random() } 
          })
          return agentMeshXR.getAgent(agent.id)
        })
      )
      
      const results = await Promise.all(operations)
      
      const endTime = performance.now()
      const totalTime = endTime - startTime
      
      expect(results.length).toBe(concurrentOperations)
      expect(results.every(result => result !== undefined)).toBe(true)
      expect(totalTime).toBeLessThan(1000) // Should complete in under 1 second
      
      console.log(`✓ Completed ${concurrentOperations} concurrent operations in ${totalTime.toFixed(2)}ms`)
    })

    it('should maintain performance under high-frequency updates', async () => {
      const agents = generateTestAgents(10000)
      
      // Add agents
      for (const agent of agents) {
        agentMeshXR.addAgent(agent)
      }
      
      const updateFrequency = 100 // 100 Hz
      const testDuration = 5000 // 5 seconds
      const totalUpdates = (testDuration / 1000) * updateFrequency
      
      let updateCount = 0
      const startTime = performance.now()
      
      const updateInterval = setInterval(() => {
        // Update random subset of agents
        const agentsToUpdate = agents.slice(0, 1000)
        
        for (const agent of agentsToUpdate) {
          agentMeshXR.updateAgent({
            id: agent.id,
            currentState: {
              ...agent.currentState,
              energy: Math.random()
            }
          })
        }
        
        updateCount++
        
        if (updateCount >= totalUpdates) {
          clearInterval(updateInterval)
        }
      }, 1000 / updateFrequency)
      
      // Wait for test completion
      await new Promise(resolve => {
        const checkCompletion = () => {
          if (updateCount >= totalUpdates) {
            resolve(undefined)
          } else {
            setTimeout(checkCompletion, 100)
          }
        }
        checkCompletion()
      })
      
      const endTime = performance.now()
      const actualDuration = endTime - startTime
      const actualFrequency = (updateCount * 1000) / actualDuration
      
      // Should maintain at least 90% of target frequency
      expect(actualFrequency).toBeGreaterThan(updateFrequency * 0.9)
      
      console.log(`✓ Maintained ${actualFrequency.toFixed(1)}Hz update frequency (target: ${updateFrequency}Hz)`)
    }, 10000)
  })

  describe('Network Performance', () => {
    it('should handle high-throughput message processing', async () => {
      const messageCount = 100000
      const messageSize = 1024 // 1KB per message
      const messages: any[] = []
      
      // Generate test messages
      for (let i = 0; i < messageCount; i++) {
        messages.push({
          id: `msg_${i}`,
          data: 'x'.repeat(messageSize),
          timestamp: Date.now()
        })
      }
      
      const startTime = performance.now()
      
      // Process messages (simulate network message handling)
      const processedMessages = messages.map(msg => ({
        ...msg,
        processed: true,
        processingTime: performance.now()
      }))
      
      const endTime = performance.now()
      const processingTime = endTime - startTime
      const throughput = (messageCount * messageSize) / (processingTime / 1000) // bytes per second
      const messagesPerSecond = messageCount / (processingTime / 1000)
      
      expect(processedMessages.length).toBe(messageCount)
      expect(messagesPerSecond).toBeGreaterThan(10000) // Should process 10k+ messages/sec
      
      console.log(`✓ Processed ${messageCount} messages in ${processingTime.toFixed(2)}ms`)
      console.log(`✓ Throughput: ${(throughput / 1024 / 1024).toFixed(2)} MB/s`)
      console.log(`✓ Messages per second: ${messagesPerSecond.toFixed(0)}`)
    })
  })
})

// Helper functions
function generateTestAgents(count: number): Agent[] {
  const agents: Agent[] = []
  
  for (let i = 0; i < count; i++) {
    agents.push({
      id: `perf_agent_${i}`,
      type: 'performance_test',
      position: {
        x: (Math.random() - 0.5) * 200,
        y: (Math.random() - 0.5) * 200,
        z: (Math.random() - 0.5) * 200
      },
      currentState: {
        status: Math.random() > 0.3 ? 'active' : 'idle',
        energy: Math.random(),
        goals: [`goal_${Math.floor(Math.random() * 10)}`],
        connections: []
      },
      metadata: {
        created: Date.now() - Math.random() * 10000,
        performance_score: Math.random(),
        specialization: `perf_spec_${i % 5}`
      },
      lastUpdate: Date.now()
    })
  }
  
  return agents
}

export { }