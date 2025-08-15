/**
 * WebGL Compute Pipeline
 * GPU-accelerated computation pipeline for massive parallel processing
 */

import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'

interface ComputeShader {
  id: string
  name: string
  source: string
  uniforms: Record<string, unknown>
  workgroupSize: [number, number, number]
  compiled?: WebGLProgram
}

interface ComputeBuffer {
  id: string
  buffer: WebGLBuffer
  size: number
  type: 'uniform' | 'storage' | 'vertex' | 'index'
  usage: number
  data?: ArrayBuffer
}

interface ComputeTask {
  id: string
  shaderId: string
  workgroups: [number, number, number]
  buffers: Map<string, string> // binding -> buffer id
  uniforms: Record<string, unknown>
  dependencies: string[]
  priority: number
  timestamp: number
}

interface PipelineStats {
  totalTasks: number
  completedTasks: number
  failedTasks: number
  averageExecutionTime: number
  gpuUtilization: number
  memoryUsage: number
  maxMemoryUsage: number
  throughput: number
}

export class WebGLComputePipeline extends EventEmitter {
  private gl: WebGL2RenderingContext
  private canvas: HTMLCanvasElement
  private shaders: Map<string, ComputeShader> = new Map()
  private buffers: Map<string, ComputeBuffer> = new Map()
  private tasks: Map<string, ComputeTask> = new Map()
  private taskQueue: string[] = []
  private completedTasks: Map<string, { result?: ArrayBuffer; error?: Error; executionTime: number }> = new Map()
  
  private isProcessing = false
  private maxBufferSize = 256 * 1024 * 1024 // 256MB
  private currentMemoryUsage = 0
  
  private stats: PipelineStats = {
    totalTasks: 0,
    completedTasks: 0,
    failedTasks: 0,
    averageExecutionTime: 0,
    gpuUtilization: 0,
    memoryUsage: 0,
    maxMemoryUsage: 256 * 1024 * 1024,
    throughput: 0
  }
  
  private processingTimer?: number
  private monitoringTimer?: number

  constructor(canvas?: HTMLCanvasElement) {
    super()
    
    // Create or use provided canvas
    this.canvas = canvas || this.createOffscreenCanvas()
    
    // Get WebGL2 context
    const gl = this.canvas.getContext('webgl2', {
      alpha: false,
      antialias: false,
      depth: false,
      stencil: false,
      preserveDrawingBuffer: false,
      powerPreference: 'high-performance'
    })
    
    if (!gl) {
      throw new Error('WebGL2 not supported')
    }
    
    this.gl = gl
    
    // Check for compute shader support (WebGL2 compute is not standard yet)
    this.checkComputeSupport()
    
    this.startProcessing()
    this.startMonitoring()
    
    logger.info('WebGLComputePipeline', 'GPU compute pipeline initialized', {
      vendor: gl.getParameter(gl.VENDOR),
      renderer: gl.getParameter(gl.RENDERER),
      version: gl.getParameter(gl.VERSION),
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxUniformBuffers: gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS)
    })
  }

  createShader(
    id: string,
    name: string,
    vertexSource: string,
    fragmentSource: string,
    workgroupSize: [number, number, number] = [1, 1, 1]
  ): boolean {
    try {
      const shader: ComputeShader = {
        id,
        name,
        source: fragmentSource, // Using fragment shader for compute-like operations
        uniforms: {},
        workgroupSize
      }
      
      // Compile shaders
      const vertexShader = this.compileShader(vertexSource, this.gl.VERTEX_SHADER)
      const fragmentShader = this.compileShader(fragmentSource, this.gl.FRAGMENT_SHADER)
      
      if (!vertexShader || !fragmentShader) {
        return false
      }
      
      // Create program
      const program = this.gl.createProgram()
      if (!program) {
        return false
      }
      
      this.gl.attachShader(program, vertexShader)
      this.gl.attachShader(program, fragmentShader)
      this.gl.linkProgram(program)
      
      if (!this.gl.getProgramParameter(program, this.gl.LINK_STATUS)) {
        const error = this.gl.getProgramInfoLog(program)
        logger.error('WebGLComputePipeline', 'Shader program linking failed', { id, error })
        return false
      }
      
      shader.compiled = program
      this.shaders.set(id, shader)
      
      this.emit('shader_created', { id, name })
      logger.info('WebGLComputePipeline', 'Shader created', { id, name })
      
      return true
      
    } catch (error) {
      logger.error('WebGLComputePipeline', 'Failed to create shader', { id, error })
      return false
    }
  }

  createBuffer(
    id: string,
    size: number,
    type: 'uniform' | 'storage' | 'vertex' | 'index' = 'storage',
    data?: ArrayBuffer
  ): boolean {
    try {
      if (this.currentMemoryUsage + size > this.maxBufferSize) {
        logger.warn('WebGLComputePipeline', 'Buffer creation would exceed memory limit', {
          id,
          size,
          currentUsage: this.currentMemoryUsage,
          maxSize: this.maxBufferSize
        })
        return false
      }
      
      const buffer = this.gl.createBuffer()
      if (!buffer) {
        return false
      }
      
      let target: number
      let usage: number
      
      switch (type) {
        case 'uniform':
          target = this.gl.UNIFORM_BUFFER
          usage = this.gl.DYNAMIC_DRAW
          break
        case 'vertex':
          target = this.gl.ARRAY_BUFFER
          usage = this.gl.STATIC_DRAW
          break
        case 'index':
          target = this.gl.ELEMENT_ARRAY_BUFFER
          usage = this.gl.STATIC_DRAW
          break
        default:
          target = this.gl.ARRAY_BUFFER
          usage = this.gl.DYNAMIC_DRAW
      }
      
      this.gl.bindBuffer(target, buffer)
      
      if (data) {
        this.gl.bufferData(target, data, usage)
      } else {
        this.gl.bufferData(target, size, usage)
      }
      
      this.gl.bindBuffer(target, null)
      
      const computeBuffer: ComputeBuffer = {
        id,
        buffer,
        size,
        type,
        usage,
        data: data ? data.slice(0) : undefined
      }
      
      this.buffers.set(id, computeBuffer)
      this.currentMemoryUsage += size
      this.stats.memoryUsage = this.currentMemoryUsage
      
      this.emit('buffer_created', { id, size, type })
      logger.debug('WebGLComputePipeline', 'Buffer created', { id, size, type })
      
      return true
      
    } catch (error) {
      logger.error('WebGLComputePipeline', 'Failed to create buffer', { id, error })
      return false
    }
  }

  updateBuffer(id: string, data: ArrayBuffer, offset = 0): boolean {
    try {
      const buffer = this.buffers.get(id)
      if (!buffer) {
        return false
      }
      
      let target: number
      switch (buffer.type) {
        case 'uniform':
          target = this.gl.UNIFORM_BUFFER
          break
        case 'vertex':
          target = this.gl.ARRAY_BUFFER
          break
        case 'index':
          target = this.gl.ELEMENT_ARRAY_BUFFER
          break
        default:
          target = this.gl.ARRAY_BUFFER
      }
      
      this.gl.bindBuffer(target, buffer.buffer)
      this.gl.bufferSubData(target, offset, data)
      this.gl.bindBuffer(target, null)
      
      // Update stored data
      if (buffer.data) {
        const view = new Uint8Array(buffer.data)
        const newData = new Uint8Array(data)
        view.set(newData, offset)
      }
      
      this.emit('buffer_updated', { id, size: data.byteLength, offset })
      
      return true
      
    } catch (error) {
      logger.error('WebGLComputePipeline', 'Failed to update buffer', { id, error })
      return false
    }
  }

  readBuffer(id: string): ArrayBuffer | null {
    try {
      const buffer = this.buffers.get(id)
      if (!buffer) {
        return null
      }
      
      // For WebGL2, we need to use transform feedback or textures for GPU->CPU transfer
      // This is a simplified version that returns stored data
      return buffer.data ? buffer.data.slice(0) : null
      
    } catch (error) {
      logger.error('WebGLComputePipeline', 'Failed to read buffer', { id, error })
      return null
    }
  }

  async submitTask(
    id: string,
    shaderId: string,
    workgroups: [number, number, number],
    buffers: Map<string, string>,
    uniforms: Record<string, unknown> = {},
    options: {
      dependencies?: string[]
      priority?: number
    } = {}
  ): Promise<string> {
    const task: ComputeTask = {
      id,
      shaderId,
      workgroups,
      buffers,
      uniforms,
      dependencies: options.dependencies || [],
      priority: options.priority || 0,
      timestamp: Date.now()
    }
    
    // Validate shader exists
    if (!this.shaders.has(shaderId)) {
      throw new Error(`Shader ${shaderId} not found`)
    }
    
    // Validate buffers exist
    for (const bufferId of buffers.values()) {
      if (!this.buffers.has(bufferId)) {
        throw new Error(`Buffer ${bufferId} not found`)
      }
    }
    
    this.tasks.set(id, task)
    this.stats.totalTasks++
    
    // Add to queue if dependencies are satisfied
    if (this.areDependenciesSatisfied(task)) {
      this.addToQueue(id)
    }
    
    this.emit('task_submitted', { id, shaderId, workgroups })
    
    return id
  }

  async waitForTask(taskId: string): Promise<ArrayBuffer | null> {
    return new Promise((resolve, reject) => {
      const checkCompletion = () => {
        const completed = this.completedTasks.get(taskId)
        if (completed) {
          if (completed.error) {
            reject(completed.error)
          } else {
            resolve(completed.result || null)
          }
          return
        }
        
        const task = this.tasks.get(taskId)
        if (!task) {
          reject(new Error(`Task ${taskId} not found`))
          return
        }
        
        // Check again after a delay
        setTimeout(checkCompletion, 100)
      }
      
      checkCompletion()
    })
  }

  cancelTask(taskId: string): boolean {
    const task = this.tasks.get(taskId)
    if (!task) return false
    
    // Remove from queue
    const queueIndex = this.taskQueue.indexOf(taskId)
    if (queueIndex > -1) {
      this.taskQueue.splice(queueIndex, 1)
    }
    
    this.tasks.delete(taskId)
    this.completedTasks.set(taskId, {
      error: new Error('Task cancelled'),
      executionTime: Date.now() - task.timestamp
    })
    
    this.emit('task_cancelled', { id: taskId })
    
    return true
  }

  private createOffscreenCanvas(): HTMLCanvasElement {
    if (typeof OffscreenCanvas !== 'undefined') {
      // Use OffscreenCanvas if available
      return new OffscreenCanvas(1, 1) as unknown as HTMLCanvasElement
    } else {
      // Fallback to regular canvas
      const canvas = document.createElement('canvas')
      canvas.width = 1
      canvas.height = 1
      canvas.style.display = 'none'
      return canvas
    }
  }

  private checkComputeSupport(): void {
    const gl = this.gl
    
    // Check for required extensions
    const transformFeedback = gl.getExtension('EXT_transform_feedback')
    const textureFloat = gl.getExtension('EXT_color_buffer_float')
    
    logger.info('WebGLComputePipeline', 'Compute support check', {
      transformFeedback: !!transformFeedback,
      textureFloat: !!textureFloat,
      maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
      maxUniformBuffers: gl.getParameter(gl.MAX_UNIFORM_BUFFER_BINDINGS),
      maxVertexUniformBlocks: gl.getParameter(gl.MAX_VERTEX_UNIFORM_BLOCKS),
      maxFragmentUniformBlocks: gl.getParameter(gl.MAX_FRAGMENT_UNIFORM_BLOCKS)
    })
  }

  private compileShader(source: string, type: number): WebGLShader | null {
    const shader = this.gl.createShader(type)
    if (!shader) {
      return null
    }
    
    this.gl.shaderSource(shader, source)
    this.gl.compileShader(shader)
    
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      const error = this.gl.getShaderInfoLog(shader)
      logger.error('WebGLComputePipeline', 'Shader compilation failed', { error, source })
      this.gl.deleteShader(shader)
      return null
    }
    
    return shader
  }

  private startProcessing(): void {
    this.processingTimer = setInterval(() => {
      if (!this.isProcessing && this.taskQueue.length > 0) {
        this.processNextTask()
      }
    }, 16) as unknown as number // ~60 FPS
  }

  private startMonitoring(): void {
    this.monitoringTimer = setInterval(() => {
      this.updateStats()
    }, 5000) as unknown as number // Every 5 seconds
  }

  private async processNextTask(): Promise<void> {
    if (this.taskQueue.length === 0) return
    
    this.isProcessing = true
    const taskId = this.selectNextTask()
    
    if (!taskId) {
      this.isProcessing = false
      return
    }
    
    const task = this.tasks.get(taskId)
    if (!task) {
      this.isProcessing = false
      return
    }
    
    try {
      await this.executeTask(task)
    } catch (error) {
      logger.error('WebGLComputePipeline', 'Task execution failed', { taskId, error })
    }
    
    this.isProcessing = false
  }

  private selectNextTask(): string | null {
    const eligibleTasks = this.taskQueue.filter(id => {
      const task = this.tasks.get(id)
      return task && this.areDependenciesSatisfied(task)
    })
    
    if (eligibleTasks.length === 0) return null
    
    // Select highest priority task
    return eligibleTasks.reduce((highest, current) => {
      const highestTask = this.tasks.get(highest)!
      const currentTask = this.tasks.get(current)!
      return currentTask.priority > highestTask.priority ? current : highest
    })
  }

  private async executeTask(task: ComputeTask): Promise<void> {
    const startTime = Date.now()
    
    // Remove from queue
    const queueIndex = this.taskQueue.indexOf(task.id)
    if (queueIndex > -1) {
      this.taskQueue.splice(queueIndex, 1)
    }
    
    this.emit('task_started', { id: task.id })
    
    try {
      const shader = this.shaders.get(task.shaderId)!
      const program = shader.compiled!
      
      // Use the shader program
      this.gl.useProgram(program)
      
      // Bind buffers and set uniforms
      this.bindTaskResources(task, program)
      
      // Execute compute-like operation using render pass
      await this.executeRenderPass(task)
      
      // Read results if needed
      const result = this.readTaskResults(task)
      
      const executionTime = Date.now() - startTime
      
      // Mark as completed
      this.completedTasks.set(task.id, { result, executionTime })
      this.stats.completedTasks++
      
      // Check dependent tasks
      this.checkDependentTasks(task.id)
      
      this.emit('task_completed', { id: task.id, executionTime })
      
      logger.debug('WebGLComputePipeline', 'Task completed', {
        id: task.id,
        executionTime
      })
      
    } catch (error) {
      const executionTime = Date.now() - startTime
      
      this.completedTasks.set(task.id, { 
        error: error as Error, 
        executionTime 
      })
      this.stats.failedTasks++
      
      this.emit('task_failed', { id: task.id, error })
      
      logger.error('WebGLComputePipeline', 'Task failed', {
        id: task.id,
        error: (error as Error).message
      })
    } finally {
      // Cleanup
      this.gl.useProgram(null)
      this.tasks.delete(task.id)
    }
  }

  private bindTaskResources(task: ComputeTask, program: WebGLProgram): void {
    // Bind buffers
    let bindingIndex = 0
    for (const [binding, bufferId] of task.buffers) {
      const buffer = this.buffers.get(bufferId)
      if (buffer) {
        if (buffer.type === 'uniform') {
          this.gl.bindBufferBase(this.gl.UNIFORM_BUFFER, bindingIndex, buffer.buffer)
          bindingIndex++
        }
        // For other buffer types, we'd bind them appropriately for the shader
      }
    }
    
    // Set uniforms
    for (const [name, value] of Object.entries(task.uniforms)) {
      const location = this.gl.getUniformLocation(program, name)
      if (location !== null) {
        this.setUniform(location, value)
      }
    }
  }

  private setUniform(location: WebGLUniformLocation, value: unknown): void {
    if (typeof value === 'number') {
      this.gl.uniform1f(location, value)
    } else if (Array.isArray(value)) {
      switch (value.length) {
        case 2:
          this.gl.uniform2fv(location, value)
          break
        case 3:
          this.gl.uniform3fv(location, value)
          break
        case 4:
          this.gl.uniform4fv(location, value)
          break
        case 16:
          this.gl.uniformMatrix4fv(location, false, value)
          break
      }
    }
  }

  private async executeRenderPass(task: ComputeTask): Promise<void> {
    // Create a simple full-screen quad for compute-like operations
    const vertices = new Float32Array([
      -1, -1, 0, 0,
       1, -1, 1, 0,
      -1,  1, 0, 1,
       1,  1, 1, 1
    ])
    
    const vertexBuffer = this.gl.createBuffer()
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, vertexBuffer)
    this.gl.bufferData(this.gl.ARRAY_BUFFER, vertices, this.gl.STATIC_DRAW)
    
    // Set up vertex attributes
    const positionLocation = this.gl.getAttribLocation(this.shaders.get(task.shaderId)!.compiled!, 'position')
    const texCoordLocation = this.gl.getAttribLocation(this.shaders.get(task.shaderId)!.compiled!, 'texCoord')
    
    if (positionLocation >= 0) {
      this.gl.enableVertexAttribArray(positionLocation)
      this.gl.vertexAttribPointer(positionLocation, 2, this.gl.FLOAT, false, 16, 0)
    }
    
    if (texCoordLocation >= 0) {
      this.gl.enableVertexAttribArray(texCoordLocation)
      this.gl.vertexAttribPointer(texCoordLocation, 2, this.gl.FLOAT, false, 16, 8)
    }
    
    // Set viewport based on workgroup size
    this.gl.viewport(0, 0, task.workgroups[0], task.workgroups[1])
    
    // Draw
    this.gl.drawArrays(this.gl.TRIANGLE_STRIP, 0, 4)
    
    // Wait for completion
    this.gl.finish()
    
    // Cleanup
    this.gl.deleteBuffer(vertexBuffer)
    
    if (positionLocation >= 0) {
      this.gl.disableVertexAttribArray(positionLocation)
    }
    if (texCoordLocation >= 0) {
      this.gl.disableVertexAttribArray(texCoordLocation)
    }
  }

  private readTaskResults(task: ComputeTask): ArrayBuffer | null {
    // In a real compute pipeline, this would read from output buffers/textures
    // For this simplified version, we return null
    return null
  }

  private areDependenciesSatisfied(task: ComputeTask): boolean {
    return task.dependencies.every(depId => this.completedTasks.has(depId))
  }

  private addToQueue(taskId: string): void {
    if (!this.taskQueue.includes(taskId)) {
      this.taskQueue.push(taskId)
    }
  }

  private checkDependentTasks(completedTaskId: string): void {
    for (const [taskId, task] of this.tasks) {
      if (task.dependencies.includes(completedTaskId) && 
          this.areDependenciesSatisfied(task) && 
          !this.taskQueue.includes(taskId)) {
        this.addToQueue(taskId)
      }
    }
  }

  private updateStats(): void {
    const completedTaskList = Array.from(this.completedTasks.values())
    if (completedTaskList.length > 0) {
      this.stats.averageExecutionTime = completedTaskList
        .reduce((sum, c) => sum + c.executionTime, 0) / completedTaskList.length
    }
    
    this.stats.gpuUtilization = this.isProcessing ? 100 : 0
    this.stats.throughput = this.stats.completedTasks / Math.max(1, (Date.now() - Date.now()) / 1000)
  }

  getStats(): PipelineStats {
    this.updateStats()
    return { ...this.stats }
  }

  deleteBuffer(id: string): boolean {
    const buffer = this.buffers.get(id)
    if (buffer) {
      this.gl.deleteBuffer(buffer.buffer)
      this.buffers.delete(id)
      this.currentMemoryUsage -= buffer.size
      this.stats.memoryUsage = this.currentMemoryUsage
      
      this.emit('buffer_deleted', { id })
      return true
    }
    return false
  }

  deleteShader(id: string): boolean {
    const shader = this.shaders.get(id)
    if (shader && shader.compiled) {
      this.gl.deleteProgram(shader.compiled)
      this.shaders.delete(id)
      
      this.emit('shader_deleted', { id })
      return true
    }
    return false
  }

  dispose(): void {
    // Cancel all pending tasks
    for (const taskId of this.taskQueue) {
      this.cancelTask(taskId)
    }
    
    // Stop timers
    if (this.processingTimer) {
      clearInterval(this.processingTimer)
      this.processingTimer = undefined
    }
    
    if (this.monitoringTimer) {
      clearInterval(this.monitoringTimer)
      this.monitoringTimer = undefined
    }
    
    // Delete all WebGL resources
    for (const bufferId of this.buffers.keys()) {
      this.deleteBuffer(bufferId)
    }
    
    for (const shaderId of this.shaders.keys()) {
      this.deleteShader(shaderId)
    }
    
    // Clear data structures
    this.tasks.clear()
    this.taskQueue.length = 0
    this.completedTasks.clear()
    
    this.removeAllListeners()
    
    logger.info('WebGLComputePipeline', 'GPU compute pipeline disposed')
  }
}