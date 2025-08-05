import { EventEmitter } from 'eventemitter3'
import { Vector3 } from 'three'
import { Task } from './QuantumInspiredPlanner'

export interface InterferencePattern {
  id: string
  type: 'constructive' | 'destructive' | 'mixed'
  strength: number
  frequency: number
  phase: number
  spatialRange: number
  temporalRange: number
}

export interface TaskWave {
  taskId: string
  amplitude: number
  frequency: number
  phase: number
  position: Vector3
  velocity: Vector3
  wavelength: number
  damping: number
}

export interface InterferenceResult {
  taskId: string
  originalPriority: number
  modifiedPriority: number
  interferenceContribution: number
  dominantPatterns: string[]
  phaseShift: number
}

export interface WaveInteraction {
  wave1Id: string
  wave2Id: string
  interactionType: 'constructive' | 'destructive' | 'resonance' | 'beating'
  amplitude: number
  resultantFrequency: number
  coherenceLength: number
}

export class QuantumInterferenceEngine extends EventEmitter {
  private taskWaves: Map<string, TaskWave> = new Map()
  private interferencePatterns: Map<string, InterferencePattern> = new Map()
  private waveInteractions: Map<string, WaveInteraction> = new Map()
  private spatialGrid: Map<string, TaskWave[]> = new Map()
  private timeStep: number = 0
  private gridResolution: number = 1.0

  constructor(gridResolution: number = 1.0) {
    super()
    this.gridResolution = gridResolution
    this.initializeInterferencePatterns()
    this.startWaveEvolution()
  }

  // Convert tasks to quantum waves
  public createTaskWaves(tasks: Task[]): void {
    tasks.forEach(task => {
      const wave = this.convertTaskToWave(task)
      this.taskWaves.set(task.id, wave)
      this.addToSpatialGrid(wave)
    })

    this.emit('wavesCreated', {
      waveCount: this.taskWaves.size,
      spatialCells: this.spatialGrid.size
    })
  }

  // Calculate interference effects on task priorities
  public calculateInterference(tasks: Task[]): InterferenceResult[] {
    const results: InterferenceResult[] = []

    tasks.forEach(task => {
      const wave = this.taskWaves.get(task.id)
      if (!wave) {
        results.push({
          taskId: task.id,
          originalPriority: task.priority,
          modifiedPriority: task.priority,
          interferenceContribution: 0,
          dominantPatterns: [],
          phaseShift: 0
        })
        return
      }

      // Find nearby waves for interference calculation
      const nearbyWaves = this.findNearbyWaves(wave, 10.0)
      
      // Calculate superposition of all nearby waves
      const superposition = this.calculateSuperposition(wave, nearbyWaves)
      
      // Apply interference patterns
      const patternEffects = this.applyInterferencePatterns(wave, superposition)
      
      // Calculate modified priority
      const interferenceContribution = superposition.amplitude - wave.amplitude
      const priorityModification = this.calculatePriorityModification(
        task, 
        interferenceContribution, 
        patternEffects
      )
      
      const modifiedPriority = Math.max(0, Math.min(10, task.priority + priorityModification))

      results.push({
        taskId: task.id,
        originalPriority: task.priority,
        modifiedPriority,
        interferenceContribution,
        dominantPatterns: patternEffects.dominantPatterns,
        phaseShift: patternEffects.phaseShift
      })
    })

    this.emit('interferenceCalculated', results)
    return results
  }

  // Create dynamic interference patterns
  public createInterferencePattern(
    type: 'constructive' | 'destructive' | 'mixed',
    center: Vector3,
    strength: number = 1.0,
    frequency: number = 1.0,
    spatialRange: number = 5.0,
    temporalRange: number = 10.0
  ): string {
    const patternId = `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    
    const pattern: InterferencePattern = {
      id: patternId,
      type,
      strength,
      frequency,
      phase: Math.random() * 2 * Math.PI,
      spatialRange,
      temporalRange
    }

    this.interferencePatterns.set(patternId, pattern)

    this.emit('patternCreated', {
      patternId,
      type,
      center,
      strength,
      spatialRange
    })

    return patternId
  }

  // Simulate wave propagation and interference
  public propagateWaves(deltaTime: number): void {
    this.timeStep += deltaTime

    // Update wave positions and phases
    this.taskWaves.forEach(wave => {
      // Update position based on velocity
      wave.position.add(wave.velocity.clone().multiplyScalar(deltaTime))
      
      // Update phase based on frequency
      wave.phase += wave.frequency * deltaTime * 2 * Math.PI
      wave.phase %= 2 * Math.PI
      
      // Apply damping
      wave.amplitude *= (1 - wave.damping * deltaTime)
      
      // Update spatial grid
      this.updateSpatialGrid(wave)
    })

    // Calculate wave interactions
    this.updateWaveInteractions()

    this.emit('wavesPropagated', {
      timeStep: this.timeStep,
      activeWaves: this.taskWaves.size,
      interactions: this.waveInteractions.size
    })
  }

  // Apply quantum resonance between related tasks
  public applyQuantumResonance(taskId1: string, taskId2: string, resonanceStrength: number = 1.0): void {
    const wave1 = this.taskWaves.get(taskId1)
    const wave2 = this.taskWaves.get(taskId2)
    
    if (!wave1 || !wave2) return

    // Calculate resonance condition
    const frequencyRatio = wave1.frequency / wave2.frequency
    const isResonant = Math.abs(frequencyRatio - Math.round(frequencyRatio)) < 0.1

    if (isResonant) {
      // Apply resonance effects
      const resonanceAmplification = 1 + resonanceStrength * 0.5
      wave1.amplitude *= resonanceAmplification
      wave2.amplitude *= resonanceAmplification

      // Synchronize phases partially
      const phaseDiff = wave1.phase - wave2.phase
      const phaseCorrection = Math.sin(phaseDiff) * resonanceStrength * 0.1
      
      wave1.phase -= phaseCorrection
      wave2.phase += phaseCorrection

      // Create interaction record
      const interactionId = `${taskId1}_${taskId2}_resonance`
      this.waveInteractions.set(interactionId, {
        wave1Id: taskId1,
        wave2Id: taskId2,
        interactionType: 'resonance',
        amplitude: Math.min(wave1.amplitude, wave2.amplitude) * resonanceStrength,
        resultantFrequency: (wave1.frequency + wave2.frequency) / 2,
        coherenceLength: this.calculateCoherenceLength(wave1, wave2)
      })

      this.emit('resonanceApplied', {
        taskId1,
        taskId2,
        resonanceStrength,
        frequencyRatio,
        amplification: resonanceAmplification
      })
    }
  }

  // Create standing wave patterns for stable task priorities
  public createStandingWave(
    taskId1: string, 
    taskId2: string, 
    nodePositions: Vector3[]
  ): string {
    const wave1 = this.taskWaves.get(taskId1)
    const wave2 = this.taskWaves.get(taskId2)
    
    if (!wave1 || !wave2) return ''

    const standingWaveId = `standing_${taskId1}_${taskId2}`
    
    // Create interference pattern based on standing wave nodes
    nodePositions.forEach((nodePos, index) => {
      const patternId = this.createInterferencePattern(
        'constructive',
        nodePos,
        wave1.amplitude + wave2.amplitude,
        (wave1.frequency + wave2.frequency) / 2,
        2.0, // Narrow spatial range for node
        Infinity // Persistent
      )
    })

    this.emit('standingWaveCreated', {
      standingWaveId,
      taskId1,
      taskId2,
      nodeCount: nodePositions.length
    })

    return standingWaveId
  }

  // Apply quantum beating between tasks with similar frequencies
  public calculateQuantumBeating(taskId1: string, taskId2: string): number {
    const wave1 = this.taskWaves.get(taskId1)
    const wave2 = this.taskWaves.get(taskId2)
    
    if (!wave1 || !wave2) return 0

    const frequencyDiff = Math.abs(wave1.frequency - wave2.frequency)
    
    if (frequencyDiff < 0.5) { // Close frequencies create beating
      const beatFrequency = frequencyDiff
      const beatAmplitude = 2 * Math.sqrt(wave1.amplitude * wave2.amplitude)
      const beatPhase = Math.cos(beatFrequency * this.timeStep * 2 * Math.PI)
      
      return beatAmplitude * beatPhase
    }
    
    return 0
  }

  // Get interference visualization data
  public getInterferenceVisualization(): any {
    const waveData = Array.from(this.taskWaves.entries()).map(([taskId, wave]) => ({
      taskId,
      position: wave.position.toArray(),
      amplitude: wave.amplitude,
      frequency: wave.frequency,
      phase: wave.phase,
      wavelength: wave.wavelength
    }))

    const patternData = Array.from(this.interferencePatterns.entries()).map(([id, pattern]) => ({
      id,
      type: pattern.type,
      strength: pattern.strength,
      frequency: pattern.frequency,
      phase: pattern.phase,
      spatialRange: pattern.spatialRange
    }))

    const interactionData = Array.from(this.waveInteractions.entries()).map(([id, interaction]) => ({
      id,
      wave1Id: interaction.wave1Id,
      wave2Id: interaction.wave2Id,
      type: interaction.interactionType,
      amplitude: interaction.amplitude,
      frequency: interaction.resultantFrequency
    }))

    return {
      waves: waveData,
      patterns: patternData,
      interactions: interactionData,
      timeStep: this.timeStep,
      spatialGridSize: this.spatialGrid.size
    }
  }

  // Private methods

  private convertTaskToWave(task: Task): TaskWave {
    const baseFrequency = task.priority * 0.1 // Higher priority = higher frequency
    const amplitude = Math.sqrt(task.priority) * 0.5
    const wavelength = 2 * Math.PI / baseFrequency
    
    return {
      taskId: task.id,
      amplitude,
      frequency: baseFrequency,
      phase: Math.random() * 2 * Math.PI,
      position: task.position || new Vector3(Math.random() * 10, Math.random() * 10, Math.random() * 10),
      velocity: new Vector3(
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1,
        (Math.random() - 0.5) * 0.1
      ),
      wavelength,
      damping: 0.01 // Slow amplitude decay
    }
  }

  private findNearbyWaves(centerWave: TaskWave, radius: number): TaskWave[] {
    const nearby: TaskWave[] = []
    
    this.taskWaves.forEach(wave => {
      if (wave.taskId !== centerWave.taskId) {
        const distance = centerWave.position.distanceTo(wave.position)
        if (distance <= radius) {
          nearby.push(wave)
        }
      }
    })
    
    return nearby
  }

  private calculateSuperposition(centerWave: TaskWave, nearbyWaves: TaskWave[]): TaskWave {
    let totalAmplitude = centerWave.amplitude
    let weightedPhase = centerWave.phase * centerWave.amplitude
    let weightedFrequency = centerWave.frequency * centerWave.amplitude
    let totalWeight = centerWave.amplitude

    nearbyWaves.forEach(wave => {
      const distance = centerWave.position.distanceTo(wave.position)
      const distanceWeight = 1 / (1 + distance) // Closer waves have more influence
      
      // Calculate phase difference
      const phaseDiff = wave.phase - centerWave.phase
      
      // Interference contribution
      const interferenceAmplitude = wave.amplitude * distanceWeight * Math.cos(phaseDiff)
      totalAmplitude += interferenceAmplitude
      
      weightedPhase += wave.phase * wave.amplitude * distanceWeight
      weightedFrequency += wave.frequency * wave.amplitude * distanceWeight
      totalWeight += wave.amplitude * distanceWeight
    })

    return {
      taskId: centerWave.taskId,
      amplitude: totalAmplitude,
      frequency: weightedFrequency / totalWeight,
      phase: weightedPhase / totalWeight,
      position: centerWave.position.clone(),
      velocity: centerWave.velocity.clone(),
      wavelength: 2 * Math.PI / (weightedFrequency / totalWeight),
      damping: centerWave.damping
    }
  }

  private applyInterferencePatterns(
    wave: TaskWave, 
    superposition: TaskWave
  ): { dominantPatterns: string[], phaseShift: number } {
    const dominantPatterns: string[] = []
    let totalPhaseShift = 0

    this.interferencePatterns.forEach((pattern, patternId) => {
      // Check if pattern affects this wave (simplified spatial check)
      const patternInfluence = this.calculatePatternInfluence(wave, pattern)
      
      if (patternInfluence > 0.1) {
        dominantPatterns.push(patternId)
        
        // Apply pattern effects
        switch (pattern.type) {
          case 'constructive':
            superposition.amplitude *= (1 + pattern.strength * patternInfluence * 0.2)
            break
          case 'destructive':
            superposition.amplitude *= (1 - pattern.strength * patternInfluence * 0.2)
            break
          case 'mixed':
            const randomEffect = (Math.random() - 0.5) * pattern.strength * patternInfluence * 0.3
            superposition.amplitude *= (1 + randomEffect)
            break
        }
        
        totalPhaseShift += pattern.phase * patternInfluence * 0.1
      }
    })

    return {
      dominantPatterns,
      phaseShift: totalPhaseShift
    }
  }

  private calculatePatternInfluence(wave: TaskWave, pattern: InterferencePattern): number {
    // Simplified influence calculation based on frequency matching
    const frequencyMatch = 1 / (1 + Math.abs(wave.frequency - pattern.frequency))
    
    // Temporal decay
    const temporalFactor = pattern.temporalRange === Infinity ? 1 : 
      Math.exp(-this.timeStep / pattern.temporalRange)
    
    return frequencyMatch * temporalFactor * pattern.strength
  }

  private calculatePriorityModification(
    task: Task, 
    interferenceContribution: number, 
    patternEffects: { dominantPatterns: string[], phaseShift: number }
  ): number {
    let modification = interferenceContribution * 2.0 // Base interference effect
    
    // Add pattern-specific modifications
    modification += Math.sin(patternEffects.phaseShift) * 0.5
    
    // Clamp to reasonable range
    return Math.max(-3, Math.min(3, modification))
  }

  private addToSpatialGrid(wave: TaskWave): void {
    const gridKey = this.getGridKey(wave.position)
    
    if (!this.spatialGrid.has(gridKey)) {
      this.spatialGrid.set(gridKey, [])
    }
    
    this.spatialGrid.get(gridKey)!.push(wave)
  }

  private updateSpatialGrid(wave: TaskWave): void {
    // Remove from all grid cells (inefficient but simple)
    this.spatialGrid.forEach((waves, key) => {
      const index = waves.findIndex(w => w.taskId === wave.taskId)
      if (index !== -1) {
        waves.splice(index, 1)
        if (waves.length === 0) {
          this.spatialGrid.delete(key)
        }
      }
    })
    
    // Add to new grid cell
    this.addToSpatialGrid(wave)
  }

  private getGridKey(position: Vector3): string {
    const x = Math.floor(position.x / this.gridResolution)
    const y = Math.floor(position.y / this.gridResolution)
    const z = Math.floor(position.z / this.gridResolution)
    return `${x},${y},${z}`
  }

  private updateWaveInteractions(): void {
    // Clear old interactions
    this.waveInteractions.clear()

    // Calculate new interactions
    const waves = Array.from(this.taskWaves.values())
    
    for (let i = 0; i < waves.length; i++) {
      for (let j = i + 1; j < waves.length; j++) {
        const wave1 = waves[i]
        const wave2 = waves[j]
        
        const distance = wave1.position.distanceTo(wave2.position)
        
        if (distance < wave1.wavelength + wave2.wavelength) {
          const interaction = this.calculateWaveInteraction(wave1, wave2)
          const interactionId = `${wave1.taskId}_${wave2.taskId}`
          this.waveInteractions.set(interactionId, interaction)
        }
      }
    }
  }

  private calculateWaveInteraction(wave1: TaskWave, wave2: TaskWave): WaveInteraction {
    const phaseDiff = Math.abs(wave1.phase - wave2.phase)
    const frequencyDiff = Math.abs(wave1.frequency - wave2.frequency)
    
    let interactionType: 'constructive' | 'destructive' | 'resonance' | 'beating'
    let amplitude: number
    let resultantFrequency: number
    
    if (phaseDiff < Math.PI / 4) {
      interactionType = 'constructive'
      amplitude = wave1.amplitude + wave2.amplitude
    } else if (phaseDiff > 3 * Math.PI / 4) {
      interactionType = 'destructive'
      amplitude = Math.abs(wave1.amplitude - wave2.amplitude)
    } else if (frequencyDiff < 0.1) {
      interactionType = 'beating'
      amplitude = 2 * Math.sqrt(wave1.amplitude * wave2.amplitude)
    } else {
      interactionType = 'resonance'
      amplitude = Math.sqrt(wave1.amplitude * wave2.amplitude)
    }
    
    resultantFrequency = (wave1.frequency + wave2.frequency) / 2
    
    return {
      wave1Id: wave1.taskId,
      wave2Id: wave2.taskId,
      interactionType,
      amplitude,
      resultantFrequency,
      coherenceLength: this.calculateCoherenceLength(wave1, wave2)
    }
  }

  private calculateCoherenceLength(wave1: TaskWave, wave2: TaskWave): number {
    const frequencyDiff = Math.abs(wave1.frequency - wave2.frequency)
    return frequencyDiff > 0 ? 1 / frequencyDiff : Infinity
  }

  private initializeInterferencePatterns(): void {
    // Create some default interference patterns
    this.createInterferencePattern('constructive', new Vector3(0, 0, 0), 1.0, 1.0, 5.0, Infinity)
    this.createInterferencePattern('destructive', new Vector3(5, 5, 5), 0.8, 0.8, 3.0, 20.0)
    this.createInterferencePattern('mixed', new Vector3(-5, 0, 5), 1.2, 1.5, 4.0, 15.0)
  }

  private startWaveEvolution(): void {
    // Start wave propagation simulation
    setInterval(() => {
      this.propagateWaves(0.1) // 10 Hz evolution rate
    }, 100)
  }
}