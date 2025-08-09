import { describe, it, expect, beforeEach, vi } from 'vitest'
import { Vector3, Scene } from 'three'
import type { Agent, AgentMeshXRConfig } from '../../types'

// Mock the XRManager to avoid Three.js WebGL issues in tests
vi.mock('../../core/XRManager', () => ({
  XRManager: vi.fn().mockImplementation(() => ({
    startSession: vi.fn().mockResolvedValue(undefined),
    endSession: vi.fn().mockResolvedValue(undefined),
    render: vi.fn(),
    getScene: vi.fn().mockReturnValue(new Scene()),
    resetSession: vi.fn().mockResolvedValue(undefined),
    dispose: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    emit: vi.fn()
  }))
}))

// Mock other dependencies that might use WebGL
vi.mock('../../visualization/SwarmVisualizer', () => ({
  SwarmVisualizer: vi.fn().mockImplementation(() => ({
    addAgent: vi.fn(),
    updateAgent: vi.fn(),
    removeAgent: vi.fn(),
    update: vi.fn(),
    dispose: vi.fn()
  }))
}))

// Import after mocking
import { AgentMeshXR } from '../../core/AgentMeshXR'

// Mock WebXR APIs
Object.defineProperty(global.navigator, 'xr', {
  value: {
    isSessionSupported: vi.fn().mockResolvedValue(false)
  },
  writable: true
})

// Mock WebSocket
global.WebSocket = vi.fn().mockImplementation(() => ({
  addEventListener: vi.fn(),
  removeEventListener: vi.fn(),
  send: vi.fn(),
  close: vi.fn()
})) as any

describe('AgentMeshXR', () => {
  let config: AgentMeshXRConfig
  let xrSim: AgentMeshXR

  beforeEach(() => {
    config = {
      maxAgents: 1000,
      physicsEngine: 'cannon',
      renderMode: 'instanced',
      vrSupport: true,
      arSupport: false
    }
    
    xrSim = new AgentMeshXR(config)
  })

  it('should initialize with correct configuration', () => {
    expect(xrSim).toBeDefined()
    expect(xrSim.getAllAgents()).toHaveLength(0)
    expect(xrSim.getActiveAgentCount()).toBe(0)
  })

  it('should add agents correctly', () => {
    const agent: Agent = {
      id: 'test-agent-1',
      type: 'worker',
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      currentState: {
        status: 'active',
        behavior: 'exploring',
        role: 'worker',
        energy: 100,
        priority: 1
      },
      metadata: {},
      activeGoals: [],
      connectedPeers: [],
      metrics: {
        cpuMs: 0,
        memoryMB: 10,
        msgPerSec: 0,
        uptime: 0
      },
      lastUpdate: Date.now()
    }

    xrSim.addAgent(agent)
    
    expect(xrSim.getAllAgents()).toHaveLength(1)
    expect(xrSim.getAgent('test-agent-1')).toEqual(agent)
    expect(xrSim.getActiveAgentCount()).toBe(1)
  })

  it('should update agents correctly', () => {
    const agent: Agent = {
      id: 'test-agent-1',
      type: 'worker',
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(1, 0, 1),
      currentState: {
        status: 'active',
        behavior: 'exploring',
        role: 'worker',
        energy: 100,
        priority: 1
      },
      metadata: {},
      activeGoals: [],
      connectedPeers: [],
      metrics: {
        cpuMs: 0,
        memoryMB: 10,
        msgPerSec: 0,
        uptime: 0
      },
      lastUpdate: Date.now()
    }

    xrSim.addAgent(agent)
    
    const updateData = {
      id: 'test-agent-1',
      position: new Vector3(5, 0, 5),
      currentState: {
        status: 'idle' as const,
        behavior: 'waiting',
        role: 'worker',
        energy: 80,
        priority: 2
      }
    }

    xrSim.updateAgent(updateData)
    
    const updatedAgent = xrSim.getAgent('test-agent-1')!
    expect(updatedAgent.position).toEqual(new Vector3(5, 0, 5))
    expect(updatedAgent.currentState.status).toBe('idle')
    expect(updatedAgent.currentState.energy).toBe(80)
    expect(xrSim.getActiveAgentCount()).toBe(0) // Agent is now idle
  })

  it('should remove agents correctly', () => {
    const agent: Agent = {
      id: 'test-agent-1',
      type: 'worker',
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      currentState: {
        status: 'active',
        behavior: 'exploring',
        role: 'worker',
        energy: 100,
        priority: 1
      },
      metadata: {},
      activeGoals: [],
      connectedPeers: [],
      metrics: {
        cpuMs: 0,
        memoryMB: 10,
        msgPerSec: 0,
        uptime: 0
      },
      lastUpdate: Date.now()
    }

    xrSim.addAgent(agent)
    expect(xrSim.getAllAgents()).toHaveLength(1)
    
    xrSim.removeAgent('test-agent-1')
    expect(xrSim.getAllAgents()).toHaveLength(0)
    expect(xrSim.getAgent('test-agent-1')).toBeUndefined()
  })

  it('should enable time control', () => {
    const timeConfig = {
      maxRewind: 3600,
      recordInterval: 0.1,
      causalTracking: true
    }

    expect(() => {
      xrSim.enableTimeControl(timeConfig)
    }).not.toThrow()
  })

  it('should emit events correctly', () => {
    const agentAddedSpy = vi.fn()
    const agentUpdatedSpy = vi.fn()
    const agentRemovedSpy = vi.fn()

    xrSim.on('agentAdded', agentAddedSpy)
    xrSim.on('agentUpdated', agentUpdatedSpy)
    xrSim.on('agentRemoved', agentRemovedSpy)

    const agent: Agent = {
      id: 'test-agent-1',
      type: 'worker',
      position: new Vector3(0, 0, 0),
      velocity: new Vector3(0, 0, 0),
      currentState: {
        status: 'active',
        behavior: 'exploring',
        role: 'worker',
        energy: 100,
        priority: 1
      },
      metadata: {},
      activeGoals: [],
      connectedPeers: [],
      metrics: {
        cpuMs: 0,
        memoryMB: 10,
        msgPerSec: 0,
        uptime: 0
      },
      lastUpdate: Date.now()
    }

    xrSim.addAgent(agent)
    expect(agentAddedSpy).toHaveBeenCalledWith(agent)

    xrSim.updateAgent({ id: 'test-agent-1', position: new Vector3(1, 0, 1) })
    expect(agentUpdatedSpy).toHaveBeenCalled()

    xrSim.removeAgent('test-agent-1')
    expect(agentRemovedSpy).toHaveBeenCalled()
  })

  it('should handle disposal correctly', () => {
    expect(() => {
      xrSim.dispose()
    }).not.toThrow()
  })
})