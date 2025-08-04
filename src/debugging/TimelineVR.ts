import { EventEmitter } from 'eventemitter3'
import { 
  Group, 
  Mesh, 
  BoxGeometry, 
  MeshBasicMaterial, 
  PlaneGeometry,
  Vector3,
  Color,
  Raycaster,
  Camera
} from 'three'
import type { CausalEvent } from '../types'

interface TimelineVRConfig {
  length: number
  height: number
  position: Vector3
  timeRange?: { start: number; end: number }
}

interface TimelineEvent {
  timestamp: number
  event: CausalEvent
  position: Vector3
  mesh: Mesh
}

export class TimelineVR extends EventEmitter {
  private config: TimelineVRConfig
  private group: Group
  private timelineBar: Mesh
  private events: TimelineEvent[] = []
  private currentTimeMarker: Mesh
  private timeRange: { start: number; end: number }
  private raycaster = new Raycaster()
  private isInteracting = false

  constructor(config: TimelineVRConfig) {
    super()
    this.config = config
    this.group = new Group()
    this.group.position.copy(config.position)
    
    this.timeRange = config.timeRange || {
      start: Date.now() - 60000, // 1 minute ago
      end: Date.now()
    }
    
    this.createTimelineBar()
    this.createTimeMarker()
  }

  private createTimelineBar(): void {
    const geometry = new BoxGeometry(this.config.length, 0.05, 0.2)
    const material = new MeshBasicMaterial({ color: 0x333333 })
    
    this.timelineBar = new Mesh(geometry, material)
    this.timelineBar.userData = { type: 'timeline-bar' }
    this.group.add(this.timelineBar)
    
    // Add time scale markers
    this.createTimeScaleMarkers()
  }

  private createTimeScaleMarkers(): void {
    const markerCount = 10
    const markerGeometry = new BoxGeometry(0.02, 0.1, 0.02)
    const markerMaterial = new MeshBasicMaterial({ color: 0x666666 })
    
    for (let i = 0; i <= markerCount; i++) {
      const marker = new Mesh(markerGeometry, markerMaterial)
      const x = (i / markerCount - 0.5) * this.config.length
      marker.position.set(x, -0.1, 0)
      this.group.add(marker)
    }
  }

  private createTimeMarker(): void {
    const geometry = new BoxGeometry(0.05, this.config.height, 0.05)
    const material = new MeshBasicMaterial({ color: 0xff0000 })
    
    this.currentTimeMarker = new Mesh(geometry, material)
    this.currentTimeMarker.position.y = this.config.height / 2
    this.currentTimeMarker.userData = { type: 'time-marker' }
    this.group.add(this.currentTimeMarker)
    
    this.updateTimeMarkerPosition(this.timeRange.end)
  }

  addEvents(events: CausalEvent[]): void {
    // Clear existing events
    this.clearEvents()
    
    events.forEach(event => this.addEvent(event))
  }

  addEvent(event: CausalEvent): void {
    const position = this.timestampToPosition(event.timestamp)
    const eventMesh = this.createEventMesh(event)
    
    eventMesh.position.copy(position)
    this.group.add(eventMesh)
    
    const timelineEvent: TimelineEvent = {
      timestamp: event.timestamp,
      event,
      position,
      mesh: eventMesh
    }
    
    this.events.push(timelineEvent)
    
    // Sort events by timestamp
    this.events.sort((a, b) => a.timestamp - b.timestamp)
  }

  private createEventMesh(event: CausalEvent): Mesh {
    const size = this.getEventSize(event)
    const color = this.getEventColor(event)
    
    const geometry = new BoxGeometry(size, size, size)
    const material = new MeshBasicMaterial({ color })
    
    const mesh = new Mesh(geometry, material)
    mesh.userData = { 
      type: 'timeline-event', 
      event,
      originalColor: color
    }
    
    return mesh
  }

  private getEventSize(event: CausalEvent): number {
    const baseSizes = {
      message: 0.05,
      stateChange: 0.08,
      decision: 0.1
    }
    return baseSizes[event.type] || 0.06
  }

  private getEventColor(event: CausalEvent): number {
    const typeColors = {
      message: 0x00ff00,
      stateChange: 0xff0000,
      decision: 0x0000ff
    }
    return typeColors[event.type] || 0x666666
  }

  private timestampToPosition(timestamp: number): Vector3 {
    const timeSpan = this.timeRange.end - this.timeRange.start
    const normalizedTime = (timestamp - this.timeRange.start) / timeSpan
    const x = (normalizedTime - 0.5) * this.config.length
    
    return new Vector3(x, 0.2, 0)
  }

  private positionToTimestamp(x: number): number {
    const normalizedX = (x / this.config.length) + 0.5
    return this.timeRange.start + (normalizedX * (this.timeRange.end - this.timeRange.start))
  }

  focusOn(timestamp: number): void {
    this.updateTimeMarkerPosition(timestamp)
    this.emit('focus', timestamp)
  }

  private updateTimeMarkerPosition(timestamp: number): void {
    const position = this.timestampToPosition(timestamp)
    this.currentTimeMarker.position.x = position.x
  }

  onScrub(callback: (timestamp: number) => void): void {
    this.on('scrub', callback)
  }

  handleControllerInteraction(controllerPosition: Vector3, camera: Camera): void {
    // Convert controller position to timeline local space
    const localPosition = this.group.worldToLocal(controllerPosition.clone())
    
    // Check if interacting with timeline bar
    if (Math.abs(localPosition.z) < 0.3 && 
        Math.abs(localPosition.y) < 0.3 &&
        Math.abs(localPosition.x) < this.config.length / 2) {
      
      const timestamp = this.positionToTimestamp(localPosition.x)
      this.updateTimeMarkerPosition(timestamp)
      this.emit('scrub', timestamp)
      this.isInteracting = true
    }
  }

  handleControllerEnd(): void {
    this.isInteracting = false
  }

  setTimeRange(start: number, end: number): void {
    this.timeRange = { start, end }
    
    // Reposition all events
    this.events.forEach(timelineEvent => {
      const newPosition = this.timestampToPosition(timelineEvent.timestamp)
      timelineEvent.mesh.position.copy(newPosition)
      timelineEvent.position = newPosition
    })
    
    // Update current time marker
    this.updateTimeMarkerPosition(this.getCurrentTime())
  }

  rewind(seconds: number): void {
    const currentTime = this.getCurrentTime()
    const newTime = Math.max(currentTime - (seconds * 1000), this.timeRange.start)
    this.focusOn(newTime)
    this.emit('rewind', newTime)
  }

  fastForward(seconds: number): void {
    const currentTime = this.getCurrentTime()
    const newTime = Math.min(currentTime + (seconds * 1000), this.timeRange.end)
    this.focusOn(newTime)
    this.emit('fastForward', newTime)
  }

  getCurrentTime(): number {
    const markerX = this.currentTimeMarker.position.x
    return this.positionToTimestamp(markerX)
  }

  highlightEventsByAgent(agentId: string): void {
    this.events.forEach(timelineEvent => {
      const material = timelineEvent.mesh.material as MeshBasicMaterial
      
      if (timelineEvent.event.agentId === agentId) {
        material.color = new Color(0xffff00) // Yellow highlight
        material.emissive = new Color(0x222200)
      } else {
        material.color = new Color(timelineEvent.mesh.userData.originalColor)
        material.emissive = new Color(0x000000)
      }
    })
  }

  highlightEventsByType(eventType: string): void {
    this.events.forEach(timelineEvent => {
      const material = timelineEvent.mesh.material as MeshBasicMaterial
      
      if (timelineEvent.event.type === eventType) {
        material.color = new Color(0xffff00) // Yellow highlight
        material.emissive = new Color(0x222200)
      } else {
        material.color = new Color(timelineEvent.mesh.userData.originalColor)
        material.emissive = new Color(0x000000)
      }
    })
  }

  clearHighlights(): void {
    this.events.forEach(timelineEvent => {
      const material = timelineEvent.mesh.material as MeshBasicMaterial
      material.color = new Color(timelineEvent.mesh.userData.originalColor)
      material.emissive = new Color(0x000000)
    })
  }

  private clearEvents(): void {
    this.events.forEach(timelineEvent => {
      this.group.remove(timelineEvent.mesh)
    })
    this.events = []
  }

  getGroup(): Group {
    return this.group
  }

  getEventsInTimeRange(start: number, end: number): CausalEvent[] {
    return this.events
      .filter(timelineEvent => 
        timelineEvent.timestamp >= start && timelineEvent.timestamp <= end
      )
      .map(timelineEvent => timelineEvent.event)
  }

  dispose(): void {
    this.clearEvents()
    this.removeAllListeners()
  }
}