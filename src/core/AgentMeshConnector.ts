import { EventEmitter } from 'eventemitter3'
import WebSocket from 'ws'
import type { Agent, NetworkConfig } from '../types'

export class AgentMeshConnector extends EventEmitter {
  private ws: WebSocket | null = null
  private config: NetworkConfig
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null
  private heartbeatTimer: ReturnType<typeof setInterval> | null = null
  private reconnectAttempts = 0
  private isConnected = false

  constructor(config?: NetworkConfig) {
    super()
    this.config = {
      endpoint: '',
      reconnectAttempts: 5,
      heartbeatInterval: 30000,
      ...config
    }
  }

  async connect(endpoint: string): Promise<void> {
    this.config.endpoint = endpoint
    
    return new Promise((resolve, reject) => {
      try {
        this.ws = new WebSocket(endpoint)
        
        this.ws.onopen = () => {
          this.isConnected = true
          this.reconnectAttempts = 0
          this.startHeartbeat()
          this.emit('connected')
          resolve()
        }

        this.ws.onmessage = (event) => {
          const data = typeof event.data === 'string' ? event.data : event.data.toString()
          this.handleMessage(data)
        }

        this.ws.onclose = () => {
          this.isConnected = false
          this.stopHeartbeat()
          this.emit('disconnected')
          this.attemptReconnect()
        }

        this.ws.onerror = (error) => {
          this.emit('error', error)
          if (!this.isConnected) {
            reject(error)
          }
        }

      } catch (error) {
        reject(error)
      }
    })
  }

  disconnect(): void {
    this.isConnected = false
    this.stopHeartbeat()
    this.stopReconnect()
    
    if (this.ws) {
      this.ws.close()
      this.ws = null
    }
  }

  sendMessage(type: string, data: any): void {
    if (!this.isConnected || !this.ws) {
      this.emit('error', new Error('Cannot send message: not connected'))
      return
    }

    const message = {
      type,
      data,
      timestamp: Date.now()
    }

    this.ws.send(JSON.stringify(message))
  }

  private handleMessage(data: string): void {
    try {
      const message = JSON.parse(data)
      
      switch (message.type) {
        case 'agentUpdate':
          this.handleAgentUpdate(message.data)
          break
        case 'agentRemoved':
          this.emit('agentRemoved', message.data.agentId)
          break
        case 'systemStatus':
          this.emit('systemStatus', message.data)
          break
        case 'heartbeat':
          // Acknowledge heartbeat
          break
        default:
          this.emit('message', message)
      }
    } catch (error) {
      this.emit('error', new Error(`Failed to parse message: ${error}`))
    }
  }

  private handleAgentUpdate(data: { agents: Agent[] }): void {
    const agents = data.agents.map(agentData => this.normalizeAgent(agentData))
    this.emit('agentUpdate', agents)
  }

  private normalizeAgent(agentData: any): Agent {
    return {
      id: agentData.id || `agent-${Date.now()}`,
      type: agentData.type || 'unknown',
      position: agentData.position || { x: 0, y: 0, z: 0 },
      velocity: agentData.velocity || { x: 0, y: 0, z: 0 },
      currentState: {
        status: agentData.status || 'active',
        behavior: agentData.behavior || 'default',
        role: agentData.role || 'worker',
        energy: agentData.energy || 100,
        priority: agentData.priority || 1
      },
      metadata: agentData.metadata || {},
      activeGoals: agentData.activeGoals || [],
      connectedPeers: agentData.connectedPeers || [],
      metrics: {
        cpuMs: agentData.metrics?.cpuMs || 0,
        memoryMB: agentData.metrics?.memoryMB || 0,
        msgPerSec: agentData.metrics?.msgPerSec || 0,
        uptime: agentData.metrics?.uptime || 0
      },
      lastUpdate: Date.now()
    }
  }

  private startHeartbeat(): void {
    this.heartbeatTimer = setInterval(() => {
      this.sendMessage('heartbeat', { timestamp: Date.now() })
    }, this.config.heartbeatInterval)
  }

  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer)
      this.heartbeatTimer = null
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.config.reconnectAttempts) {
      this.emit('error', new Error('Max reconnection attempts reached'))
      return
    }

    this.reconnectAttempts++
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000)
    
    this.reconnectTimer = setTimeout(() => {
      this.connect(this.config.endpoint).catch(() => {
        // Will trigger another reconnect attempt
      })
    }, delay)
  }

  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer)
      this.reconnectTimer = null
    }
  }

  async reconnect(): Promise<void> {
    if (this.ws) {
      this.ws.close()
    }
    await this.connect(this.config.endpoint)
  }

  getConnectionStatus(): boolean {
    return this.isConnected
  }
}