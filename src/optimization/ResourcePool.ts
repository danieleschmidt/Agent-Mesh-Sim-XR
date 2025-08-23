import { EventEmitter } from 'eventemitter3'

export interface PoolableResource {
  id: string
  inUse: boolean
  lastUsed: number
  reset(): void
  dispose(): void
}

export interface ResourceFactory<T extends PoolableResource> {
  create(): T
  validate(resource: T): boolean
}

export interface PoolConfig {
  initialSize: number
  maxSize: number
  growthSize: number
  maxIdleTime: number // ms
  cleanupInterval: number // ms
}

export class ResourcePool<T extends PoolableResource> extends EventEmitter {
  private resources: T[] = []
  private availableResources: T[] = []
  private usedResources: Set<T> = new Set()
  private factory: ResourceFactory<T>
  private config: PoolConfig
  private cleanupTimer: ReturnType<typeof setTimeout> | null = null
  private stats = {
    created: 0,
    reused: 0,
    disposed: 0,
    hits: 0,
    misses: 0
  }

  constructor(factory: ResourceFactory<T>, config: PoolConfig) {
    super()
    this.factory = factory
    this.config = config

    this.initializePool()
    this.startCleanupTimer()
  }

  private initializePool(): void {
    for (let i = 0; i < this.config.initialSize; i++) {
      const resource = this.createResource()
      this.availableResources.push(resource)
    }
  }

  private createResource(): T {
    const resource = this.factory.create()
    this.resources.push(resource)
    this.stats.created++
    this.emit('resourceCreated', resource)
    return resource
  }

  acquire(): T | null {
    // Try to get an available resource
    let resource = this.availableResources.pop()

    if (resource) {
      // Validate the resource
      if (!this.factory.validate(resource)) {
        // Resource is invalid, dispose and create new one
        this.disposeResource(resource)
        resource = null
      } else {
        this.stats.hits++
        this.stats.reused++
      }
    }

    // Create new resource if none available and under max size
    if (!resource) {
      if (this.resources.length < this.config.maxSize) {
        resource = this.createResource()
        this.stats.misses++
      } else {
        // Pool is full, return null
        this.emit('poolExhausted', { 
          maxSize: this.config.maxSize,
          currentSize: this.resources.length 
        })
        return null
      }
    }

    // Mark as in use
    resource.inUse = true
    resource.lastUsed = Date.now()
    this.usedResources.add(resource)

    this.emit('resourceAcquired', resource)
    return resource
  }

  release(resource: T): void {
    if (!this.usedResources.has(resource)) {
      throw new Error('Resource is not from this pool or already released')
    }

    // Reset the resource
    try {
      resource.reset()
      resource.inUse = false
      resource.lastUsed = Date.now()

      // Move from used to available
      this.usedResources.delete(resource)
      this.availableResources.push(resource)

      this.emit('resourceReleased', resource)
    } catch (error) {
      // If reset fails, dispose the resource
      this.disposeResource(resource)
      this.emit('resourceResetFailed', { resource, error })
    }
  }

  private disposeResource(resource: T): void {
    try {
      resource.dispose()
    } catch (error) {
      this.emit('resourceDisposeError', { resource, error })
    }

    // Remove from all collections
    this.usedResources.delete(resource)
    const availableIndex = this.availableResources.indexOf(resource)
    if (availableIndex >= 0) {
      this.availableResources.splice(availableIndex, 1)
    }
    const resourceIndex = this.resources.indexOf(resource)
    if (resourceIndex >= 0) {
      this.resources.splice(resourceIndex, 1)
    }

    this.stats.disposed++
    this.emit('resourceDisposed', resource)
  }

  private startCleanupTimer(): void {
    this.cleanupTimer = setInterval(() => {
      this.cleanup()
    }, this.config.cleanupInterval)
  }

  private cleanup(): void {
    const now = Date.now()
    const toDispose: T[] = []

    // Find idle resources to dispose
    this.availableResources.forEach(resource => {
      if (now - resource.lastUsed > this.config.maxIdleTime) {
        toDispose.push(resource)
      }
    })

    // Dispose idle resources but keep minimum pool size
    const targetSize = Math.max(
      this.config.initialSize,
      this.availableResources.length - toDispose.length
    )
    
    const canDispose = this.availableResources.length - targetSize
    const actualDispose = Math.min(canDispose, toDispose.length)

    for (let i = 0; i < actualDispose; i++) {
      this.disposeResource(toDispose[i])
    }

    if (actualDispose > 0) {
      this.emit('cleanupCompleted', { disposed: actualDispose, remaining: this.availableResources.length })
    }
  }

  grow(size: number = this.config.growthSize): number {
    const currentSize = this.resources.length
    const newSize = Math.min(currentSize + size, this.config.maxSize)
    const actualGrowth = newSize - currentSize

    for (let i = 0; i < actualGrowth; i++) {
      const resource = this.createResource()
      this.availableResources.push(resource)
    }

    this.emit('poolGrown', { previousSize: currentSize, newSize, actualGrowth })
    return actualGrowth
  }

  shrink(size: number): number {
    const available = this.availableResources.length
    const actualShrink = Math.min(size, available - this.config.initialSize)

    for (let i = 0; i < actualShrink; i++) {
      const resource = this.availableResources.pop()!
      this.disposeResource(resource)
    }

    this.emit('poolShrunk', { shrunk: actualShrink, remaining: this.availableResources.length })
    return actualShrink
  }

  getStatistics(): {
    totalResources: number
    availableResources: number
    usedResources: number
    hitRate: number
    stats: typeof this.stats
  } {
    const total = this.stats.hits + this.stats.misses
    return {
      totalResources: this.resources.length,
      availableResources: this.availableResources.length,
      usedResources: this.usedResources.size,
      hitRate: total > 0 ? this.stats.hits / total : 0,
      stats: { ...this.stats }
    }
  }

  clear(): void {
    // Dispose all resources
    [...this.resources].forEach(resource => {
      this.disposeResource(resource)
    })

    // Clear collections
    this.resources = []
    this.availableResources = []
    this.usedResources.clear()

    // Reset stats
    this.stats = {
      created: 0,
      reused: 0,
      disposed: 0,
      hits: 0,
      misses: 0
    }

    this.emit('poolCleared')
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

// Specialized pools for common resources

export class ObjectPool<T extends object> extends ResourcePool<PoolableObject<T>> {
  constructor(objectFactory: () => T, resetFunction: (obj: T) => void, config: PoolConfig) {
    const factory: ResourceFactory<PoolableObject<T>> = {
      create: () => new PoolableObject(objectFactory(), resetFunction),
      validate: (resource) => resource.object !== null
    }
    super(factory, config)
  }
}

class PoolableObject<T> implements PoolableResource {
  id: string
  inUse = false
  lastUsed = 0

  constructor(public object: T, private resetFn: (obj: T) => void) {
    this.id = `obj_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }

  reset(): void {
    this.resetFn(this.object)
  }

  dispose(): void {
    // Override in subclasses if object needs special disposal
  }
}

export class BufferPool extends ResourcePool<PoolableBuffer> {
  constructor(bufferSize: number, config: PoolConfig) {
    const factory: ResourceFactory<PoolableBuffer> = {
      create: () => new PoolableBuffer(bufferSize),
      validate: (resource) => resource.buffer.byteLength === bufferSize
    }
    super(factory, config)
  }
}

class PoolableBuffer implements PoolableResource {
  id: string
  inUse = false
  lastUsed = 0
  buffer: ArrayBuffer

  constructor(size: number) {
    this.id = `buf_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.buffer = new ArrayBuffer(size)
  }

  reset(): void {
    // Clear buffer contents
    const view = new Uint8Array(this.buffer)
    view.fill(0)
  }

  dispose(): void {
    // ArrayBuffers are garbage collected
  }
}

// Pool manager for managing multiple pools
export class PoolManager extends EventEmitter {
  private pools: Map<string, ResourcePool<any>> = new Map()

  registerPool<T extends PoolableResource>(name: string, pool: ResourcePool<T>): void {
    if (this.pools.has(name)) {
      throw new Error(`Pool '${name}' is already registered`)
    }

    this.pools.set(name, pool)
    
    // Forward pool events
    pool.on('resourceCreated', (resource) => this.emit('resourceCreated', { pool: name, resource }))
    pool.on('resourceAcquired', (resource) => this.emit('resourceAcquired', { pool: name, resource }))
    pool.on('resourceReleased', (resource) => this.emit('resourceReleased', { pool: name, resource }))
    pool.on('poolExhausted', (data) => this.emit('poolExhausted', { pool: name, ...data }))
  }

  getPool<T extends PoolableResource>(name: string): ResourcePool<T> | undefined {
    return this.pools.get(name)
  }

  getAllStatistics(): Record<string, any> {
    const stats: Record<string, any> = {}
    
    this.pools.forEach((pool, name) => {
      stats[name] = pool.getStatistics()
    })

    return stats
  }

  dispose(): void {
    this.pools.forEach(pool => pool.dispose())
    this.pools.clear()
    this.removeAllListeners()
  }
}