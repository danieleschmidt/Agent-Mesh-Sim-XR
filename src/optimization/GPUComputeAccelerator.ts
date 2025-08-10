import { EventEmitter } from 'eventemitter3'
import { logger } from '../utils/Logger'
import { WebGLRenderer, DataTexture, RGBAFormat, FloatType, Scene, OrthographicCamera, PlaneGeometry, Mesh, ShaderMaterial } from 'three'

export interface ComputeKernel {
  id: string
  name: string
  vertexShader: string
  fragmentShader: string
  uniforms?: Record<string, any>
  textureSize: { width: number; height: number }
  outputFormat: 'rgba' | 'rg' | 'r'
}

export interface ComputeJob {
  id: string
  kernelId: string
  inputTextures: Record<string, DataTexture>
  outputTexture?: DataTexture
  priority: number
  callback?: (result: DataTexture) => void
}

export class GPUComputeAccelerator extends EventEmitter {
  private renderer: WebGLRenderer
  private scene: Scene
  private camera: OrthographicCamera
  private kernels: Map<string, ComputeKernel> = new Map()
  private jobQueue: ComputeJob[] = []
  private isProcessing = false
  private maxTextureSize = 4096
  private isSupported = false

  constructor(renderer?: WebGLRenderer) {
    super()
    
    if (renderer) {
      this.renderer = renderer
    } else {
      this.renderer = new WebGLRenderer()
    }
    
    this.scene = new Scene()
    this.camera = new OrthographicCamera(-1, 1, 1, -1, 0, 1)
    
    this.checkSupport()
    this.initializeBuiltinKernels()
    
    logger.info('GPUComputeAccelerator initialized', { 
      isSupported: this.isSupported,
      maxTextureSize: this.maxTextureSize 
    })
  }

  private checkSupport(): void {
    const gl = this.renderer.getContext()
    
    // Check for floating point texture support
    const floatTextureExt = gl.getExtension('OES_texture_float') || 
                           gl.getExtension('EXT_color_buffer_float')
    
    // Check for texture size limits
    this.maxTextureSize = gl.getParameter(gl.MAX_TEXTURE_SIZE)
    
    this.isSupported = !!(floatTextureExt && this.maxTextureSize >= 1024)
    
    if (!this.isSupported) {
      logger.warn('GPU compute acceleration not fully supported', {
        hasFloatTextures: !!floatTextureExt,
        maxTextureSize: this.maxTextureSize
      })
    }
  }

  private initializeBuiltinKernels(): void {
    // Agent Position Update Kernel
    this.addKernel({
      id: 'agent_position_update',
      name: 'Agent Position Update',
      vertexShader: `
        attribute vec2 position;
        varying vec2 vUv;
        
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform sampler2D u_positions;
        uniform sampler2D u_velocities;
        uniform float u_deltaTime;
        uniform vec3 u_boundaries;
        
        varying vec2 vUv;
        
        void main() {
          vec4 position = texture2D(u_positions, vUv);
          vec4 velocity = texture2D(u_velocities, vUv);
          
          // Update position
          vec3 newPos = position.xyz + velocity.xyz * u_deltaTime;
          
          // Apply boundaries (bounce)
          if (newPos.x > u_boundaries.x || newPos.x < -u_boundaries.x) {
            velocity.x = -velocity.x;
            newPos.x = clamp(newPos.x, -u_boundaries.x, u_boundaries.x);
          }
          
          if (newPos.y > u_boundaries.y || newPos.y < -u_boundaries.y) {
            velocity.y = -velocity.y;
            newPos.y = clamp(newPos.y, -u_boundaries.y, u_boundaries.y);
          }
          
          if (newPos.z > u_boundaries.z || newPos.z < -u_boundaries.z) {
            velocity.z = -velocity.z;
            newPos.z = clamp(newPos.z, -u_boundaries.z, u_boundaries.z);
          }
          
          gl_FragColor = vec4(newPos, position.w);
        }
      `,
      textureSize: { width: 256, height: 256 },
      outputFormat: 'rgba'
    })

    // Agent Flocking Behavior Kernel  
    this.addKernel({
      id: 'agent_flocking',
      name: 'Agent Flocking Behavior',
      vertexShader: `
        attribute vec2 position;
        varying vec2 vUv;
        
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform sampler2D u_positions;
        uniform sampler2D u_velocities;
        uniform float u_separationRadius;
        uniform float u_alignmentRadius;
        uniform float u_cohesionRadius;
        uniform float u_separationWeight;
        uniform float u_alignmentWeight;
        uniform float u_cohesionWeight;
        uniform vec2 u_textureSize;
        
        varying vec2 vUv;
        
        vec3 calculateSeparation(vec3 currentPos) {
          vec3 separation = vec3(0.0);
          float count = 0.0;
          
          for (float x = 0.0; x < 256.0; x++) {
            for (float y = 0.0; y < 256.0; y++) {
              vec2 sampleUv = vec2(x, y) / u_textureSize;
              vec3 otherPos = texture2D(u_positions, sampleUv).xyz;
              
              vec3 diff = currentPos - otherPos;
              float distance = length(diff);
              
              if (distance > 0.0 && distance < u_separationRadius) {
                separation += normalize(diff) / distance;
                count++;
              }
            }
          }
          
          return count > 0.0 ? separation / count : vec3(0.0);
        }
        
        vec3 calculateAlignment(vec3 currentPos) {
          vec3 alignment = vec3(0.0);
          float count = 0.0;
          
          for (float x = 0.0; x < 256.0; x++) {
            for (float y = 0.0; y < 256.0; y++) {
              vec2 sampleUv = vec2(x, y) / u_textureSize;
              vec3 otherPos = texture2D(u_positions, sampleUv).xyz;
              vec3 otherVel = texture2D(u_velocities, sampleUv).xyz;
              
              float distance = length(currentPos - otherPos);
              
              if (distance > 0.0 && distance < u_alignmentRadius) {
                alignment += otherVel;
                count++;
              }
            }
          }
          
          return count > 0.0 ? normalize(alignment / count) : vec3(0.0);
        }
        
        vec3 calculateCohesion(vec3 currentPos) {
          vec3 center = vec3(0.0);
          float count = 0.0;
          
          for (float x = 0.0; x < 256.0; x++) {
            for (float y = 0.0; y < 256.0; y++) {
              vec2 sampleUv = vec2(x, y) / u_textureSize;
              vec3 otherPos = texture2D(u_positions, sampleUv).xyz;
              
              float distance = length(currentPos - otherPos);
              
              if (distance > 0.0 && distance < u_cohesionRadius) {
                center += otherPos;
                count++;
              }
            }
          }
          
          if (count > 0.0) {
            center /= count;
            return normalize(center - currentPos);
          }
          
          return vec3(0.0);
        }
        
        void main() {
          vec4 currentPosition = texture2D(u_positions, vUv);
          vec4 currentVelocity = texture2D(u_velocities, vUv);
          
          vec3 separation = calculateSeparation(currentPosition.xyz);
          vec3 alignment = calculateAlignment(currentPosition.xyz);
          vec3 cohesion = calculateCohesion(currentPosition.xyz);
          
          vec3 newVelocity = currentVelocity.xyz + 
                            separation * u_separationWeight +
                            alignment * u_alignmentWeight +
                            cohesion * u_cohesionWeight;
          
          // Limit velocity magnitude
          float maxSpeed = 5.0;
          if (length(newVelocity) > maxSpeed) {
            newVelocity = normalize(newVelocity) * maxSpeed;
          }
          
          gl_FragColor = vec4(newVelocity, currentVelocity.w);
        }
      `,
      textureSize: { width: 256, height: 256 },
      outputFormat: 'rgba'
    })

    // Distance Field Generation Kernel
    this.addKernel({
      id: 'distance_field',
      name: 'Distance Field Generation',
      vertexShader: `
        attribute vec2 position;
        varying vec2 vUv;
        
        void main() {
          vUv = position * 0.5 + 0.5;
          gl_Position = vec4(position, 0.0, 1.0);
        }
      `,
      fragmentShader: `
        precision highp float;
        
        uniform sampler2D u_obstacles;
        uniform vec2 u_resolution;
        uniform float u_maxDistance;
        
        varying vec2 vUv;
        
        float distanceToObstacle(vec2 pos) {
          float minDist = u_maxDistance;
          
          for (float x = 0.0; x < 512.0; x++) {
            for (float y = 0.0; y < 512.0; y++) {
              vec2 samplePos = vec2(x, y) / u_resolution;
              float obstacle = texture2D(u_obstacles, samplePos).r;
              
              if (obstacle > 0.5) {
                float dist = distance(pos * u_resolution, vec2(x, y));
                minDist = min(minDist, dist);
              }
            }
          }
          
          return minDist;
        }
        
        void main() {
          float dist = distanceToObstacle(vUv);
          float normalizedDist = dist / u_maxDistance;
          
          gl_FragColor = vec4(normalizedDist, normalizedDist, normalizedDist, 1.0);
        }
      `,
      textureSize: { width: 512, height: 512 },
      outputFormat: 'rgba'
    })
  }

  public addKernel(kernel: ComputeKernel): void {
    if (!this.isSupported) {
      logger.warn('GPU compute not supported, kernel ignored', { kernelId: kernel.id })
      return
    }

    this.kernels.set(kernel.id, kernel)
    logger.info('Compute kernel added', { id: kernel.id, name: kernel.name })
  }

  public submitJob(job: ComputeJob): Promise<DataTexture> {
    return new Promise((resolve, reject) => {
      if (!this.isSupported) {
        reject(new Error('GPU compute not supported'))
        return
      }

      const kernel = this.kernels.get(job.kernelId)
      if (!kernel) {
        reject(new Error(`Kernel not found: ${job.kernelId}`))
        return
      }

      // Add callback to job
      const enhancedJob = {
        ...job,
        callback: (result: DataTexture) => {
          if (job.callback) job.callback(result)
          resolve(result)
        }
      }

      // Insert job into queue based on priority
      this.insertJobByPriority(enhancedJob)
      
      // Start processing if not already running
      if (!this.isProcessing) {
        this.processJobQueue()
      }
    })
  }

  private insertJobByPriority(job: ComputeJob): void {
    let insertIndex = 0
    
    while (insertIndex < this.jobQueue.length && 
           this.jobQueue[insertIndex].priority >= job.priority) {
      insertIndex++
    }
    
    this.jobQueue.splice(insertIndex, 0, job)
  }

  private async processJobQueue(): Promise<void> {
    if (this.isProcessing || this.jobQueue.length === 0) {
      return
    }

    this.isProcessing = true
    logger.info('Started processing GPU compute queue', { queueLength: this.jobQueue.length })

    while (this.jobQueue.length > 0) {
      const job = this.jobQueue.shift()!
      
      try {
        const result = await this.executeJob(job)
        if (job.callback) {
          job.callback(result)
        }
        
        this.emit('jobCompleted', { jobId: job.id, kernelId: job.kernelId })
      } catch (error) {
        logger.error('GPU compute job failed', { 
          jobId: job.id, 
          kernelId: job.kernelId, 
          error 
        })
        
        this.emit('jobFailed', { 
          jobId: job.id, 
          kernelId: job.kernelId, 
          error: error.message 
        })
      }
    }

    this.isProcessing = false
    logger.info('GPU compute queue processing completed')
  }

  private async executeJob(job: ComputeJob): Promise<DataTexture> {
    const kernel = this.kernels.get(job.kernelId)!
    
    // Create shader material
    const material = new ShaderMaterial({
      vertexShader: kernel.vertexShader,
      fragmentShader: kernel.fragmentShader,
      uniforms: {
        ...kernel.uniforms,
        ...this.createTextureUniforms(job.inputTextures)
      }
    })

    // Create geometry
    const geometry = new PlaneGeometry(2, 2)
    const mesh = new Mesh(geometry, material)
    this.scene.add(mesh)

    // Create or use output texture
    const outputTexture = job.outputTexture || this.createOutputTexture(
      kernel.textureSize.width,
      kernel.textureSize.height,
      kernel.outputFormat
    )

    // Set render target
    const renderTarget = this.renderer.getRenderTarget()
    
    try {
      // Render to texture
      this.renderer.setRenderTarget(renderTarget)
      this.renderer.render(this.scene, this.camera)
      
      // Read back result (if needed for CPU processing)
      const pixels = new Float32Array(
        kernel.textureSize.width * kernel.textureSize.height * 4
      )
      
      this.renderer.readRenderTargetPixels(
        renderTarget,
        0, 0,
        kernel.textureSize.width,
        kernel.textureSize.height,
        pixels
      )

      // Update output texture
      outputTexture.image.data = pixels
      outputTexture.needsUpdate = true

    } finally {
      // Cleanup
      this.scene.remove(mesh)
      geometry.dispose()
      material.dispose()
      this.renderer.setRenderTarget(null)
    }

    return outputTexture
  }

  private createTextureUniforms(textures: Record<string, DataTexture>): Record<string, any> {
    const uniforms: Record<string, any> = {}
    
    for (const [name, texture] of Object.entries(textures)) {
      uniforms[name] = { value: texture }
    }
    
    return uniforms
  }

  private createOutputTexture(width: number, height: number, format: string): DataTexture {
    const size = width * height
    const channels = format === 'rgba' ? 4 : format === 'rg' ? 2 : 1
    const data = new Float32Array(size * channels)
    
    const texture = new DataTexture(data, width, height, RGBAFormat, FloatType)
    texture.needsUpdate = true
    
    return texture
  }

  public createPositionTexture(positions: Float32Array, width: number, height: number): DataTexture {
    const texture = new DataTexture(positions, width, height, RGBAFormat, FloatType)
    texture.needsUpdate = true
    return texture
  }

  public createVelocityTexture(velocities: Float32Array, width: number, height: number): DataTexture {
    const texture = new DataTexture(velocities, width, height, RGBAFormat, FloatType)
    texture.needsUpdate = true
    return texture
  }

  public async updateAgentPositions(
    positions: DataTexture,
    velocities: DataTexture,
    deltaTime: number,
    boundaries: { x: number; y: number; z: number }
  ): Promise<DataTexture> {
    if (!this.isSupported) {
      throw new Error('GPU compute not supported')
    }

    return this.submitJob({
      id: `position_update_${Date.now()}`,
      kernelId: 'agent_position_update',
      inputTextures: {
        u_positions: positions,
        u_velocities: velocities
      },
      priority: 1,
    })
  }

  public async calculateFlockingBehavior(
    positions: DataTexture,
    velocities: DataTexture,
    flockingParams: {
      separationRadius: number
      alignmentRadius: number
      cohesionRadius: number
      separationWeight: number
      alignmentWeight: number
      cohesionWeight: number
    }
  ): Promise<DataTexture> {
    if (!this.isSupported) {
      throw new Error('GPU compute not supported')
    }

    return this.submitJob({
      id: `flocking_${Date.now()}`,
      kernelId: 'agent_flocking',
      inputTextures: {
        u_positions: positions,
        u_velocities: velocities
      },
      priority: 2
    })
  }

  public getQueueLength(): number {
    return this.jobQueue.length
  }

  public clearQueue(): void {
    this.jobQueue.splice(0)
    logger.info('GPU compute queue cleared')
  }

  public isComputeSupported(): boolean {
    return this.isSupported
  }

  public getCapabilities(): ComputeCapabilities {
    const gl = this.renderer.getContext()
    
    return {
      isSupported: this.isSupported,
      maxTextureSize: this.maxTextureSize,
      hasFloatTextures: !!(gl.getExtension('OES_texture_float')),
      hasHalfFloatTextures: !!(gl.getExtension('OES_texture_half_float')),
      maxVertexTextures: gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS),
      maxFragmentTextures: gl.getParameter(gl.MAX_TEXTURE_IMAGE_UNITS),
      availableKernels: Array.from(this.kernels.keys())
    }
  }

  public dispose(): void {
    this.clearQueue()
    this.kernels.clear()
    this.scene.clear()
    this.removeAllListeners()
    logger.info('GPUComputeAccelerator disposed')
  }
}

interface ComputeCapabilities {
  isSupported: boolean
  maxTextureSize: number
  hasFloatTextures: boolean
  hasHalfFloatTextures: boolean
  maxVertexTextures: number
  maxFragmentTextures: number
  availableKernels: string[]
}