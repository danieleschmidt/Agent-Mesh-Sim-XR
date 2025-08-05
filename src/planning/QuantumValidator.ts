import { Vector3 } from 'three'
import { Task, TaskConstraint, QuantumTaskState } from './QuantumInspiredPlanner'
import { SuperpositionState, QuantumSystem } from './QuantumSuperpositionManager'
import { InterferencePattern } from './QuantumInterferenceEngine'

export class QuantumValidationError extends Error {
  constructor(
    message: string,
    public readonly field: string,
    public readonly value: any,
    public readonly constraints: any
  ) {
    super(message)
    this.name = 'QuantumValidationError'
  }
}

export interface ValidationResult {
  isValid: boolean
  errors: QuantumValidationError[]
  warnings: string[]
  sanitizedValue?: any
}

export interface QuantumValidationRules {
  coherenceRange: { min: number; max: number }
  amplitudeRange: { min: number; max: number }
  phaseRange: { min: number; max: number }
  frequencyRange: { min: number; max: number }
  probabilityTolerance: number
  maxSuperpositionStates: number
  maxEntanglements: number
  maxInterferenceStrength: number
  taskPriorityRange: { min: number; max: number }
  agentLimits: { min: number; max: number }
  positionBounds: { min: Vector3; max: Vector3 }
}

export class QuantumValidator {
  private static instance: QuantumValidator
  private validationRules: QuantumValidationRules

  private constructor() {
    this.validationRules = {
      coherenceRange: { min: 0.0, max: 1.0 },
      amplitudeRange: { min: 0.0, max: 10.0 },
      phaseRange: { min: 0.0, max: 2 * Math.PI },
      frequencyRange: { min: 0.01, max: 100.0 },
      probabilityTolerance: 1e-6,
      maxSuperpositionStates: 20,
      maxEntanglements: 50,
      maxInterferenceStrength: 5.0,
      taskPriorityRange: { min: 0, max: 10 },
      agentLimits: { min: 1, max: 1000 },
      positionBounds: {
        min: new Vector3(-1000, -1000, -1000),
        max: new Vector3(1000, 1000, 1000)
      }
    }
  }

  public static getInstance(): QuantumValidator {
    if (!QuantumValidator.instance) {
      QuantumValidator.instance = new QuantumValidator()
    }
    return QuantumValidator.instance
  }

  // Validate quantum task
  public validateQuantumTask(task: Task): ValidationResult {
    const errors: QuantumValidationError[] = []
    const warnings: string[] = []

    try {
      // Validate basic task properties
      this.validateTaskId(task.id, errors)
      this.validateTaskDescription(task.description, errors, warnings)
      this.validateTaskPriority(task.priority, errors)
      this.validateTaskDuration(task.estimatedDuration, errors)
      this.validateRequiredAgents(task.requiredAgents, errors)
      this.validateTaskDependencies(task.dependencies, errors)
      this.validateTaskPosition(task.position, errors, warnings)
      this.validateTaskConstraints(task.constraints, errors)

      // Validate quantum state
      this.validateQuantumState(task.quantumState, errors, warnings)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: this.sanitizeTask(task)
      }

    } catch (error) {
      errors.push(new QuantumValidationError(
        'Unexpected validation error',
        'task',
        task,
        { error: error.message }
      ))

      return { isValid: false, errors, warnings }
    }
  }

  // Validate quantum state
  public validateQuantumState(state: QuantumTaskState): ValidationResult {
    const errors: QuantumValidationError[] = []
    const warnings: string[] = []

    try {
      // Validate coherence
      if (typeof state.coherence !== 'number' || 
          state.coherence < this.validationRules.coherenceRange.min ||
          state.coherence > this.validationRules.coherenceRange.max) {
        errors.push(new QuantumValidationError(
          `Coherence must be between ${this.validationRules.coherenceRange.min} and ${this.validationRules.coherenceRange.max}`,
          'coherence',
          state.coherence,
          this.validationRules.coherenceRange
        ))
      }

      // Validate interference
      if (typeof state.interference !== 'number' || 
          Math.abs(state.interference) > this.validationRules.maxInterferenceStrength) {
        errors.push(new QuantumValidationError(
          `Interference must be between -${this.validationRules.maxInterferenceStrength} and ${this.validationRules.maxInterferenceStrength}`,
          'interference',
          state.interference,
          { max: this.validationRules.maxInterferenceStrength }
        ))
      }

      // Validate superposition
      this.validateSuperposition(state.superposition, errors, warnings)

      // Validate entanglements
      this.validateEntanglements(state.entangled, errors, warnings)

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: this.sanitizeQuantumState(state)
      }

    } catch (error) {
      errors.push(new QuantumValidationError(
        'Unexpected quantum state validation error',
        'quantumState',
        state,
        { error: error.message }
      ))

      return { isValid: false, errors, warnings }
    }
  }

  // Validate superposition state
  public validateSuperpositionState(state: SuperpositionState): ValidationResult {
    const errors: QuantumValidationError[] = []
    const warnings: string[] = []

    try {
      // Validate ID
      if (!state.id || typeof state.id !== 'string') {
        errors.push(new QuantumValidationError(
          'Superposition state ID must be a non-empty string',
          'id',
          state.id,
          { required: true, type: 'string' }
        ))
      }

      // Validate amplitude
      if (typeof state.amplitude !== 'number' ||
          state.amplitude < this.validationRules.amplitudeRange.min ||
          state.amplitude > this.validationRules.amplitudeRange.max) {
        errors.push(new QuantumValidationError(
          `Amplitude must be between ${this.validationRules.amplitudeRange.min} and ${this.validationRules.amplitudeRange.max}`,
          'amplitude',
          state.amplitude,
          this.validationRules.amplitudeRange
        ))
      }

      // Validate phase
      if (typeof state.phase !== 'number' ||
          state.phase < this.validationRules.phaseRange.min ||
          state.phase > this.validationRules.phaseRange.max) {
        errors.push(new QuantumValidationError(
          `Phase must be between ${this.validationRules.phaseRange.min} and ${this.validationRules.phaseRange.max}`,
          'phase',
          state.phase,
          this.validationRules.phaseRange
        ))
      }

      // Validate probability consistency
      const calculatedProbability = state.amplitude * state.amplitude
      if (Math.abs(state.probability - calculatedProbability) > this.validationRules.probabilityTolerance) {
        warnings.push(`Probability inconsistency detected: calculated ${calculatedProbability}, stored ${state.probability}`)
      }

      // Validate energy
      if (typeof state.energy !== 'number' || state.energy < 0) {
        errors.push(new QuantumValidationError(
          'Energy must be a non-negative number',
          'energy',
          state.energy,
          { min: 0 }
        ))
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: this.sanitizeSuperpositionState(state)
      }

    } catch (error) {
      errors.push(new QuantumValidationError(
        'Unexpected superposition state validation error',
        'superpositionState',
        state,
        { error: error.message }
      ))

      return { isValid: false, errors, warnings }
    }
  }

  // Validate quantum system
  public validateQuantumSystem(system: QuantumSystem): ValidationResult {
    const errors: QuantumValidationError[] = []
    const warnings: string[] = []

    try {
      // Validate system ID
      if (!system.id || typeof system.id !== 'string') {
        errors.push(new QuantumValidationError(
          'Quantum system ID must be a non-empty string',
          'id',
          system.id,
          { required: true, type: 'string' }
        ))
      }

      // Validate states
      if (!system.states || system.states.size === 0) {
        errors.push(new QuantumValidationError(
          'Quantum system must have at least one state',
          'states',
          system.states,
          { minStates: 1 }
        ))
      } else if (system.states.size > this.validationRules.maxSuperpositionStates) {
        errors.push(new QuantumValidationError(
          `Quantum system cannot have more than ${this.validationRules.maxSuperpositionStates} states`,
          'states',
          system.states.size,
          { maxStates: this.validationRules.maxSuperpositionStates }
        ))
      }

      // Validate individual states
      system.states.forEach((state, stateId) => {
        const stateValidation = this.validateSuperpositionState(state)
        errors.push(...stateValidation.errors)
        warnings.push(...stateValidation.warnings)
      })

      // Validate probability normalization
      const totalProbability = Array.from(system.states.values())
        .reduce((sum, state) => sum + state.probability, 0)
      
      if (Math.abs(totalProbability - 1.0) > this.validationRules.probabilityTolerance) {
        errors.push(new QuantumValidationError(
          `Total probability must equal 1.0, got ${totalProbability}`,
          'states',
          totalProbability,
          { expected: 1.0, tolerance: this.validationRules.probabilityTolerance }
        ))
      }

      // Validate entanglements
      if (system.entangled.length > this.validationRules.maxEntanglements) {
        errors.push(new QuantumValidationError(
          `System cannot have more than ${this.validationRules.maxEntanglements} entanglements`,
          'entangled',
          system.entangled.length,
          { maxEntanglements: this.validationRules.maxEntanglements }
        ))
      }

      // Validate coherence time
      if (typeof system.coherenceTime !== 'number' || system.coherenceTime <= 0) {
        errors.push(new QuantumValidationError(
          'Coherence time must be a positive number',
          'coherenceTime',
          system.coherenceTime,
          { min: 0, exclusive: true }
        ))
      }

      // Validate decoherence rate
      if (typeof system.decoherenceRate !== 'number' || system.decoherenceRate < 0 || system.decoherenceRate > 1) {
        errors.push(new QuantumValidationError(
          'Decoherence rate must be between 0 and 1',
          'decoherenceRate',
          system.decoherenceRate,
          { min: 0, max: 1 }
        ))
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: this.sanitizeQuantumSystem(system)
      }

    } catch (error) {
      errors.push(new QuantumValidationError(
        'Unexpected quantum system validation error',
        'quantumSystem',
        system,
        { error: error.message }
      ))

      return { isValid: false, errors, warnings }
    }
  }

  // Validate interference pattern
  public validateInterferencePattern(pattern: InterferencePattern): ValidationResult {
    const errors: QuantumValidationError[] = []
    const warnings: string[] = []

    try {
      // Validate ID
      if (!pattern.id || typeof pattern.id !== 'string') {
        errors.push(new QuantumValidationError(
          'Interference pattern ID must be a non-empty string',
          'id',
          pattern.id,
          { required: true, type: 'string' }
        ))
      }

      // Validate type
      const validTypes = ['constructive', 'destructive', 'mixed']
      if (!validTypes.includes(pattern.type)) {
        errors.push(new QuantumValidationError(
          `Interference type must be one of: ${validTypes.join(', ')}`,
          'type',
          pattern.type,
          { validTypes }
        ))
      }

      // Validate strength
      if (typeof pattern.strength !== 'number' || 
          pattern.strength < 0 || 
          pattern.strength > this.validationRules.maxInterferenceStrength) {
        errors.push(new QuantumValidationError(
          `Interference strength must be between 0 and ${this.validationRules.maxInterferenceStrength}`,
          'strength',
          pattern.strength,
          { min: 0, max: this.validationRules.maxInterferenceStrength }
        ))
      }

      // Validate frequency
      if (typeof pattern.frequency !== 'number' ||
          pattern.frequency < this.validationRules.frequencyRange.min ||
          pattern.frequency > this.validationRules.frequencyRange.max) {
        errors.push(new QuantumValidationError(
          `Frequency must be between ${this.validationRules.frequencyRange.min} and ${this.validationRules.frequencyRange.max}`,
          'frequency',
          pattern.frequency,
          this.validationRules.frequencyRange
        ))
      }

      // Validate phase
      if (typeof pattern.phase !== 'number' ||
          pattern.phase < this.validationRules.phaseRange.min ||
          pattern.phase > this.validationRules.phaseRange.max) {
        errors.push(new QuantumValidationError(
          `Phase must be between ${this.validationRules.phaseRange.min} and ${this.validationRules.phaseRange.max}`,
          'phase',
          pattern.phase,
          this.validationRules.phaseRange
        ))
      }

      // Validate ranges
      if (typeof pattern.spatialRange !== 'number' || pattern.spatialRange <= 0) {
        errors.push(new QuantumValidationError(
          'Spatial range must be a positive number',
          'spatialRange',
          pattern.spatialRange,
          { min: 0, exclusive: true }
        ))
      }

      if (typeof pattern.temporalRange !== 'number' || pattern.temporalRange <= 0) {
        errors.push(new QuantumValidationError(
          'Temporal range must be a positive number',
          'temporalRange',
          pattern.temporalRange,
          { min: 0, exclusive: true }
        ))
      }

      return {
        isValid: errors.length === 0,
        errors,
        warnings,
        sanitizedValue: this.sanitizeInterferencePattern(pattern)
      }

    } catch (error) {
      errors.push(new QuantumValidationError(
        'Unexpected interference pattern validation error',
        'interferencePattern',
        pattern,
        { error: error.message }
      ))

      return { isValid: false, errors, warnings }
    }
  }

  // Sanitization methods
  private sanitizeTask(task: Task): Task {
    return {
      ...task,
      id: this.sanitizeString(task.id),
      description: this.sanitizeString(task.description),
      priority: this.clamp(task.priority, this.validationRules.taskPriorityRange.min, this.validationRules.taskPriorityRange.max),
      estimatedDuration: Math.max(0, task.estimatedDuration),
      requiredAgents: this.clamp(task.requiredAgents, this.validationRules.agentLimits.min, this.validationRules.agentLimits.max),
      dependencies: task.dependencies.map(dep => this.sanitizeString(dep)),
      position: this.sanitizePosition(task.position),
      constraints: task.constraints.map(constraint => this.sanitizeConstraint(constraint)),
      quantumState: this.sanitizeQuantumState(task.quantumState)
    }
  }

  private sanitizeQuantumState(state: QuantumTaskState): QuantumTaskState {
    return {
      superposition: new Map(Array.from(state.superposition.entries()).map(([key, value]) => [
        this.sanitizeString(key),
        this.clamp(value, this.validationRules.amplitudeRange.min, this.validationRules.amplitudeRange.max)
      ])),
      entangled: state.entangled.map(id => this.sanitizeString(id)).slice(0, this.validationRules.maxEntanglements),
      coherence: this.clamp(state.coherence, this.validationRules.coherenceRange.min, this.validationRules.coherenceRange.max),
      interference: this.clamp(state.interference, -this.validationRules.maxInterferenceStrength, this.validationRules.maxInterferenceStrength)
    }
  }

  private sanitizeSuperpositionState(state: SuperpositionState): SuperpositionState {
    return {
      ...state,
      id: this.sanitizeString(state.id),
      amplitude: this.clamp(state.amplitude, this.validationRules.amplitudeRange.min, this.validationRules.amplitudeRange.max),
      phase: this.normalizePhase(state.phase),
      probability: Math.max(0, Math.min(1, state.amplitude * state.amplitude)),
      energy: Math.max(0, state.energy)
    }
  }

  private sanitizeQuantumSystem(system: QuantumSystem): QuantumSystem {
    const sanitizedStates = new Map<string, SuperpositionState>()
    
    system.states.forEach((state, key) => {
      sanitizedStates.set(this.sanitizeString(key), this.sanitizeSuperpositionState(state))
    })

    return {
      ...system,
      id: this.sanitizeString(system.id),
      states: sanitizedStates,
      entangled: system.entangled.map(id => this.sanitizeString(id)).slice(0, this.validationRules.maxEntanglements),
      coherenceTime: Math.max(0.001, system.coherenceTime),
      decoherenceRate: this.clamp(system.decoherenceRate, 0, 1)
    }
  }

  private sanitizeInterferencePattern(pattern: InterferencePattern): InterferencePattern {
    return {
      ...pattern,
      id: this.sanitizeString(pattern.id),
      strength: this.clamp(pattern.strength, 0, this.validationRules.maxInterferenceStrength),
      frequency: this.clamp(pattern.frequency, this.validationRules.frequencyRange.min, this.validationRules.frequencyRange.max),
      phase: this.normalizePhase(pattern.phase),
      spatialRange: Math.max(0.001, pattern.spatialRange),
      temporalRange: Math.max(0.001, pattern.temporalRange)
    }
  }

  // Validation helper methods
  private validateTaskId(id: string, errors: QuantumValidationError[]): void {
    if (!id || typeof id !== 'string' || id.trim().length === 0) {
      errors.push(new QuantumValidationError(
        'Task ID must be a non-empty string',
        'id',
        id,
        { required: true, type: 'string' }
      ))
    }
  }

  private validateTaskDescription(description: string, errors: QuantumValidationError[], warnings: string[]): void {
    if (!description || typeof description !== 'string') {
      errors.push(new QuantumValidationError(
        'Task description must be a string',
        'description',
        description,
        { required: true, type: 'string' }
      ))
    } else if (description.length > 1000) {
      warnings.push('Task description is very long and may impact performance')
    }
  }

  private validateTaskPriority(priority: number, errors: QuantumValidationError[]): void {
    if (typeof priority !== 'number' ||
        priority < this.validationRules.taskPriorityRange.min ||
        priority > this.validationRules.taskPriorityRange.max) {
      errors.push(new QuantumValidationError(
        `Task priority must be between ${this.validationRules.taskPriorityRange.min} and ${this.validationRules.taskPriorityRange.max}`,
        'priority',
        priority,
        this.validationRules.taskPriorityRange
      ))
    }
  }

  private validateTaskDuration(duration: number, errors: QuantumValidationError[]): void {
    if (typeof duration !== 'number' || duration <= 0) {
      errors.push(new QuantumValidationError(
        'Task duration must be a positive number',
        'estimatedDuration',
        duration,
        { min: 0, exclusive: true }
      ))
    }
  }

  private validateRequiredAgents(agents: number, errors: QuantumValidationError[]): void {
    if (typeof agents !== 'number' ||
        agents < this.validationRules.agentLimits.min ||
        agents > this.validationRules.agentLimits.max) {
      errors.push(new QuantumValidationError(
        `Required agents must be between ${this.validationRules.agentLimits.min} and ${this.validationRules.agentLimits.max}`,
        'requiredAgents',
        agents,
        this.validationRules.agentLimits
      ))
    }
  }

  private validateTaskDependencies(dependencies: string[], errors: QuantumValidationError[]): void {
    if (!Array.isArray(dependencies)) {
      errors.push(new QuantumValidationError(
        'Task dependencies must be an array',
        'dependencies',
        dependencies,
        { type: 'array' }
      ))
    } else {
      dependencies.forEach((dep, index) => {
        if (!dep || typeof dep !== 'string') {
          errors.push(new QuantumValidationError(
            `Dependency at index ${index} must be a non-empty string`,
            `dependencies[${index}]`,
            dep,
            { required: true, type: 'string' }
          ))
        }
      })
    }
  }

  private validateTaskPosition(position: Vector3 | undefined, errors: QuantumValidationError[], warnings: string[]): void {
    if (position) {
      if (!(position instanceof Vector3)) {
        errors.push(new QuantumValidationError(
          'Task position must be a Vector3 instance',
          'position',
          position,
          { type: 'Vector3' }
        ))
      } else {
        const bounds = this.validationRules.positionBounds
        if (position.x < bounds.min.x || position.x > bounds.max.x ||
            position.y < bounds.min.y || position.y > bounds.max.y ||
            position.z < bounds.min.z || position.z > bounds.max.z) {
          warnings.push('Task position is outside recommended bounds')
        }
      }
    }
  }

  private validateTaskConstraints(constraints: TaskConstraint[], errors: QuantumValidationError[]): void {
    if (!Array.isArray(constraints)) {
      errors.push(new QuantumValidationError(
        'Task constraints must be an array',
        'constraints',
        constraints,
        { type: 'array' }
      ))
    } else {
      constraints.forEach((constraint, index) => {
        if (!constraint || typeof constraint !== 'object') {
          errors.push(new QuantumValidationError(
            `Constraint at index ${index} must be an object`,
            `constraints[${index}]`,
            constraint,
            { type: 'object' }
          ))
        }
      })
    }
  }

  private validateSuperposition(superposition: Map<string, number>, errors: QuantumValidationError[], warnings: string[]): void {
    if (!(superposition instanceof Map)) {
      errors.push(new QuantumValidationError(
        'Superposition must be a Map',
        'superposition',
        superposition,
        { type: 'Map' }
      ))
      return
    }

    if (superposition.size === 0) {
      errors.push(new QuantumValidationError(
        'Superposition must have at least one state',
        'superposition',
        superposition.size,
        { minStates: 1 }
      ))
    }

    if (superposition.size > this.validationRules.maxSuperpositionStates) {
      errors.push(new QuantumValidationError(
        `Superposition cannot have more than ${this.validationRules.maxSuperpositionStates} states`,
        'superposition',
        superposition.size,
        { maxStates: this.validationRules.maxSuperpositionStates }
      ))
    }

    // Validate amplitude normalization
    const totalAmplitudeSquared = Array.from(superposition.values())
      .reduce((sum, amplitude) => sum + amplitude * amplitude, 0)
    
    if (Math.abs(totalAmplitudeSquared - 1.0) > this.validationRules.probabilityTolerance) {
      warnings.push(`Superposition amplitudes not normalized: total probability = ${totalAmplitudeSquared}`)
    }
  }

  private validateEntanglements(entangled: string[], errors: QuantumValidationError[], warnings: string[]): void {
    if (!Array.isArray(entangled)) {
      errors.push(new QuantumValidationError(
        'Entangled systems must be an array',
        'entangled',
        entangled,
        { type: 'array' }
      ))
    } else if (entangled.length > this.validationRules.maxEntanglements) {
      warnings.push(`Too many entanglements (${entangled.length}), performance may be impacted`)
    }
  }

  // Utility methods
  private sanitizeString(str: string): string {
    if (typeof str !== 'string') return ''
    return str.trim().replace(/[<>]/g, '') // Basic XSS prevention
  }

  private sanitizePosition(position?: Vector3): Vector3 | undefined {
    if (!position || !(position instanceof Vector3)) return position
    
    const bounds = this.validationRules.positionBounds
    return new Vector3(
      this.clamp(position.x, bounds.min.x, bounds.max.x),
      this.clamp(position.y, bounds.min.y, bounds.max.y),
      this.clamp(position.z, bounds.min.z, bounds.max.z)
    )
  }

  private sanitizeConstraint(constraint: TaskConstraint): TaskConstraint {
    return {
      ...constraint,
      type: this.sanitizeString(constraint.type) as any,
      weight: Math.max(0, constraint.weight)
    }
  }

  private clamp(value: number, min: number, max: number): number {
    return Math.max(min, Math.min(max, value))
  }

  private normalizePhase(phase: number): number {
    if (typeof phase !== 'number') return 0
    
    // Normalize to [0, 2π]
    while (phase < 0) phase += 2 * Math.PI
    while (phase >= 2 * Math.PI) phase -= 2 * Math.PI
    
    return phase
  }

  // Configuration methods
  public updateValidationRules(rules: Partial<QuantumValidationRules>): void {
    this.validationRules = { ...this.validationRules, ...rules }
  }

  public getValidationRules(): QuantumValidationRules {
    return { ...this.validationRules }
  }
}