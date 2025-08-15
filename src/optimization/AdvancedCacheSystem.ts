/**
 * Advanced Cache System
 * High-performance caching with intelligent eviction and predictive prefetching
 */

import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  lastAccessed: number
  accessCount: number
  size: number
  ttl?: number
  priority: number
  metadata?: unknown
}

interface CacheStats {
  hits: number
  misses: number
  evictions: number
  size: number
  maxSize: number
  hitRate: number
  memoryUsage: number
  maxMemoryUsage: number
}

interface PrefetchPrediction {
  key: string
  confidence: number
  priority: number
  timestamp: number
}

type EvictionPolicy = 'LRU' | 'LFU' | 'FIFO' | 'TTL' | 'ADAPTIVE'

export class AdvancedCacheSystem<T = unknown> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private accessHistory: Map<string, number[]> = new Map()
  private stats: CacheStats = {
    hits: 0,
    misses: 0,
    evictions: 0,
    size: 0,
    maxSize: 1000,
    hitRate: 0,
    memoryUsage: 0,
    maxMemoryUsage: 50 * 1024 * 1024 // 50MB
  }
  
  private evictionPolicy: EvictionPolicy = 'ADAPTIVE'
  private prefetchEnabled = true
  private compressionEnabled = false
  private encryptionEnabled = false
  private readonly defaultTTL = 300000 // 5 minutes
  private readonly cleanupInterval = 60000 // 1 minute
  private cleanupTimer?: number
  private prefetchTimer?: number

  constructor(options: {
    maxSize?: number
    maxMemoryUsage?: number
    evictionPolicy?: EvictionPolicy
    defaultTTL?: number
    prefetchEnabled?: boolean
    compressionEnabled?: boolean
    encryptionEnabled?: boolean
  } = {}) {
    super()
    
    this.stats.maxSize = options.maxSize || 1000
    this.stats.maxMemoryUsage = options.maxMemoryUsage || 50 * 1024 * 1024
    this.evictionPolicy = options.evictionPolicy || 'ADAPTIVE'
    this.prefetchEnabled = options.prefetchEnabled ?? true
    this.compressionEnabled = options.compressionEnabled ?? false
    this.encryptionEnabled = options.encryptionEnabled ?? false

    this.startCleanupTimer()
    if (this.prefetchEnabled) {
      this.startPrefetchTimer()
    }

    logger.info('AdvancedCacheSystem', 'Cache system initialized', {
      maxSize: this.stats.maxSize,
      maxMemoryUsage: this.stats.maxMemoryUsage,
      evictionPolicy: this.evictionPolicy,
      prefetchEnabled: this.prefetchEnabled
    })
  }

  async get(key: string, fallback?: () => Promise<T>): Promise<T | undefined> {
    const entry = this.cache.get(key)
    const currentTime = Date.now()

    if (entry && this.isValidEntry(entry, currentTime)) {
      // Cache hit
      entry.lastAccessed = currentTime
      entry.accessCount++
      this.stats.hits++
      this.updateAccessHistory(key)
      
      this.emit('cache_hit', { key, value: entry.value })
      
      return entry.value
    }

    // Cache miss
    this.stats.misses++
    this.emit('cache_miss', { key })

    if (entry) {
      // Expired entry
      this.cache.delete(key)
      this.stats.size--
      this.updateMemoryUsage(-entry.size)
    }

    // Try fallback if provided
    if (fallback) {
      try {
        const value = await fallback()
        await this.set(key, value)
        return value
      } catch (error) {
        logger.warn('AdvancedCacheSystem', 'Fallback failed', { key, error })
        return undefined
      }
    }

    return undefined
  }

  async set(key: string, value: T, ttl?: number, priority = 1): Promise<boolean> {
    try {
      const currentTime = Date.now()
      const size = this.estimateSize(value)
      
      // Check if we need to evict items first
      if (this.shouldEvict(size)) {
        await this.performEviction(size)
      }

      // Process value (compression, encryption)
      const processedValue = await this.processValue(value)

      const entry: CacheEntry<T> = {
        key,
        value: processedValue,
        timestamp: currentTime,
        lastAccessed: currentTime,
        accessCount: 1,
        size,
        ttl: ttl || this.defaultTTL,
        priority,
        metadata: { originalSize: size, compressed: this.compressionEnabled }
      }

      // Update or add entry
      const existingEntry = this.cache.get(key)
      if (existingEntry) {
        this.updateMemoryUsage(-existingEntry.size)
      } else {
        this.stats.size++
      }

      this.cache.set(key, entry)
      this.updateMemoryUsage(size)
      this.updateAccessHistory(key)

      this.emit('cache_set', { key, size, ttl })
      
      // Update hit rate
      this.updateHitRate()

      return true

    } catch (error) {
      logger.error('AdvancedCacheSystem', 'Failed to set cache entry', { key, error })
      return false
    }
  }

  async delete(key: string): Promise<boolean> {
    const entry = this.cache.get(key)
    if (entry) {
      this.cache.delete(key)
      this.stats.size--
      this.updateMemoryUsage(-entry.size)
      this.accessHistory.delete(key)
      
      this.emit('cache_delete', { key })
      return true
    }
    return false
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry ? this.isValidEntry(entry, Date.now()) : false
  }

  clear(): void {
    this.cache.clear()
    this.accessHistory.clear()
    this.stats.size = 0
    this.stats.memoryUsage = 0
    this.emit('cache_cleared')
    
    logger.info('AdvancedCacheSystem', 'Cache cleared')
  }

  keys(): string[] {
    const currentTime = Date.now()
    const validKeys = []
    
    for (const [key, entry] of this.cache) {
      if (this.isValidEntry(entry, currentTime)) {
        validKeys.push(key)
      }
    }
    
    return validKeys
  }

  values(): T[] {
    const currentTime = Date.now()
    const validValues = []
    
    for (const entry of this.cache.values()) {
      if (this.isValidEntry(entry, currentTime)) {
        validValues.push(entry.value)
      }
    }
    
    return validValues
  }

  entries(): Array<[string, T]> {
    const currentTime = Date.now()
    const validEntries = []
    
    for (const [key, entry] of this.cache) {
      if (this.isValidEntry(entry, currentTime)) {
        validEntries.push([key, entry.value] as [string, T])
      }
    }
    
    return validEntries
  }

  getStats(): CacheStats {
    return { ...this.stats }
  }

  // Prefetch commonly accessed items
  async prefetch(keys: string[], fetchFunction: (key: string) => Promise<T>): Promise<void> {
    if (!this.prefetchEnabled) return

    const predictions = this.generatePrefetchPredictions()
    const keysToPrefetch = [...keys, ...predictions.map(p => p.key)]
    
    const prefetchPromises = keysToPrefetch.slice(0, 10).map(async (key) => {
      if (!this.has(key)) {
        try {
          const value = await fetchFunction(key)
          await this.set(key, value, undefined, 0.5) // Lower priority for prefetched items
        } catch (error) {
          logger.debug('AdvancedCacheSystem', 'Prefetch failed', { key, error })
        }
      }
    })

    await Promise.allSettled(prefetchPromises)
    this.emit('prefetch_completed', { count: prefetchPromises.length })
  }

  // Warm up cache with commonly accessed data
  async warmUp(dataLoader: (keys: string[]) => Promise<Map<string, T>>): Promise<void> {
    const frequentKeys = this.getFrequentlyAccessedKeys(50)
    if (frequentKeys.length === 0) return

    try {
      const data = await dataLoader(frequentKeys)
      const setPromises = []

      for (const [key, value] of data) {
        setPromises.push(this.set(key, value, undefined, 2)) // Higher priority for warmed data
      }

      await Promise.allSettled(setPromises)
      this.emit('warmup_completed', { count: setPromises.length })
      
      logger.info('AdvancedCacheSystem', 'Cache warmed up', { keys: frequentKeys.length })

    } catch (error) {
      logger.error('AdvancedCacheSystem', 'Cache warmup failed', { error })
    }
  }

  // Batch operations for improved performance
  async mget(keys: string[]): Promise<Map<string, T | undefined>> {
    const results = new Map<string, T | undefined>()
    const promises = keys.map(async (key) => {
      const value = await this.get(key)
      results.set(key, value)
    })

    await Promise.allSettled(promises)
    return results
  }

  async mset(entries: Map<string, T>, ttl?: number): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>()
    const promises = []

    for (const [key, value] of entries) {
      promises.push(
        this.set(key, value, ttl).then(result => {
          results.set(key, result)
        })
      )
    }

    await Promise.allSettled(promises)
    return results
  }

  private isValidEntry(entry: CacheEntry<T>, currentTime: number): boolean {
    if (entry.ttl && currentTime - entry.timestamp > entry.ttl) {
      return false
    }
    return true
  }

  private shouldEvict(newEntrySize: number): boolean {
    return (
      this.stats.size >= this.stats.maxSize ||
      this.stats.memoryUsage + newEntrySize > this.stats.maxMemoryUsage
    )
  }

  private async performEviction(requiredSpace: number): Promise<void> {
    const toEvict = this.selectItemsForEviction(requiredSpace)
    
    for (const key of toEvict) {
      const entry = this.cache.get(key)
      if (entry) {
        this.cache.delete(key)
        this.stats.size--
        this.stats.evictions++
        this.updateMemoryUsage(-entry.size)
        this.accessHistory.delete(key)
        
        this.emit('cache_evicted', { key, reason: this.evictionPolicy })
      }
    }

    logger.debug('AdvancedCacheSystem', 'Evicted cache entries', { 
      count: toEvict.length, 
      policy: this.evictionPolicy 
    })
  }

  private selectItemsForEviction(requiredSpace: number): string[] {
    const entries = Array.from(this.cache.entries())
    let freedSpace = 0
    const toEvict: string[] = []

    // Sort by eviction criteria based on policy
    switch (this.evictionPolicy) {
      case 'LRU':
        entries.sort(([, a], [, b]) => a.lastAccessed - b.lastAccessed)
        break
      case 'LFU':
        entries.sort(([, a], [, b]) => a.accessCount - b.accessCount)
        break
      case 'FIFO':
        entries.sort(([, a], [, b]) => a.timestamp - b.timestamp)
        break
      case 'TTL':
        entries.sort(([, a], [, b]) => {
          const aTTL = a.ttl ? a.timestamp + a.ttl : Infinity
          const bTTL = b.ttl ? b.timestamp + b.ttl : Infinity
          return aTTL - bTTL
        })
        break
      case 'ADAPTIVE':
        entries.sort(([, a], [, b]) => this.calculateEvictionScore(a) - this.calculateEvictionScore(b))
        break
    }

    // Select items to evict
    for (const [key, entry] of entries) {
      toEvict.push(key)
      freedSpace += entry.size
      
      if (freedSpace >= requiredSpace && toEvict.length >= Math.ceil(this.stats.size * 0.1)) {
        break
      }
    }

    return toEvict
  }

  private calculateEvictionScore(entry: CacheEntry<T>): number {
    const currentTime = Date.now()
    const age = currentTime - entry.timestamp
    const timeSinceAccess = currentTime - entry.lastAccessed
    
    // Lower score = higher priority for eviction
    let score = 0
    
    // Frequency component (higher frequency = lower eviction priority)
    score += Math.log(entry.accessCount + 1) * 10
    
    // Recency component (more recent = lower eviction priority)
    score += Math.max(0, 100 - timeSinceAccess / 1000)
    
    // Priority component
    score += entry.priority * 20
    
    // Size component (larger items slightly more likely to be evicted)
    score -= Math.log(entry.size + 1)
    
    // TTL component (items closer to expiry more likely to be evicted)
    if (entry.ttl) {
      const timeToExpiry = entry.timestamp + entry.ttl - currentTime
      score -= Math.max(0, timeToExpiry / 1000)
    }
    
    return score
  }

  private estimateSize(value: T): number {
    try {
      const str = JSON.stringify(value)
      return str.length * 2 // Rough estimate (UTF-16)
    } catch {
      return 1024 // Default size estimate
    }
  }

  private async processValue(value: T): Promise<T> {
    let processedValue = value

    // Compression (simplified - would use actual compression library)
    if (this.compressionEnabled) {
      // Would implement actual compression here
      processedValue = value
    }

    // Encryption (simplified - would use actual encryption library)
    if (this.encryptionEnabled) {
      // Would implement actual encryption here
      processedValue = value
    }

    return processedValue
  }

  private updateAccessHistory(key: string): void {
    const currentTime = Date.now()
    const history = this.accessHistory.get(key) || []
    
    history.push(currentTime)
    
    // Keep only recent access times (last 100)
    if (history.length > 100) {
      history.shift()
    }
    
    this.accessHistory.set(key, history)
  }

  private updateMemoryUsage(delta: number): void {
    this.stats.memoryUsage = Math.max(0, this.stats.memoryUsage + delta)
  }

  private updateHitRate(): void {
    const total = this.stats.hits + this.stats.misses
    this.stats.hitRate = total > 0 ? this.stats.hits / total : 0
  }

  private generatePrefetchPredictions(): PrefetchPrediction[] {
    const predictions: PrefetchPrediction[] = []
    const currentTime = Date.now()
    
    // Analyze access patterns to predict future needs
    for (const [key, history] of this.accessHistory) {
      if (history.length < 3) continue
      
      // Calculate access frequency and pattern
      const recentAccesses = history.filter(time => currentTime - time < 300000) // 5 minutes
      const frequency = recentAccesses.length
      
      if (frequency > 2) {
        // Calculate prediction confidence based on regularity
        const intervals = []
        for (let i = 1; i < recentAccesses.length; i++) {
          intervals.push(recentAccesses[i] - recentAccesses[i - 1])
        }
        
        const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length
        const variance = intervals.reduce((sum, interval) => sum + Math.pow(interval - avgInterval, 2), 0) / intervals.length
        const regularityScore = 1 / (1 + variance / 1000000) // Normalize variance
        
        predictions.push({
          key,
          confidence: regularityScore,
          priority: frequency / 10,
          timestamp: currentTime
        })
      }
    }
    
    return predictions.sort((a, b) => b.confidence - a.confidence).slice(0, 20)
  }

  private getFrequentlyAccessedKeys(limit: number): string[] {
    const keyFrequencies = new Map<string, number>()
    
    for (const [key, history] of this.accessHistory) {
      keyFrequencies.set(key, history.length)
    }
    
    return Array.from(keyFrequencies.entries())
      .sort(([, a], [, b]) => b - a)
      .slice(0, limit)
      .map(([key]) => key)
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.performCleanup()
    }, this.cleanupInterval) as unknown as number
  }

  private startPrefetchTimer(): void {
    this.prefetchTimer = setInterval(() => {
      this.performAutoPrefetch()
    }, 30000) as unknown as number // Every 30 seconds
  }

  private performCleanup(): void {
    const currentTime = Date.now()
    const expiredKeys: string[] = []
    
    for (const [key, entry] of this.cache) {
      if (!this.isValidEntry(entry, currentTime)) {
        expiredKeys.push(key)
      }
    }
    
    for (const key of expiredKeys) {
      this.delete(key)
    }
    
    if (expiredKeys.length > 0) {
      this.emit('cleanup_completed', { expiredCount: expiredKeys.length })
      logger.debug('AdvancedCacheSystem', 'Cleanup completed', { expired: expiredKeys.length })
    }
  }

  private performAutoPrefetch(): void {
    if (!this.prefetchEnabled) return
    
    const predictions = this.generatePrefetchPredictions()
    const highConfidencePredictions = predictions.filter(p => p.confidence > 0.8)
    
    if (highConfidencePredictions.length > 0) {
      this.emit('auto_prefetch_suggested', { keys: highConfidencePredictions.map(p => p.key) })
    }
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = undefined
    }
    
    if (this.prefetchTimer) {
      clearInterval(this.prefetchTimer)
      this.prefetchTimer = undefined
    }
    
    this.clear()
    this.removeAllListeners()
    
    logger.info('AdvancedCacheSystem', 'Cache system disposed')
  }
}