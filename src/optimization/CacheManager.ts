import { EventEmitter } from 'eventemitter3'

export interface CacheEntry<T> {
  key: string
  value: T
  timestamp: number
  lastAccessed: number
  accessCount: number
  ttl?: number
  size?: number
}

export interface CacheConfig {
  maxSize: number // Maximum number of entries
  maxMemory?: number // Maximum memory usage in bytes
  defaultTTL?: number // Default time-to-live in ms
  cleanupInterval: number // Cleanup interval in ms
  evictionPolicy: 'lru' | 'lfu' | 'fifo' | 'random'
}

export interface CacheStats {
  hits: number
  misses: number
  sets: number
  evictions: number
  memoryCleanups: number
}

export class CacheManager<T = any> extends EventEmitter {
  private cache: Map<string, CacheEntry<T>> = new Map()
  private config: CacheConfig
  private cleanupTimer: ReturnType<typeof setInterval> | null = null
  private currentMemoryUsage = 0
  private stats = {
    hits: 0,
    misses: 0,
    sets: 0,
    evictions: 0,
    memoryCleanups: 0
  }

  constructor(config: CacheConfig) {
    super()
    this.config = config
    this.startCleanup()
  }

  set(key: string, value: T, ttl?: number): void {
    const now = Date.now()
    const size = this.calculateSize(value)
    
    // Check if we need to evict entries
    this.ensureCapacity(size)

    const entry: CacheEntry<T> = {
      key,
      value,
      timestamp: now,
      lastAccessed: now,
      accessCount: 0,
      ttl: ttl || this.config.defaultTTL,
      size
    }

    // Remove existing entry if it exists
    const existing = this.cache.get(key)
    if (existing) {
      this.currentMemoryUsage -= existing.size || 0
    }

    this.cache.set(key, entry)
    this.currentMemoryUsage += size || 0
    this.stats.sets++

    this.emit('set', { key, value, size })
  }

  get(key: string): T | undefined {
    const entry = this.cache.get(key)
    
    if (!entry) {
      this.stats.misses++
      this.emit('miss', { key })
      return undefined
    }

    // Check if expired
    if (this.isExpired(entry)) {
      this.delete(key)
      this.stats.misses++
      this.emit('miss', { key, reason: 'expired' })
      return undefined
    }

    // Update access statistics
    entry.lastAccessed = Date.now()
    entry.accessCount++
    this.stats.hits++

    this.emit('hit', { key, value: entry.value })
    return entry.value
  }

  has(key: string): boolean {
    const entry = this.cache.get(key)
    return entry !== undefined && !this.isExpired(entry)
  }

  delete(key: string): boolean {
    const entry = this.cache.get(key)
    if (!entry) return false

    this.cache.delete(key)
    this.currentMemoryUsage -= entry.size || 0
    this.emit('delete', { key, value: entry.value })
    
    return true
  }

  clear(): void {
    const size = this.cache.size
    this.cache.clear()
    this.currentMemoryUsage = 0
    this.emit('clear', { entriesCleared: size })
  }

  // Get or set pattern - useful for expensive computations
  getOrSet(
    key: string, 
    factory: () => T | Promise<T>, 
    ttl?: number
  ): T | Promise<T> {
    const cached = this.get(key)
    if (cached !== undefined) {
      return cached
    }

    const value = factory()
    
    if (value instanceof Promise) {
      return value.then(resolvedValue => {
        this.set(key, resolvedValue, ttl)
        return resolvedValue
      })
    } else {
      this.set(key, value, ttl)
      return value
    }
  }

  // Batch operations
  setMany(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    entries.forEach(({ key, value, ttl }) => {
      this.set(key, value, ttl)
    })
  }

  getMany(keys: string[]): Map<string, T> {
    const results = new Map<string, T>()
    
    keys.forEach(key => {
      const value = this.get(key)
      if (value !== undefined) {
        results.set(key, value)
      }
    })

    return results
  }

  deleteMany(keys: string[]): number {
    let deleted = 0
    keys.forEach(key => {
      if (this.delete(key)) {
        deleted++
      }
    })
    return deleted
  }

  private ensureCapacity(newEntrySize: number = 0): void {
    // Check memory limit
    if (this.config.maxMemory && 
        this.currentMemoryUsage + newEntrySize > this.config.maxMemory) {
      this.evictByMemory(newEntrySize)
    }

    // Check size limit
    if (this.cache.size >= this.config.maxSize) {
      this.evictBySize()
    }
  }

  private evictByMemory(targetSpace: number): void {
    const targetMemory = this.config.maxMemory! - targetSpace
    
    while (this.currentMemoryUsage > targetMemory && this.cache.size > 0) {
      const keyToEvict = this.selectEvictionCandidate()
      if (keyToEvict) {
        this.evict(keyToEvict)
      } else {
        break
      }
    }
  }

  private evictBySize(): void {
    while (this.cache.size >= this.config.maxSize) {
      const keyToEvict = this.selectEvictionCandidate()
      if (keyToEvict) {
        this.evict(keyToEvict)
      } else {
        break
      }
    }
  }

  private selectEvictionCandidate(): string | null {
    if (this.cache.size === 0) return null

    const entries = Array.from(this.cache.entries())
    
    switch (this.config.evictionPolicy) {
      case 'lru':
        return entries.reduce((oldest, [key, entry]) => {
          const [oldestKey, oldestEntry] = oldest
          return entry.lastAccessed < oldestEntry.lastAccessed ? [key, entry] : oldest
        })[0]

      case 'lfu':
        return entries.reduce((least, [key, entry]) => {
          const [leastKey, leastEntry] = least
          return entry.accessCount < leastEntry.accessCount ? [key, entry] : least
        })[0]

      case 'fifo':
        return entries.reduce((oldest, [key, entry]) => {
          const [oldestKey, oldestEntry] = oldest
          return entry.timestamp < oldestEntry.timestamp ? [key, entry] : oldest
        })[0]

      case 'random': {
        const randomIndex = Math.floor(Math.random() * entries.length)
        return entries[randomIndex][0]
      }

      default:
        return entries[0][0] // fallback to first entry
    }
  }

  private evict(key: string): void {
    this.delete(key)
    this.stats.evictions++
    this.emit('evict', { key, policy: this.config.evictionPolicy })
  }

  private isExpired(entry: CacheEntry<T>): boolean {
    if (!entry.ttl) return false
    return Date.now() - entry.timestamp > entry.ttl
  }

  private calculateSize(value: T): number {
    if (this.config.maxMemory === undefined) return 0
    
    try {
      // Rough estimate - in a real implementation you might want more accurate sizing
      const str = JSON.stringify(value)
      return str.length * 2 // Assuming UTF-16 encoding
    } catch {
      return 1000 // Default size for non-serializable objects
    }
  }

  private startCleanup(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private cleanup(): void {
    const now = Date.now()
    const expiredKeys: string[] = []

    this.cache.forEach((entry, key) => {
      if (this.isExpired(entry)) {
        expiredKeys.push(key)
      }
    })

    const cleanedCount = this.deleteMany(expiredKeys)
    
    if (cleanedCount > 0) {
      this.stats.memoryCleanups++
      this.emit('cleanup', { expiredEntries: cleanedCount })
    }
  }

  // Cache warming - preload frequently accessed data
  warm(entries: Array<{ key: string; value: T; ttl?: number }>): void {
    this.emit('warmStart', { count: entries.length })
    
    entries.forEach(({ key, value, ttl }, index) => {
      // Add small delay to prevent blocking
      setTimeout(() => {
        this.set(key, value, ttl)
        
        if (index === entries.length - 1) {
          this.emit('warmComplete', { count: entries.length })
        }
      }, index * 10)
    })
  }

  // Statistics and monitoring
  getStatistics(): {
    hitRate: number
    size: number
    memoryUsage: number
    maxMemory?: number
    stats: CacheStats
    config: CacheConfig
  } {
    const totalRequests = this.stats.hits + this.stats.misses
    const hitRate = totalRequests > 0 ? this.stats.hits / totalRequests : 0

    return {
      hitRate,
      size: this.cache.size,
      memoryUsage: this.currentMemoryUsage,
      maxMemory: this.config.maxMemory,
      stats: { ...this.stats },
      config: this.config
    }
  }

  // Get all keys (useful for debugging)
  keys(): string[] {
    return Array.from(this.cache.keys())
  }

  // Get entries by pattern
  getByPattern(pattern: RegExp): Map<string, T> {
    const results = new Map<string, T>()
    
    this.cache.forEach((entry, key) => {
      if (pattern.test(key) && !this.isExpired(entry)) {
        entry.lastAccessed = Date.now()
        entry.accessCount++
        results.set(key, entry.value)
      }
    })

    return results
  }

  // Export/import for persistence
  export(): Array<{ key: string; value: T; timestamp: number; ttl?: number }> {
    const entries: Array<{ key: string; value: T; timestamp: number; ttl?: number }> = []
    
    this.cache.forEach((entry, key) => {
      if (!this.isExpired(entry)) {
        entries.push({
          key,
          value: entry.value,
          timestamp: entry.timestamp,
          ttl: entry.ttl
        })
      }
    })

    return entries
  }

  import(entries: Array<{ key: string; value: T; timestamp: number; ttl?: number }>): void {
    const now = Date.now()
    
    entries.forEach(({ key, value, timestamp, ttl }) => {
      // Check if entry is still valid
      if (!ttl || (now - timestamp) < ttl) {
        const remainingTTL = ttl ? ttl - (now - timestamp) : undefined
        this.set(key, value, remainingTTL)
      }
    })
  }

  dispose(): void {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer)
      this.cleanupTimer = null
    }

    this.clear()
    this.removeAllListeners()
  }
}

// Specialized cache for agent data
export class AgentCache extends CacheManager<any> {
  constructor(config?: Partial<CacheConfig>) {
    super({
      maxSize: 10000,
      maxMemory: 50 * 1024 * 1024, // 50MB
      defaultTTL: 5 * 60 * 1000, // 5 minutes
      cleanupInterval: 60 * 1000, // 1 minute
      evictionPolicy: 'lru',
      ...config
    })
  }

  cacheAgentState(agentId: string, state: any, ttl?: number): void {
    this.set(`agent:${agentId}:state`, state, ttl)
  }

  getAgentState(agentId: string): any {
    return this.get(`agent:${agentId}:state`)
  }

  cacheAgentMetrics(agentId: string, metrics: any, ttl?: number): void {
    this.set(`agent:${agentId}:metrics`, metrics, ttl || 30000) // 30 seconds for metrics
  }

  getAgentMetrics(agentId: string): any {
    return this.get(`agent:${agentId}:metrics`)
  }

  invalidateAgent(agentId: string): void {
    const pattern = new RegExp(`^agent:${agentId}:`)
    const keys = this.keys().filter(key => pattern.test(key))
    this.deleteMany(keys)
  }
}