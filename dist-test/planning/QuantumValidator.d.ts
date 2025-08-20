import { Vector3 } from 'three';
import { Task, QuantumTaskState } from './QuantumInspiredPlanner';
import { SuperpositionState, QuantumSystem } from './QuantumSuperpositionManager';
import { InterferencePattern } from './QuantumInterferenceEngine';
export declare class QuantumValidationError extends Error {
    readonly field: string;
    readonly value: any;
    readonly constraints: any;
    constructor(message: string, field: string, value: any, constraints: any);
}
export interface ValidationResult {
    isValid: boolean;
    errors: QuantumValidationError[];
    warnings: string[];
    sanitizedValue?: any;
}
export interface QuantumValidationRules {
    coherenceRange: {
        min: number;
        max: number;
    };
    amplitudeRange: {
        min: number;
        max: number;
    };
    phaseRange: {
        min: number;
        max: number;
    };
    frequencyRange: {
        min: number;
        max: number;
    };
    probabilityTolerance: number;
    maxSuperpositionStates: number;
    maxEntanglements: number;
    maxInterferenceStrength: number;
    taskPriorityRange: {
        min: number;
        max: number;
    };
    agentLimits: {
        min: number;
        max: number;
    };
    positionBounds: {
        min: Vector3;
        max: Vector3;
    };
}
export declare class QuantumValidator {
    private static instance;
    private validationRules;
    private constructor();
    static getInstance(): QuantumValidator;
    validateQuantumTask(task: Task): ValidationResult;
    validateQuantumState(state: QuantumTaskState): ValidationResult;
    validateSuperpositionState(state: SuperpositionState): ValidationResult;
    validateQuantumSystem(system: QuantumSystem): ValidationResult;
    validateInterferencePattern(pattern: InterferencePattern): ValidationResult;
    private sanitizeTask;
    private sanitizeQuantumState;
    private sanitizeSuperpositionState;
    private sanitizeQuantumSystem;
    private sanitizeInterferencePattern;
    private validateTaskId;
    private validateTaskDescription;
    private validateTaskPriority;
    private validateTaskDuration;
    private validateRequiredAgents;
    private validateTaskDependencies;
    private validateTaskPosition;
    private validateTaskConstraints;
    private validateSuperposition;
    private validateEntanglements;
    private sanitizeString;
    private sanitizePosition;
    private sanitizeConstraint;
    private clamp;
    private normalizePhase;
    updateValidationRules(rules: Partial<QuantumValidationRules>): void;
    getValidationRules(): QuantumValidationRules;
}
