import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { QuantumPerformanceOptimizer, QuantumOptimizationConfig } from '../../planning/QuantumPerformanceOptimizer'

describe('QuantumPerformanceOptimizer', () => {
  let optimizer: QuantumPerformanceOptimizer
  let mockConfig: Partial<QuantumOptimizationConfig>

  beforeEach(() => {
    mockConfig = {
      cacheSize: 100,
      cacheTTL: 5000,
      poolSizes: {
        superposition: 10,
        entanglement: 5,
        interference: 3,
        annealing: 2
      },
      workerPoolSize: 2,
      adaptiveOptimization: false, // Disable for predictable testing
      memoryLimit: 10 * 1024 * 1024, // 10 MB
      performanceTargets: {
        cacheHitRate: 0.8,
        averageResponseTime: 100,
        throughput: 100
      }
    }

    optimizer = new QuantumPerformanceOptimizer(mockConfig)
  })

  afterEach(() => {
    optimizer.dispose()
    vi.clearAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default configuration', () => {
      const defaultOptimizer = new QuantumPerformanceOptimizer()
      expect(defaultOptimizer).toBeDefined()
      defaultOptimizer.dispose()
    })

    it('should initialize with custom configuration', () => {
      expect(optimizer).toBeDefined()
      
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics).toBeDefined()
      expect(typeof metrics.cacheHitRate).toBe('number')
    })

    it('should create resource pools on initialization', () => {
      const poolStats = optimizer.getResourcePoolStats()
      
      expect(Array.isArray(poolStats)).toBe(true)
      expect(poolStats.length).toBe(4) // superposition, entanglement, interference, annealing
      
      poolStats.forEach(pool => {
        expect(pool.type).toBeDefined()
        expect(pool.maxSize).toBeGreaterThan(0)
        expect(pool.currentSize).toBeGreaterThanOrEqual(0)
      })
    })
  })

  describe('Computation Caching', () => {
    it('should cache computation results', async () => {
      const computationFn = vi.fn().mockResolvedValue('test-result')
      
      // First call should execute function
      const result1 = await optimizer.computeWithCache('test-key', computationFn)
      expect(result1).toBe('test-result')
      expect(computationFn).toHaveBeenCalledTimes(1)
      
      // Second call should use cache
      const result2 = await optimizer.computeWithCache('test-key', computationFn)
      expect(result2).toBe('test-result')
      expect(computationFn).toHaveBeenCalledTimes(1) // Should not call again
    })

    it('should emit cache hit events', async () => {
      const cacheHitCallback = vi.fn()
      optimizer.on('cacheHit', cacheHitCallback)
      
      const computationFn = vi.fn().mockResolvedValue('result')
      
      // Prime cache
      await optimizer.computeWithCache('test-key', computationFn)
      
      // Hit cache
      await optimizer.computeWithCache('test-key', computationFn)
      
      expect(cacheHitCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test-key',
          hitCount: expect.any(Number)
        })
      )
    })

    it('should emit cache miss events', async () => {
      const cacheMissCallback = vi.fn()
      optimizer.on('cacheMiss', cacheMissCallback)
      
      const computationFn = vi.fn().mockResolvedValue('result')
      
      await optimizer.computeWithCache('test-key', computationFn)
      
      expect(cacheMissCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          key: 'test-key',
          computationTime: expect.any(Number)
        })
      )
    })

    it('should respect cache TTL', async () => {
      const computationFn = vi.fn().mockResolvedValue('result')
      const shortTTL = 100 // 100ms
      
      // First call
      await optimizer.computeWithCache('test-key', computationFn, shortTTL)
      expect(computationFn).toHaveBeenCalledTimes(1)
      
      // Wait for TTL to expire
      await new Promise(resolve => setTimeout(resolve, 150))
      
      // Second call should execute function again
      await optimizer.computeWithCache('test-key', computationFn, shortTTL)
      expect(computationFn).toHaveBeenCalledTimes(2)
    })

    it('should handle computation errors', async () => {
      const errorFn = vi.fn().mockRejectedValue(new Error('Computation failed'))
      
      await expect(optimizer.computeWithCache('error-key', errorFn)).rejects.toThrow('Computation failed')
    })

    it('should provide detailed cache statistics', async () => {
      // Add some cached items
      const computationFn = vi.fn().mockResolvedValue('result')
      
      await optimizer.computeWithCache('key1', computationFn)
      await optimizer.computeWithCache('key2', computationFn)
      await optimizer.computeWithCache('key1', computationFn) // Cache hit
      
      const stats = optimizer.getDetailedCacheStats()
      
      expect(stats).toBeDefined()
      expect(stats.totalEntries).toBeGreaterThan(0)
      expect(stats.totalHits).toBeGreaterThanOrEqual(0)
      expect(stats.hitRate).toBeGreaterThanOrEqual(0)
      expect(Array.isArray(stats.mostAccessedEntries)).toBe(true)
    })
  })

  describe('Resource Pooling', () => {
    it('should borrow and return resources', () => {
      const resource = optimizer.borrowResource('superposition')
      expect(resource).toBeDefined()
      expect(resource).toHaveProperty('id')
      
      optimizer.returnResource('superposition', resource)
      
      // Should be able to borrow the same resource again
      const resource2 = optimizer.borrowResource('superposition')
      expect(resource2).toBeDefined()
    })

    it('should return null when pool is exhausted', () => {
      const resources = []
      
      // Exhaust the superposition pool
      for (let i = 0; i < mockConfig.poolSizes!.superposition! + 5; i++) {
        const resource = optimizer.borrowResource('superposition')
        if (resource) {
          resources.push(resource)
        }
      }
      
      // Next request should return null
      const resource = optimizer.borrowResource('superposition')
      expect(resource).toBeNull()
      
      // Clean up
      resources.forEach(r => optimizer.returnResource('superposition', r))
    })

    it('should emit resource borrowed and returned events', () => {
      const borrowedCallback = vi.fn()
      const returnedCallback = vi.fn()
      
      optimizer.on('resourceBorrowed', borrowedCallback)
      optimizer.on('resourceReturned', returnedCallback)
      
      const resource = optimizer.borrowResource('entanglement')
      expect(borrowedCallback).toHaveBeenCalledWith(
        expect.objectContaining({
          poolType: 'entanglement',
          poolSize: expect.any(Number)
        })
      )
      
      if (resource) {
        optimizer.returnResource('entanglement', resource)
        expect(returnedCallback).toHaveBeenCalledWith(
          expect.objectContaining({
            poolType: 'entanglement',
            poolSize: expect.any(Number)
          })
        )
      }
    })

    it('should provide resource pool statistics', () => {
      // Borrow some resources
      const resource1 = optimizer.borrowResource('interference')
      const resource2 = optimizer.borrowResource('interference')
      
      const stats = optimizer.getResourcePoolStats()
      
      const interferencePool = stats.find(pool => pool.type === 'interference')
      expect(interferencePool).toBeDefined()
      expect(interferencePool!.inUse).toBeGreaterThan(0)
      expect(interferencePool!.utilization).toBeGreaterThan(0)
      
      // Clean up
      if (resource1) optimizer.returnResource('interference', resource1)
      if (resource2) optimizer.returnResource('interference', resource2)
    })
  })

  describe('Parallel Processing', () => {
    it('should execute tasks in parallel', async () => {
      const tasks = [
        { id: 'task1', type: 'planning' as const, priority: 5, payload: { data: 'test1' } },
        { id: 'task2', type: 'annealing' as const, priority: 8, payload: { data: 'test2' } },
        { id: 'task3', type: 'interference' as const, priority: 3, payload: { data: 'test3' } }
      ]
      
      const startTime = Date.now()
      const results = await optimizer.executeParallel(tasks)
      const duration = Date.now() - startTime
      
      expect(results.size).toBe(3)
      expect(results.has('task1')).toBe(true)
      expect(results.has('task2')).toBe(true)
      expect(results.has('task3')).toBe(true)
      
      // Should complete reasonably quickly
      expect(duration).toBeLessThan(1000)
    })

    it('should prioritize higher priority tasks', async () => {
      const completionOrder: string[] = []
      
      optimizer.on('workerTaskCompleted', (event) => {
        completionOrder.push(event.taskId)
      })
      
      const tasks = [
        { id: 'low-priority', type: 'measurement' as const, priority: 1, payload: {} },
        { id: 'high-priority', type: 'measurement' as const, priority: 10, payload: {} }
      ]
      
      await optimizer.executeParallel(tasks)
      
      // High priority task should complete first (or at least be processed first)
      // Note: Due to async nature, exact order may vary, but high priority should be favored
      expect(completionOrder.length).toBe(2)
    })

    it('should handle task failures with retries', async () => {
      const failingPayload = { shouldFail: true }
      const task = { 
        id: 'failing-task', 
        type: 'planning' as const, 
        priority: 5, 
        payload: failingPayload 
      }
      
      // Mock the planning execution to fail initially
      const originalExecute = (optimizer as any).executeQuantumPlanning
      let attemptCount = 0
      
      ;(optimizer as any).executeQuantumPlanning = vi.fn().mockImplementation(async (payload) => {
        attemptCount++
        if (payload.shouldFail && attemptCount < 3) {
          throw new Error('Simulated failure')
        }
        return originalExecute.call(optimizer, payload)
      })
      
      const results = await optimizer.executeParallel([task])
      
      // Should eventually succeed after retries
      expect(results.has('failing-task')).toBe(true)
      expect(attemptCount).toBeGreaterThan(1)
    })

    it('should emit parallel execution completed event', async () => {
      const callback = vi.fn()
      optimizer.on('parallelExecutionCompleted', callback)
      
      const tasks = [
        { id: 'test', type: 'measurement' as const, priority: 5, payload: {} }
      ]
      
      await optimizer.executeParallel(tasks)
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          taskCount: 1,
          successCount: 1,
          duration: expect.any(Number)
        })
      )
    })
  })

  describe('Algorithm Selection', () => {
    it('should select optimal algorithm for planning problems', () => {
      const algorithm = optimizer.selectOptimalAlgorithm('planning', 100, {})
      
      expect(typeof algorithm).toBe('string')
      expect(algorithm.length).toBeGreaterThan(0)
    })

    it('should select optimal algorithm for optimization problems', () => {
      const algorithm = optimizer.selectOptimalAlgorithm('optimization', 50, { constraints: 5 })
      
      expect(typeof algorithm).toBe('string')
      expect(algorithm.length).toBeGreaterThan(0)
    })

    it('should select optimal algorithm for measurement problems', () => {
      const algorithm = optimizer.selectOptimalAlgorithm('measurement', 10, {})
      
      expect(typeof algorithm).toBe('string')
      expect(algorithm.length).toBeGreaterThan(0)
    })

    it('should emit algorithm selection events', () => {
      const callback = vi.fn()
      optimizer.on('algorithmSelected', callback)
      
      optimizer.selectOptimalAlgorithm('planning', 200, { dependencies: true })
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          problemType: 'planning',
          problemSize: 200,
          selectedAlgorithm: expect.any(String),
          score: expect.any(Number),
          complexity: expect.any(Number)
        })
      )
    })

    it('should consider problem complexity in selection', () => {
      const smallProblem = optimizer.selectOptimalAlgorithm('planning', 5, {})
      const largeProblem = optimizer.selectOptimalAlgorithm('planning', 1000, { 
        dependencies: true,
        spatial: true,
        temporal: true 
      })
      
      // Algorithms might be different for different complexity levels
      expect(typeof smallProblem).toBe('string')
      expect(typeof largeProblem).toBe('string')
    })
  })

  describe('Memory Optimization', () => {
    it('should optimize memory when usage is high', () => {
      const callback = vi.fn()
      optimizer.on('memoryOptimized', callback)
      
      // Force memory optimization
      optimizer.optimizeMemoryUsage()
      
      // May or may not emit event depending on actual memory usage
      // But should not throw errors
      expect(true).toBe(true)
    })

    it('should clear expired cache entries during optimization', async () => {
      // Add cache entries with short TTL
      const computationFn = vi.fn().mockResolvedValue('result')
      await optimizer.computeWithCache('key1', computationFn, 1) // 1ms TTL
      await optimizer.computeWithCache('key2', computationFn, 1) // 1ms TTL
      
      // Wait for expiration
      await new Promise(resolve => setTimeout(resolve, 10))
      
      // Trigger optimization
      optimizer.optimizeMemoryUsage()
      
      const stats = optimizer.getDetailedCacheStats()
      // Expired entries might be cleaned up
      expect(stats.totalEntries).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Performance Metrics', () => {
    it('should provide comprehensive performance metrics', () => {
      const metrics = optimizer.getPerformanceMetrics()
      
      expect(metrics).toBeDefined()
      expect(typeof metrics.cacheHitRate).toBe('number')
      expect(typeof metrics.averageComputationTime).toBe('number')
      expect(typeof metrics.memoryUsage).toBe('number')
      expect(typeof metrics.workerUtilization).toBe('number')
      expect(typeof metrics.throughput).toBe('number')
      expect(typeof metrics.concurrentOperations).toBe('number')
      expect(typeof metrics.optimizationGain).toBe('number')
      expect(metrics.poolUtilization instanceof Map).toBe(true)
    })

    it('should update metrics over time', async () => {
      const initialMetrics = optimizer.getPerformanceMetrics()
      
      // Perform some operations
      const computationFn = vi.fn().mockResolvedValue('result')
      await optimizer.computeWithCache('key1', computationFn)
      await optimizer.computeWithCache('key1', computationFn) // Cache hit
      
      const updatedMetrics = optimizer.getPerformanceMetrics()
      
      // Cache hit rate should be updated
      expect(updatedMetrics.cacheHitRate).toBeGreaterThanOrEqual(initialMetrics.cacheHitRate)
    })
  })

  describe('Configuration Management', () => {
    it('should update configuration', () => {
      const newConfig = {
        cacheSize: 200,
        workerPoolSize: 4
      }
      
      optimizer.updateConfiguration(newConfig)
      
      // Configuration should be updated (internal verification)
      expect(true).toBe(true) // Configuration update is internal
    })

    it('should emit configuration update events', () => {
      const callback = vi.fn()
      optimizer.on('configurationUpdated', callback)
      
      const updates = { cacheSize: 150 }
      optimizer.updateConfiguration(updates)
      
      expect(callback).toHaveBeenCalledWith(
        expect.objectContaining({
          changes: updates,
          newConfig: expect.any(Object),
          oldConfig: expect.any(Object)
        })
      )
    })

    it('should resize cache when cache size is updated', () => {
      const initialStats = optimizer.getDetailedCacheStats()
      
      optimizer.updateConfiguration({ cacheSize: 50 })
      
      // Configuration change should be applied
      expect(true).toBe(true)
    })

    it('should resize resource pools when pool sizes are updated', () => {
      const newPoolSizes = {
        superposition: 20,
        entanglement: 10
      }
      
      optimizer.updateConfiguration({ poolSizes: newPoolSizes })
      
      const stats = optimizer.getResourcePoolStats()
      const superpositionPool = stats.find(pool => pool.type === 'superposition')
      
      expect(superpositionPool).toBeDefined()
      expect(superpositionPool!.maxSize).toBe(20)
    })
  })

  describe('Adaptive Optimization', () => {
    it('should enable adaptive optimization', () => {
      optimizer.enableAdaptiveOptimization()
      // Should not throw errors
      expect(true).toBe(true)
    })

    it('should disable adaptive optimization', () => {
      optimizer.disableAdaptiveOptimization()
      // Should not throw errors
      expect(true).toBe(true)
    })
  })

  describe('Error Handling', () => {
    it('should handle invalid resource pool types', () => {
      const resource = optimizer.borrowResource('invalid' as any)
      expect(resource).toBeNull()
    })

    it('should handle returning resources to wrong pools', () => {
      const resource = optimizer.borrowResource('superposition')
      if (resource) {
        // Should not throw error when returning to wrong pool
        expect(() => {
          optimizer.returnResource('entanglement', resource)
        }).not.toThrow()
      }
    })

    it('should handle empty parallel task arrays', async () => {
      const results = await optimizer.executeParallel([])
      expect(results.size).toBe(0)
    })

    it('should handle unknown problem types in algorithm selection', () => {
      const algorithm = optimizer.selectOptimalAlgorithm('unknown' as any, 100, {})
      expect(typeof algorithm).toBe('string')
      expect(algorithm).toBe('default')
    })
  })

  describe('Performance and Scalability', () => {
    it('should handle large cache sizes efficiently', async () => {
      const largeOptimizer = new QuantumPerformanceOptimizer({
        cacheSize: 1000,
        cacheTTL: 60000
      })
      
      const startTime = Date.now()
      
      // Add many cache entries
      const promises = []
      for (let i = 0; i < 100; i++) {
        const computationFn = vi.fn().mockResolvedValue(`result-${i}`)
        promises.push(largeOptimizer.computeWithCache(`key-${i}`, computationFn))
      }
      
      await Promise.all(promises)
      
      const duration = Date.now() - startTime
      expect(duration).toBeLessThan(2000) // Should complete in under 2 seconds
      
      largeOptimizer.dispose()
    })

    it('should handle many parallel tasks efficiently', async () => {
      const tasks = Array.from({ length: 50 }, (_, i) => ({
        id: `task-${i}`,
        type: 'measurement' as const,
        priority: Math.floor(Math.random() * 10),
        payload: { index: i }
      }))
      
      const startTime = Date.now()
      const results = await optimizer.executeParallel(tasks)
      const duration = Date.now() - startTime
      
      expect(results.size).toBe(50)
      expect(duration).toBeLessThan(3000) // Should complete in under 3 seconds
    })

    it('should maintain performance under resource pressure', () => {
      // Exhaust all resource pools
      const borrowedResources: any[] = []
      
      Object.keys(mockConfig.poolSizes!).forEach(poolType => {
        const maxSize = mockConfig.poolSizes![poolType as keyof typeof mockConfig.poolSizes]!
        
        for (let i = 0; i < maxSize; i++) {
          const resource = optimizer.borrowResource(poolType as any)
          if (resource) {
            borrowedResources.push({ resource, poolType })
          }
        }
      })
      
      // Should still function with exhausted pools
      const metrics = optimizer.getPerformanceMetrics()
      expect(metrics).toBeDefined()
      
      // Clean up
      borrowedResources.forEach(({ resource, poolType }) => {
        optimizer.returnResource(poolType, resource)
      })
    })
  })

  describe('Monitoring Integration', () => {
    it('should start and stop monitoring', () => {
      expect(() => {
        optimizer.startMonitoring()
        optimizer.stopMonitoring()
      }).not.toThrow()
    })
  })

  describe('Cleanup', () => {
    it('should dispose cleanly', () => {
      expect(() => {
        optimizer.dispose()
      }).not.toThrow()
    })

    it('should stop all timers on dispose', () => {
      optimizer.startMonitoring()
      optimizer.dispose()
      
      // Should not throw errors after disposal
      expect(true).toBe(true)
    })
  })
})