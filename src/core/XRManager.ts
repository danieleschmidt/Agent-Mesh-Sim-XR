import { EventEmitter } from 'eventemitter3'
import { 
  WebGLRenderer, 
  Scene, 
  PerspectiveCamera, 
  Vector3, 
  Color,
  AmbientLight,
  DirectionalLight,
  GridHelper
} from 'three'
import type { XRSessionConfig } from '../types'

interface XRManagerConfig {
  vrSupported: boolean
  arSupported: boolean
}

export class XRManager extends EventEmitter {
  private renderer: WebGLRenderer
  private scene: Scene
  private camera: PerspectiveCamera
  private xrSession: XRSession | null = null
  private config: XRManagerConfig
  private isXRSupported = false

  constructor(config: XRManagerConfig) {
    super()
    this.config = config
    
    this.scene = new Scene()
    
    // Handle test environment where window may not be available
    const width = (typeof window !== 'undefined' ? window.innerWidth : 1024) || 1024
    const height = (typeof window !== 'undefined' ? window.innerHeight : 768) || 768
    
    this.camera = new PerspectiveCamera(75, width / height, 0.1, 1000)
    this.renderer = new WebGLRenderer({ 
      antialias: true,
      canvas: typeof document !== 'undefined' ? undefined : this.createOffscreenCanvas()
    })
    
    this.setupRenderer()
    this.setupScene()
    this.checkXRSupport()
  }

  private createOffscreenCanvas(): HTMLCanvasElement {
    // Create mock canvas for testing environment
    const canvas = {
      width: 1024,
      height: 768,
      clientWidth: 1024,
      clientHeight: 768,
      addEventListener: () => {},
      removeEventListener: () => {},
      getContext: () => null
    } as unknown as HTMLCanvasElement
    
    return canvas
  }

  private setupRenderer(): void {
    const width = (typeof window !== 'undefined' ? window.innerWidth : 1024) || 1024
    const height = (typeof window !== 'undefined' ? window.innerHeight : 768) || 768
    
    this.renderer.setSize(width, height)
    this.renderer.shadowMap.enabled = true
    this.renderer.xr.enabled = true
    
    // Only append to DOM if in browser environment
    if (typeof document !== 'undefined' && document.body) {
      document.body.appendChild(this.renderer.domElement)
    }
    
    // Only add resize listener in browser environment
    if (typeof window !== 'undefined') {
      window.addEventListener('resize', () => {
        this.camera.aspect = window.innerWidth / window.innerHeight
        this.camera.updateProjectionMatrix()
        this.renderer.setSize(window.innerWidth, window.innerHeight)
      })
    }
  }

  private setupScene(): void {
    this.scene.background = new Color(0x0a0a0a)
    
    // Lighting
    const ambientLight = new AmbientLight(0x404040, 0.6)
    this.scene.add(ambientLight)
    
    const directionalLight = new DirectionalLight(0xffffff, 0.8)
    directionalLight.position.set(10, 10, 5)
    directionalLight.castShadow = true
    this.scene.add(directionalLight)
    
    // Grid for spatial reference
    const gridHelper = new GridHelper(20, 20, 0x444444, 0x222222)
    this.scene.add(gridHelper)
    
    // Initial camera position
    this.camera.position.set(0, 5, 10)
    this.camera.lookAt(0, 0, 0)
  }

  private async checkXRSupport(): Promise<void> {
    if (typeof navigator !== 'undefined' && 'xr' in navigator) {
      try {
        const vrSupported = this.config.vrSupported && 
          await (navigator as any).xr.isSessionSupported('immersive-vr')
        const arSupported = this.config.arSupported &&
          await (navigator as any).xr.isSessionSupported('immersive-ar')
        
        this.isXRSupported = vrSupported || arSupported
        this.emit('xrSupportDetected', { vrSupported, arSupported })
      } catch (error) {
        console.warn('XR support detection failed:', error)
        this.isXRSupported = false
      }
    }
  }

  async startSession(config: XRSessionConfig): Promise<void> {
    if (!this.isXRSupported) {
      throw new Error('XR not supported on this device')
    }

    try {
      const sessionInit: XRSessionInit = {
        requiredFeatures: [config.referenceSpace]
      }

      if (config.controllers) {
        sessionInit.optionalFeatures = ['hand-tracking']
      }

      this.xrSession = await (navigator as any).xr.requestSession(config.mode, sessionInit)
      
      await this.renderer.xr.setSession(this.xrSession)
      
      this.xrSession.addEventListener('end', () => {
        this.xrSession = null
        this.emit('sessionEnd')
      })

      this.emit('sessionStart', config)
    } catch (error) {
      throw new Error(`Failed to start XR session: ${error}`)
    }
  }

  async endSession(): Promise<void> {
    if (this.xrSession) {
      await this.xrSession.end()
      this.xrSession = null
    }
  }

  getScene(): Scene {
    return this.scene
  }

  getCamera(): PerspectiveCamera {
    return this.camera
  }

  getRenderer(): WebGLRenderer {
    return this.renderer
  }

  isInXR(): boolean {
    return this.xrSession !== null
  }

  render(): void {
    this.renderer.render(this.scene, this.camera)
  }

  async resetSession(): Promise<void> {
    if (this.xrSession) {
      await this.xrSession.end()
      this.xrSession = null
    }
  }

  dispose(): void {
    if (this.xrSession) {
      this.xrSession.end()
    }
    
    this.renderer.dispose()
    if (document.body.contains(this.renderer.domElement)) {
      document.body.removeChild(this.renderer.domElement)
    }
    this.removeAllListeners()
  }
}