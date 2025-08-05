import { EventEmitter } from 'eventemitter3'
import { Vector3 } from 'three'

export interface SuperpositionState {
  id: string
  amplitude: number
  phase: number
  probability: number
  energy: number
}

export interface QuantumSystem {
  id: string
  states: Map<string, SuperpositionState>
  entangled: string[]
  coherenceTime: number
  decoherenceRate: number
  lastMeasurement: number
}

export interface QuantumMeasurement {
  systemId: string
  collapsedState: string
  probability: number
  timestamp: number
  measurementType: 'observation' | 'interaction' | 'decoherence'
}

export interface EntanglementPair {
  system1: string
  system2: string
  correlation: number
  strength: number
  type: 'spatial' | 'temporal' | 'functional'
}

export class QuantumSuperpositionManager extends EventEmitter {
  private systems: Map<string, QuantumSystem> = new Map()
  private entanglements: Map<string, EntanglementPair> = new Map()
  private measurements: QuantumMeasurement[] = []
  private globalCoherence: number = 1.0
  private timeStep: number = 0

  constructor() {
    super()
    this.startQuantumEvolution()
  }

  // Create new quantum system in superposition
  public createQuantumSystem(
    id: string, 
    initialStates: Array<{state: string, amplitude: number, phase?: number}>
  ): void {
    const states = new Map<string, SuperpositionState>()
    
    // Normalize amplitudes to ensure probability conservation
    const totalAmplitude = Math.sqrt(
      initialStates.reduce((sum, s) => sum + s.amplitude * s.amplitude, 0)
    )
    
    initialStates.forEach((state, index) => {
      const normalizedAmplitude = state.amplitude / totalAmplitude
      
      states.set(state.state, {
        id: `${id}_${state.state}`,
        amplitude: normalizedAmplitude,
        phase: state.phase || (index * Math.PI / initialStates.length),
        probability: normalizedAmplitude * normalizedAmplitude,
        energy: this.calculateStateEnergy(state.state, normalizedAmplitude)
      })
    })

    const quantumSystem: QuantumSystem = {
      id,
      states,
      entangled: [],
      coherenceTime: 10.0, // seconds
      decoherenceRate: 0.01,
      lastMeasurement: Date.now()
    }

    this.systems.set(id, quantumSystem)
    
    this.emit('systemCreated', {
      systemId: id,
      states: Array.from(states.values()),
      coherence: this.calculateSystemCoherence(quantumSystem)
    })
  }

  // Apply quantum gate operations to modify superposition
  public applyQuantumGate(
    systemId: string, 
    gateType: 'hadamard' | 'pauli-x' | 'pauli-y' | 'pauli-z' | 'phase' | 'rotation',
    parameters?: { angle?: number, axis?: Vector3 }
  ): void {
    const system = this.systems.get(systemId)
    if (!system) return

    const states = Array.from(system.states.values())
    
    switch (gateType) {
      case 'hadamard':
        this.applyHadamardGate(system)
        break
      case 'pauli-x':
        this.applyPauliXGate(system)
        break
      case 'pauli-y':
        this.applyPauliYGate(system)
        break
      case 'pauli-z':
        this.applyPauliZGate(system)
        break
      case 'phase':
        this.applyPhaseGate(system, parameters?.angle || Math.PI/4)
        break
      case 'rotation':
        this.applyRotationGate(system, parameters?.angle || Math.PI/4, parameters?.axis || new Vector3(0, 0, 1))
        break
    }

    this.normalizeSystem(system)
    
    this.emit('gateApplied', {
      systemId,
      gateType,
      parameters,
      newStates: Array.from(system.states.values())
    })
  }

  // Create quantum entanglement between systems
  public entangleSystems(
    system1Id: string, 
    system2Id: string, 
    type: 'spatial' | 'temporal' | 'functional' = 'functional',
    strength: number = 1.0
  ): void {
    const system1 = this.systems.get(system1Id)
    const system2 = this.systems.get(system2Id)
    
    if (!system1 || !system2) return

    const entanglementId = `${system1Id}_${system2Id}`
    
    // Calculate correlation based on current states
    const correlation = this.calculateStateCorrelation(system1, system2)
    
    const entanglement: EntanglementPair = {
      system1: system1Id,
      system2: system2Id,
      correlation,
      strength,
      type
    }

    this.entanglements.set(entanglementId, entanglement)
    
    // Update system entanglement lists
    system1.entangled.push(system2Id)
    system2.entangled.push(system1Id)

    // Modify states based on entanglement
    this.applyEntanglementEffects(system1, system2, entanglement)
    
    this.emit('entanglementCreated', {
      entanglementId,
      system1: system1Id,
      system2: system2Id,
      correlation,
      strength,
      type
    })
  }

  // Measure quantum system (causes wavefunction collapse)
  public measureSystem(
    systemId: string, 
    measurementType: 'observation' | 'interaction' | 'decoherence' = 'observation'
  ): QuantumMeasurement {
    const system = this.systems.get(systemId)
    if (!system) throw new Error(`System ${systemId} not found`)

    // Calculate cumulative probabilities
    const states = Array.from(system.states.values())
    const probabilities = states.map(s => s.probability)
    const cumulativeProbs = probabilities.reduce((acc, p, i) => {
      acc.push((acc[i - 1] || 0) + p)
      return acc
    }, [] as number[])

    // Quantum measurement
    const random = Math.random()
    let collapsedStateIndex = 0
    
    for (let i = 0; i < cumulativeProbs.length; i++) {
      if (random <= cumulativeProbs[i]) {
        collapsedStateIndex = i
        break
      }
    }

    const collapsedState = states[collapsedStateIndex]
    
    // Collapse wavefunction
    system.states.clear()
    system.states.set(collapsedState.id, {
      ...collapsedState,
      amplitude: 1.0,
      probability: 1.0,
      phase: 0
    })

    // Update entangled systems
    this.propagateCollapse(system, collapsedState.id, measurementType)

    const measurement: QuantumMeasurement = {
      systemId,
      collapsedState: collapsedState.id,
      probability: collapsedState.probability,
      timestamp: Date.now(),
      measurementType
    }

    this.measurements.push(measurement)
    system.lastMeasurement = measurement.timestamp

    this.emit('measurement', measurement)
    
    return measurement
  }

  // Apply quantum interference between states
  public applyInterference(
    systemId: string, 
    interferenceType: 'constructive' | 'destructive' | 'mixed' = 'mixed'
  ): void {
    const system = this.systems.get(systemId)
    if (!system) return

    const states = Array.from(system.states.values())
    
    if (states.length < 2) return // Need at least 2 states for interference

    // Calculate phase differences and apply interference
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const state1 = states[i]
        const state2 = states[j]
        
        const phaseDiff = Math.abs(state1.phase - state2.phase)
        let interferenceEffect = 0

        switch (interferenceType) {
          case 'constructive':
            interferenceEffect = Math.cos(phaseDiff) * 0.1
            break
          case 'destructive':
            interferenceEffect = -Math.cos(phaseDiff) * 0.1
            break
          case 'mixed':
            interferenceEffect = Math.cos(phaseDiff) * 0.05 * (Math.random() - 0.5)
            break
        }

        // Apply interference to amplitudes
        state1.amplitude += interferenceEffect * state2.amplitude
        state2.amplitude += interferenceEffect * state1.amplitude
      }
    }

    this.normalizeSystem(system)
    
    this.emit('interferenceApplied', {
      systemId,
      interferenceType,
      states: Array.from(system.states.values())
    })
  }

  // Get current superposition state of system
  public getSystemState(systemId: string): QuantumSystem | null {
    return this.systems.get(systemId) || null
  }

  // Get all entanglements for a system
  public getSystemEntanglements(systemId: string): EntanglementPair[] {
    return Array.from(this.entanglements.values())
      .filter(e => e.system1 === systemId || e.system2 === systemId)
  }

  // Calculate system coherence
  public calculateSystemCoherence(system: QuantumSystem): number {
    const states = Array.from(system.states.values())
    
    if (states.length <= 1) return 0 // No coherence with single state
    
    // Calculate coherence based on phase relationships
    let coherenceSum = 0
    let pairCount = 0
    
    for (let i = 0; i < states.length; i++) {
      for (let j = i + 1; j < states.length; j++) {
        const phaseDiff = Math.abs(states[i].phase - states[j].phase)
        const coherence = Math.cos(phaseDiff) * states[i].amplitude * states[j].amplitude
        coherenceSum += coherence
        pairCount++
      }
    }
    
    return pairCount > 0 ? coherenceSum / pairCount : 0
  }

  // Get measurement history
  public getMeasurementHistory(systemId?: string): QuantumMeasurement[] {
    if (systemId) {
      return this.measurements.filter(m => m.systemId === systemId)
    }
    return [...this.measurements]
  }

  // Private methods for quantum operations

  private applyHadamardGate(system: QuantumSystem): void {
    // Simplified Hadamard: creates equal superposition
    const states = Array.from(system.states.values())
    const newAmplitude = 1.0 / Math.sqrt(states.length)
    
    states.forEach(state => {
      state.amplitude = newAmplitude
      state.phase = Math.random() * 2 * Math.PI
    })
  }

  private applyPauliXGate(system: QuantumSystem): void {
    // Bit flip: swap amplitudes between complementary states
    const states = Array.from(system.states.values())
    if (states.length >= 2) {
      const temp = states[0].amplitude
      states[0].amplitude = states[1].amplitude
      states[1].amplitude = temp
    }
  }

  private applyPauliYGate(system: QuantumSystem): void {
    // Y gate: bit flip + phase flip
    this.applyPauliXGate(system)
    this.applyPauliZGate(system)
  }

  private applyPauliZGate(system: QuantumSystem): void {
    // Phase flip: flip phase of second state
    const states = Array.from(system.states.values())
    if (states.length >= 2) {
      states[1].phase += Math.PI
    }
  }

  private applyPhaseGate(system: QuantumSystem, angle: number): void {
    // Apply phase shift to all states
    system.states.forEach(state => {
      state.phase += angle
    })
  }

  private applyRotationGate(system: QuantumSystem, angle: number, axis: Vector3): void {
    // Simplified rotation around axis
    const cosHalf = Math.cos(angle / 2)
    const sinHalf = Math.sin(angle / 2)
    
    system.states.forEach(state => {
      const newAmplitude = state.amplitude * cosHalf
      const newPhase = state.phase + axis.length() * sinHalf
      
      state.amplitude = newAmplitude
      state.phase = newPhase
    })
  }

  private calculateStateEnergy(stateId: string, amplitude: number): number {
    // Simple energy model based on state and amplitude
    const baseEnergy = stateId.length * 0.1 // State complexity
    const amplitudeEnergy = amplitude * amplitude * 10 // Probability contribution
    return baseEnergy + amplitudeEnergy
  }

  private calculateStateCorrelation(system1: QuantumSystem, system2: QuantumSystem): number {
    const states1 = Array.from(system1.states.values())
    const states2 = Array.from(system2.states.values())
    
    let correlation = 0
    let pairs = 0
    
    states1.forEach(s1 => {
      states2.forEach(s2 => {
        const phaseDiff = Math.abs(s1.phase - s2.phase)
        const amplitudeProduct = s1.amplitude * s2.amplitude
        correlation += Math.cos(phaseDiff) * amplitudeProduct
        pairs++
      })
    })
    
    return pairs > 0 ? correlation / pairs : 0
  }

  private applyEntanglementEffects(
    system1: QuantumSystem, 
    system2: QuantumSystem, 
    entanglement: EntanglementPair
  ): void {
    // Modify states based on entanglement correlation
    const states1 = Array.from(system1.states.values())
    const states2 = Array.from(system2.states.values())
    
    states1.forEach(s1 => {
      states2.forEach(s2 => {
        const correlation = entanglement.correlation * entanglement.strength
        
        // Correlate phases
        const averagePhase = (s1.phase + s2.phase) / 2
        s1.phase += (averagePhase - s1.phase) * correlation * 0.1
        s2.phase += (averagePhase - s2.phase) * correlation * 0.1
        
        // Correlate amplitudes slightly
        const averageAmplitude = (s1.amplitude + s2.amplitude) / 2
        s1.amplitude += (averageAmplitude - s1.amplitude) * correlation * 0.05
        s2.amplitude += (averageAmplitude - s2.amplitude) * correlation * 0.05
      })
    })
  }

  private propagateCollapse(
    collapsedSystem: QuantumSystem, 
    collapsedStateId: string, 
    measurementType: string
  ): void {
    // Propagate collapse to entangled systems
    collapsedSystem.entangled.forEach(entangledId => {
      const entangledSystem = this.systems.get(entangledId)
      if (!entangledSystem) return

      const entanglementKey = `${collapsedSystem.id}_${entangledId}`
      const entanglement = this.entanglements.get(entanglementKey) || 
                          this.entanglements.get(`${entangledId}_${collapsedSystem.id}`)
      
      if (entanglement && entanglement.strength > 0.5) {
        // High entanglement -> immediate collapse
        this.measureSystem(entangledId, 'interaction')
      } else if (entanglement) {
        // Lower entanglement -> partial decoherence
        this.applyDecoherence(entangledSystem, 0.3)
      }
    })
  }

  private normalizeSystem(system: QuantumSystem): void {
    const states = Array.from(system.states.values())
    const totalAmplitudeSquared = states.reduce((sum, s) => sum + s.amplitude * s.amplitude, 0)
    const norm = Math.sqrt(totalAmplitudeSquared)
    
    if (norm > 0) {
      states.forEach(state => {
        state.amplitude /= norm
        state.probability = state.amplitude * state.amplitude
      })
    }
  }

  private applyDecoherence(system: QuantumSystem, rate: number): void {
    system.states.forEach(state => {
      // Add random phase noise
      state.phase += (Math.random() - 0.5) * rate * Math.PI
      
      // Reduce amplitude coherence
      state.amplitude *= (1 - rate * 0.1)
    })
    
    this.normalizeSystem(system)
  }

  private startQuantumEvolution(): void {
    // Run quantum evolution simulation
    setInterval(() => {
      this.timeStep++
      this.evolveQuantumSystems()
      this.updateGlobalCoherence()
    }, 100) // 10 Hz evolution
  }

  private evolveQuantumSystems(): void {
    this.systems.forEach(system => {
      // Apply natural decoherence
      const timeSinceLastMeasurement = Date.now() - system.lastMeasurement
      const decoherenceAmount = (timeSinceLastMeasurement / 1000) * system.decoherenceRate
      
      if (decoherenceAmount > 0.01) {
        this.applyDecoherence(system, Math.min(decoherenceAmount, 0.1))
      }
      
      // Apply quantum interference
      if (Math.random() < 0.1) {
        this.applyInterference(system.id, 'mixed')
      }
    })
  }

  private updateGlobalCoherence(): void {
    const systems = Array.from(this.systems.values())
    if (systems.length === 0) {
      this.globalCoherence = 1.0
      return
    }
    
    const totalCoherence = systems.reduce((sum, system) => {
      return sum + this.calculateSystemCoherence(system)
    }, 0)
    
    this.globalCoherence = totalCoherence / systems.length
    
    this.emit('coherenceUpdate', {
      globalCoherence: this.globalCoherence,
      systemCount: systems.length,
      timeStep: this.timeStep
    })
  }

  // Get global quantum state visualization data
  public getGlobalQuantumState(): any {
    return {
      systems: Array.from(this.systems.entries()).map(([id, system]) => ({
        id,
        states: Array.from(system.states.values()),
        entangled: system.entangled,
        coherence: this.calculateSystemCoherence(system),
        coherenceTime: system.coherenceTime,
        decoherenceRate: system.decoherenceRate
      })),
      entanglements: Array.from(this.entanglements.values()),
      globalCoherence: this.globalCoherence,
      measurements: this.measurements.slice(-100), // Last 100 measurements
      timeStep: this.timeStep
    }
  }
}