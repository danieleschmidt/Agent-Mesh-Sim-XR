import { vi } from 'vitest'
import 'jsdom'

// Create comprehensive WebGL context mock
const createWebGLContext = () => ({
  // Canvas 2D methods
  fillRect: vi.fn(),
  clearRect: vi.fn(),
  getImageData: vi.fn(() => ({ data: new Array(4) })),
  putImageData: vi.fn(),
  createImageData: vi.fn(() => []),
  setTransform: vi.fn(),
  drawImage: vi.fn(),
  save: vi.fn(),
  fillText: vi.fn(),
  restore: vi.fn(),
  beginPath: vi.fn(),
  moveTo: vi.fn(),
  lineTo: vi.fn(),
  closePath: vi.fn(),
  stroke: vi.fn(),
  translate: vi.fn(),
  scale: vi.fn(),
  rotate: vi.fn(),
  arc: vi.fn(),
  fill: vi.fn(),
  measureText: vi.fn(() => ({ width: 0 })),
  transform: vi.fn(),
  rect: vi.fn(),
  clip: vi.fn(),
  
  // WebGL core constants
  DEPTH_TEST: 2929,
  CULL_FACE: 2884,
  BLEND: 3042,
  ONE: 1,
  SRC_ALPHA: 770,
  ONE_MINUS_SRC_ALPHA: 771,
  TEXTURE_2D: 3553,
  UNSIGNED_BYTE: 5121,
  RGBA: 6408,
  NEAREST: 9728,
  LINEAR: 9729,
  CLAMP_TO_EDGE: 33071,
  REPEAT: 10497,
  VERTEX_SHADER: 35633,
  FRAGMENT_SHADER: 35632,
  COMPILE_STATUS: 35713,
  LINK_STATUS: 35714,
  ARRAY_BUFFER: 34962,
  STATIC_DRAW: 35044,
  TRIANGLES: 4,
  FLOAT: 5126,
  COLOR_BUFFER_BIT: 16384,
  DEPTH_BUFFER_BIT: 256,
  FRAMEBUFFER_COMPLETE: 36053,
  
  // WebGL methods
  createBuffer: vi.fn(() => ({})),
  createProgram: vi.fn(() => ({})),
  createShader: vi.fn(() => ({})),
  createTexture: vi.fn(() => ({})),
  createFramebuffer: vi.fn(() => ({})),
  createRenderbuffer: vi.fn(() => ({})),
  
  shaderSource: vi.fn(),
  compileShader: vi.fn(),
  attachShader: vi.fn(),
  linkProgram: vi.fn(),
  useProgram: vi.fn(),
  
  getAttribLocation: vi.fn(() => 0),
  getUniformLocation: vi.fn(() => ({})),
  enableVertexAttribArray: vi.fn(),
  vertexAttribPointer: vi.fn(),
  
  bindBuffer: vi.fn(),
  bufferData: vi.fn(),
  bindTexture: vi.fn(),
  bindFramebuffer: vi.fn(),
  bindRenderbuffer: vi.fn(),
  
  clear: vi.fn(),
  clearColor: vi.fn(),
  clearDepth: vi.fn(),
  clearStencil: vi.fn(),
  drawArrays: vi.fn(),
  drawElements: vi.fn(),
  
  enable: vi.fn(),
  disable: vi.fn(),
  depthFunc: vi.fn(),
  depthMask: vi.fn(),
  colorMask: vi.fn(),
  blendFunc: vi.fn(),
  cullFace: vi.fn(),
  frontFace: vi.fn(),
  
  viewport: vi.fn(),
  scissor: vi.fn(),
  
  texParameteri: vi.fn(),
  texImage2D: vi.fn(),
  generateMipmap: vi.fn(),
  activeTexture: vi.fn(),
  
  uniform1i: vi.fn(),
  uniform1f: vi.fn(),
  uniform2f: vi.fn(),
  uniform3f: vi.fn(),
  uniform4f: vi.fn(),
  uniform1fv: vi.fn(),
  uniform2fv: vi.fn(),
  uniform3fv: vi.fn(),
  uniform4fv: vi.fn(),
  uniformMatrix3fv: vi.fn(),
  uniformMatrix4fv: vi.fn(),
  
  framebufferTexture2D: vi.fn(),
  framebufferRenderbuffer: vi.fn(),
  renderbufferStorage: vi.fn(),
  
  checkFramebufferStatus: vi.fn(() => 36053), // FRAMEBUFFER_COMPLETE
  
  deleteBuffer: vi.fn(),
  deleteTexture: vi.fn(),
  deleteProgram: vi.fn(),
  deleteShader: vi.fn(),
  deleteFramebuffer: vi.fn(),
  deleteRenderbuffer: vi.fn(),
  
  isContextLost: vi.fn(() => false),
  
  getParameter: vi.fn((param) => {
    switch(param) {
      case 7936: return 'Mock WebGL Vendor' // VENDOR
      case 7937: return 'Mock WebGL Renderer' // RENDERER  
      case 7938: return 'WebGL 1.0 (Mock)' // VERSION - proper WebGL version format
      case 35724: return 'WebGL GLSL ES 1.0 (Mock)' // SHADING_LANGUAGE_VERSION
      case 34076: return 4096 // MAX_TEXTURE_SIZE
      case 34024: return 16 // MAX_VERTEX_ATTRIBS
      case 36347: return 16 // MAX_VERTEX_UNIFORM_VECTORS
      case 36348: return 16 // MAX_FRAGMENT_UNIFORM_VECTORS
      case 34930: return 4 // MAX_VERTEX_TEXTURE_IMAGE_UNITS
      case 34018: return 16 // MAX_TEXTURE_IMAGE_UNITS
      case 36349: return 4 // MAX_VARYING_VECTORS
      case 2978: return new Int32Array([0, 0, 1024, 768]) // VIEWPORT
      case 35379: return 'WebGL' // UNMASKED_VENDOR_WEBGL
      case 35380: return 'Mock WebGL Implementation' // UNMASKED_RENDERER_WEBGL
      case 3379: return 32768 // MAX_TEXTURE_SIZE
      case 35661: return 32 // MAX_VERTEX_UNIFORM_VECTORS
      case 35660: return 16 // MAX_FRAGMENT_UNIFORM_VECTORS
      default: return 0
    }
  }),
  
  getShaderParameter: vi.fn(() => true),
  getProgramParameter: vi.fn(() => true),
  getShaderInfoLog: vi.fn(() => ''),
  getProgramInfoLog: vi.fn(() => ''),
  
  getContextAttributes: vi.fn(() => ({
    alpha: true,
    depth: true,
    stencil: false,
    antialias: true,
    premultipliedAlpha: true,
    preserveDrawingBuffer: false,
    powerPreference: 'default',
    failIfMajorPerformanceCaveat: false
  })),
  
  getExtension: vi.fn((name) => {
    // Return basic extensions that Three.js might need
    if (name === 'WEBGL_depth_texture' || 
        name === 'OES_texture_float' ||
        name === 'OES_texture_half_float' ||
        name === 'OES_standard_derivatives') {
      return {}
    }
    return null
  }),
  
  getSupportedExtensions: vi.fn(() => [
    'WEBGL_depth_texture',
    'OES_texture_float', 
    'OES_texture_half_float',
    'OES_standard_derivatives',
    'EXT_texture_filter_anisotropic',
    'WEBGL_compressed_texture_s3tc'
  ]),

  // Additional WebGL state properties
  VERSION: 7938,
  VENDOR: 7936,
  RENDERER: 7937,
  SHADING_LANGUAGE_VERSION: 35724,
  
  canvas: {
    width: 1024,
    height: 768,
    clientWidth: 1024,
    clientHeight: 768,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  },
  
  drawingBufferWidth: 1024,
  drawingBufferHeight: 768
})

// Mock Canvas for Three.js WebGL rendering in tests
global.HTMLCanvasElement.prototype.getContext = vi.fn((type) => {
  if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
    return createWebGLContext()
  }
  if (type === '2d') {
    return createWebGLContext() // Include 2D methods in WebGL context for compatibility
  }
  return null
}) as any

// Mock WebXR
global.navigator.xr = {
  isSessionSupported: vi.fn(() => Promise.resolve(true)),
  requestSession: vi.fn(() => Promise.resolve({
    end: vi.fn(),
    requestReferenceSpace: vi.fn(() => Promise.resolve({})),
    requestAnimationFrame: vi.fn(),
    cancelAnimationFrame: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }))
} as any

// Mock WebGL2RenderingContext
global.WebGL2RenderingContext = global.WebGLRenderingContext = function() {} as any

// Mock performance for high-resolution time
if (typeof performance === 'undefined') {
  global.performance = {
    now: () => Date.now(),
    mark: vi.fn(),
    measure: vi.fn(),
    getEntriesByName: vi.fn(() => []),
    getEntriesByType: vi.fn(() => []),
    clearMarks: vi.fn(),
    clearMeasures: vi.fn(),
  } as any
}

// Mock WebSocket for testing
global.WebSocket = vi.fn(() => ({
  send: vi.fn(),
  close: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  readyState: 1, // OPEN
})) as any

// Mock requestAnimationFrame
global.requestAnimationFrame = vi.fn((callback) => {
  return setTimeout(callback, 16) // ~60fps
})

global.cancelAnimationFrame = vi.fn((id) => {
  clearTimeout(id)
})

// Mock URL.createObjectURL for Web Workers
global.URL = {
  createObjectURL: vi.fn(() => 'blob:mock-url'),
  revokeObjectURL: vi.fn(),
  ...global.URL
} as any

// Mock Worker for GPU acceleration
global.Worker = vi.fn(() => ({
  postMessage: vi.fn(),
  terminate: vi.fn(),
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  onmessage: null,
  onerror: null
})) as any

// Mock SharedArrayBuffer if not available
if (typeof SharedArrayBuffer === 'undefined') {
  global.SharedArrayBuffer = ArrayBuffer as any
}

// Mock OffscreenCanvas for WebGL compute
if (typeof OffscreenCanvas === 'undefined') {
  global.OffscreenCanvas = class {
    width: number = 1
    height: number = 1
    getContext = vi.fn(() => createWebGLContext())
    transferToImageBitmap = vi.fn()
    convertToBlob = vi.fn(() => Promise.resolve(new Blob()))
  } as any
}

// Increase test timeout for performance-heavy tests
vi.setConfig({ testTimeout: 30000 })