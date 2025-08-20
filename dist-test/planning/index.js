"use strict";
// Quantum-Inspired Task Planning System
// Export all quantum planning components
Object.defineProperty(exports, "__esModule", { value: true });
exports.QuantumPlanningUtils = exports.QuantumPerformanceOptimizer = exports.QuantumMonitor = exports.QuantumSecurityManager = exports.QuantumValidator = exports.QuantumErrorHandler = exports.QuantumInterferenceEngine = exports.QuantumAnnealingOptimizer = exports.QuantumSuperpositionManager = exports.QuantumPlanningIntegration = exports.QuantumInspiredPlanner = void 0;
exports.createQuantumPlanningSystem = createQuantumPlanningSystem;
exports.createQuantumOptimizer = createQuantumOptimizer;
exports.createQuantumMonitor = createQuantumMonitor;
const QuantumPlanningIntegration_1 = require("./QuantumPlanningIntegration");
const QuantumPerformanceOptimizer_1 = require("./QuantumPerformanceOptimizer");
const QuantumErrorHandler_1 = require("./QuantumErrorHandler");
const QuantumMonitor_1 = require("./QuantumMonitor");
const QuantumSecurityManager_1 = require("./QuantumSecurityManager");
const QuantumValidator_1 = require("./QuantumValidator");
// Core Quantum Planning
var QuantumInspiredPlanner_1 = require("./QuantumInspiredPlanner");
Object.defineProperty(exports, "QuantumInspiredPlanner", { enumerable: true, get: function () { return QuantumInspiredPlanner_1.QuantumInspiredPlanner; } });
var QuantumPlanningIntegration_2 = require("./QuantumPlanningIntegration");
Object.defineProperty(exports, "QuantumPlanningIntegration", { enumerable: true, get: function () { return QuantumPlanningIntegration_2.QuantumPlanningIntegration; } });
// Quantum State Management
var QuantumSuperpositionManager_1 = require("./QuantumSuperpositionManager");
Object.defineProperty(exports, "QuantumSuperpositionManager", { enumerable: true, get: function () { return QuantumSuperpositionManager_1.QuantumSuperpositionManager; } });
// Quantum Optimization
var QuantumAnnealingOptimizer_1 = require("./QuantumAnnealingOptimizer");
Object.defineProperty(exports, "QuantumAnnealingOptimizer", { enumerable: true, get: function () { return QuantumAnnealingOptimizer_1.QuantumAnnealingOptimizer; } });
// Quantum Interference
var QuantumInterferenceEngine_1 = require("./QuantumInterferenceEngine");
Object.defineProperty(exports, "QuantumInterferenceEngine", { enumerable: true, get: function () { return QuantumInterferenceEngine_1.QuantumInterferenceEngine; } });
// Error Handling and Recovery
var QuantumErrorHandler_2 = require("./QuantumErrorHandler");
Object.defineProperty(exports, "QuantumErrorHandler", { enumerable: true, get: function () { return QuantumErrorHandler_2.QuantumErrorHandler; } });
// Validation and Security
var QuantumValidator_2 = require("./QuantumValidator");
Object.defineProperty(exports, "QuantumValidator", { enumerable: true, get: function () { return QuantumValidator_2.QuantumValidator; } });
var QuantumSecurityManager_2 = require("./QuantumSecurityManager");
Object.defineProperty(exports, "QuantumSecurityManager", { enumerable: true, get: function () { return QuantumSecurityManager_2.QuantumSecurityManager; } });
// Monitoring and Health
var QuantumMonitor_2 = require("./QuantumMonitor");
Object.defineProperty(exports, "QuantumMonitor", { enumerable: true, get: function () { return QuantumMonitor_2.QuantumMonitor; } });
// Performance Optimization
var QuantumPerformanceOptimizer_2 = require("./QuantumPerformanceOptimizer");
Object.defineProperty(exports, "QuantumPerformanceOptimizer", { enumerable: true, get: function () { return QuantumPerformanceOptimizer_2.QuantumPerformanceOptimizer; } });
// Utility functions for quantum planning
exports.QuantumPlanningUtils = {
    /**
     * Create a simple quantum task from basic parameters
     */
    createSimpleTask: (id, description, priority, requiredAgents, estimatedDuration) => {
        return {
            id,
            description,
            priority,
            dependencies: [],
            estimatedDuration,
            requiredAgents,
            constraints: [],
            quantumState: {
                superposition: new Map([
                    ['waiting', 0.8],
                    ['ready', 0.2]
                ]),
                entangled: [],
                coherence: 1.0,
                interference: 0.0
            }
        };
    },
    /**
     * Calculate quantum entanglement strength between two tasks
     */
    calculateEntanglementStrength: (task1, task2) => {
        let strength = 0;
        // Dependency relationship
        if (task1.dependencies.includes(task2.id) || task2.dependencies.includes(task1.id)) {
            strength += 0.8;
        }
        // Priority similarity
        const priorityDiff = Math.abs(task1.priority - task2.priority);
        strength += (10 - priorityDiff) / 10 * 0.3;
        // Duration compatibility
        const durationRatio = Math.min(task1.estimatedDuration, task2.estimatedDuration) /
            Math.max(task1.estimatedDuration, task2.estimatedDuration);
        strength += durationRatio * 0.2;
        // Spatial proximity (if positions exist)
        if (task1.position && task2.position) {
            const distance = task1.position.distanceTo(task2.position);
            const proximityFactor = Math.exp(-distance / 10); // Exponential decay
            strength += proximityFactor * 0.4;
        }
        return Math.min(1.0, strength);
    },
    /**
     * Generate quantum interference pattern for task prioritization
     */
    generateInterferencePattern: (tasks, patternType = 'mixed') => {
        const avgPriority = tasks.reduce((sum, task) => sum + task.priority, 0) / tasks.length;
        const frequency = avgPriority * 0.1;
        return {
            id: `pattern_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            type: patternType,
            strength: 1.0 + Math.random() * 0.5,
            frequency,
            phase: Math.random() * 2 * Math.PI,
            spatialRange: 5.0 + Math.random() * 5.0,
            temporalRange: 10.0 + Math.random() * 10.0
        };
    },
    /**
     * Validate quantum planning configuration
     */
    validateQuantumConfig: (config) => {
        const validator = QuantumValidator_1.QuantumValidator.getInstance();
        // Basic validation
        if (config.maxQuantumStates && config.maxQuantumStates <= 0)
            return false;
        if (config.coherenceThreshold && (config.coherenceThreshold < 0 || config.coherenceThreshold > 1))
            return false;
        if (config.interferenceRange && config.interferenceRange <= 0)
            return false;
        return true;
    },
    /**
     * Calculate quantum planning efficiency score
     */
    calculatePlanningEfficiency: (originalPlan, quantumPlan, tasks) => {
        let efficiencyGain = 0;
        let totalTasks = tasks.length;
        // Compare assignment quality
        tasks.forEach(task => {
            const originalAssignment = originalPlan.get(task.id) || [];
            const quantumAssignment = quantumPlan.get(task.id) || [];
            // Perfect assignment score
            const originalScore = Math.abs(originalAssignment.length - task.requiredAgents);
            const quantumScore = Math.abs(quantumAssignment.length - task.requiredAgents);
            if (quantumScore < originalScore) {
                efficiencyGain += (originalScore - quantumScore) / Math.max(1, originalScore);
            }
        });
        return totalTasks > 0 ? efficiencyGain / totalTasks : 0;
    },
    /**
     * Generate quantum planning report
     */
    generatePlanningReport: (results, metrics) => {
        const totalTasks = results.size;
        const enhancedTasks = Array.from(results.values())
            .filter(result => result.quantumPriority !== result.originalPriority).length;
        const avgCoherence = Array.from(results.values())
            .reduce((sum, result) => sum + result.coherenceLevel, 0) / totalTasks;
        const avgExecutionProbability = Array.from(results.values())
            .reduce((sum, result) => sum + result.executionProbability, 0) / totalTasks;
        return `
# Quantum Planning Report

## Overview
- **Total Tasks**: ${totalTasks}
- **Quantum Enhanced**: ${enhancedTasks} (${((enhancedTasks / totalTasks) * 100).toFixed(1)}%)
- **Average Coherence**: ${avgCoherence.toFixed(3)}
- **Average Execution Probability**: ${avgExecutionProbability.toFixed(3)}

## Performance Metrics
- **Planning Time**: ${metrics.planningTime}ms
- **Optimization Gain**: ${(metrics.optimizationGain * 100).toFixed(1)}%
- **Interference Events**: ${metrics.interferenceEvents}
- **Annealing Convergence**: ${(metrics.annealingConvergence * 100).toFixed(1)}%

## Quantum Effects
- **Entangled Tasks**: ${metrics.quantumEnhancedTasks}
- **Entanglement Ratio**: ${((metrics.quantumEnhancedTasks / metrics.totalTasks) * 100).toFixed(1)}%
- **Average Coherence**: ${metrics.averageCoherence.toFixed(3)}

## Task Distribution
${Array.from(results.values())
            .sort((a, b) => b.quantumPriority - a.quantumPriority)
            .slice(0, 10)
            .map(result => `- **${result.taskId}**: Priority ${result.originalPriority} → ${result.quantumPriority.toFixed(2)} (${result.assignedAgents.length} agents)`)
            .join('\n')}
    `.trim();
    }
};
// Factory function for creating integrated quantum planning system
function createQuantumPlanningSystem(agentMeshXR, // AgentMeshXR instance
config = {}) {
    return new QuantumPlanningIntegration_1.QuantumPlanningIntegration(agentMeshXR, config);
}
// Factory function for creating quantum performance optimizer
function createQuantumOptimizer(config = {}) {
    return new QuantumPerformanceOptimizer_1.QuantumPerformanceOptimizer(config);
}
// Factory function for creating quantum monitoring system
function createQuantumMonitor() {
    const errorHandler = new QuantumErrorHandler_1.QuantumErrorHandler();
    const monitor = new QuantumMonitor_1.QuantumMonitor(errorHandler);
    const security = QuantumSecurityManager_1.QuantumSecurityManager.getInstance();
    const validator = QuantumValidator_1.QuantumValidator.getInstance();
    return {
        errorHandler,
        monitor,
        security,
        validator
    };
}
// Types are already exported above via the main export statements
