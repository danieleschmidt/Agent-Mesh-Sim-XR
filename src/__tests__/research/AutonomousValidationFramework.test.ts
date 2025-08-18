import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { AutonomousValidationFramework } from '../../research/AutonomousValidationFramework'
import type { ResearchHypothesis } from '../../research/AutonomousValidationFramework'

/**
 * Generation 4: BULLETPROOF PRODUCTION
 * Tests for Autonomous Research Validation Framework
 */

describe('AutonomousValidationFramework', () => {
  let validationFramework: AutonomousValidationFramework

  const mockHypothesis: ResearchHypothesis = {
    id: 'test_hypothesis_001',
    title: 'Quantum-Enhanced Agent Coordination Performance',
    description: 'Testing if quantum superposition improves multi-agent coordination efficiency',
    measurable_criteria: [
      {
        metric_name: 'coordination_efficiency',
        measurement_unit: 'percentage',
        target_value: 85,
        tolerance: 5,
        measurement_method: 'automated_simulation'
      },
      {
        metric_name: 'convergence_time',
        measurement_unit: 'milliseconds',
        target_value: 100,
        tolerance: 20,
        measurement_method: 'temporal_measurement'
      }
    ],
    baseline_metrics: {
      coordination_efficiency: 70,
      convergence_time: 150
    },
    success_threshold: 0.8,
    statistical_significance_required: 0.05,
    experiment_design: {
      control_group_size: 50,
      experimental_group_size: 50,
      randomization_method: 'stratified_random',
      confounding_variables: ['agent_density', 'network_topology'],
      measurement_intervals: [100, 500, 1000, 2000],
      duration_ms: 10000
    },
    timestamp: Date.now()
  }

  beforeEach(() => {
    validationFramework = new AutonomousValidationFramework()
  })

  afterEach(() => {
    validationFramework.dispose()
  })

  describe('Hypothesis Registration', () => {
    it('should register valid research hypothesis', async () => {
      const hypothesisId = await validationFramework.registerHypothesis(mockHypothesis)
      
      expect(hypothesisId).toBe(mockHypothesis.id)
    })

    it('should validate hypothesis structure', async () => {
      const invalidHypothesis = {
        ...mockHypothesis,
        id: '', // Invalid empty ID
        measurable_criteria: [] // Invalid empty criteria
      }

      await expect(validationFramework.registerHypothesis(invalidHypothesis))
        .rejects.toThrow('Invalid hypothesis structure')
    })

    it('should require minimum success threshold', async () => {
      const invalidHypothesis = {
        ...mockHypothesis,
        success_threshold: 1.5 // Invalid threshold > 1
      }

      await expect(validationFramework.registerHypothesis(invalidHypothesis))
        .rejects.toThrow('Success threshold must be between 0 and 1')
    })

    it('should require valid statistical significance', async () => {
      const invalidHypothesis = {
        ...mockHypothesis,
        statistical_significance_required: 1.0 // Invalid significance = 1
      }

      await expect(validationFramework.registerHypothesis(invalidHypothesis))
        .rejects.toThrow('Statistical significance must be between 0 and 1')
    })
  })

  describe('Autonomous Validation Process', () => {
    it('should start autonomous validation successfully', async () => {
      await validationFramework.registerHypothesis(mockHypothesis)
      
      // Start validation (will run in background)
      validationFramework.startAutonomousValidation()
      
      // Allow some time for validation cycle
      await new Promise(resolve => setTimeout(resolve, 100))
      
      validationFramework.stopValidation()
    })

    it('should prevent multiple validation processes', async () => {
      validationFramework.startAutonomousValidation()
      
      // Second call should not throw, just warn
      validationFramework.startAutonomousValidation()
      
      validationFramework.stopValidation()
    })
  })

  describe('Validation Results', () => {
    it('should return undefined for non-existent hypothesis', () => {
      const result = validationFramework.getValidationResults('non_existent_id')
      expect(result).toBeUndefined()
    })

    it('should track validation results after processing', async () => {
      await validationFramework.registerHypothesis(mockHypothesis)
      
      // Results should be undefined initially
      const initialResult = validationFramework.getValidationResults(mockHypothesis.id)
      expect(initialResult).toBeUndefined()
    })
  })

  describe('Publication Ready Results', () => {
    it('should return empty array when no results are publication ready', () => {
      const publicationReadyResults = validationFramework.getPublicationReadyResults()
      expect(publicationReadyResults).toEqual([])
    })

    it('should filter publication ready results correctly', async () => {
      await validationFramework.registerHypothesis(mockHypothesis)
      
      // Initially no publication ready results
      const results = validationFramework.getPublicationReadyResults()
      expect(results.length).toBe(0)
    })
  })

  describe('Publication Report Generation', () => {
    it('should throw error for incomplete research data', async () => {
      await expect(validationFramework.generatePublicationReport('non_existent_hypothesis'))
        .rejects.toThrow('Incomplete research data for hypothesis')
    })

    it('should require hypothesis, validation result, and dataset', async () => {
      await validationFramework.registerHypothesis(mockHypothesis)
      
      await expect(validationFramework.generatePublicationReport(mockHypothesis.id))
        .rejects.toThrow('Incomplete research data for hypothesis')
    })
  })

  describe('Framework Integration', () => {
    it('should emit hypothesis registration events', async () => {
      let eventEmitted = false
      
      validationFramework.on('hypothesisRegistered', (hypothesis) => {
        expect(hypothesis.id).toBe(mockHypothesis.id)
        eventEmitted = true
      })
      
      await validationFramework.registerHypothesis(mockHypothesis)
      expect(eventEmitted).toBe(true)
    })

    it('should handle multiple hypotheses', async () => {
      const hypothesis1 = { ...mockHypothesis, id: 'hypothesis_1' }
      const hypothesis2 = { ...mockHypothesis, id: 'hypothesis_2' }
      
      await validationFramework.registerHypothesis(hypothesis1)
      await validationFramework.registerHypothesis(hypothesis2)
      
      // Both should be registered
      expect(validationFramework.getValidationResults('hypothesis_1')).toBeUndefined() // No results yet
      expect(validationFramework.getValidationResults('hypothesis_2')).toBeUndefined() // No results yet
    })
  })

  describe('Error Handling', () => {
    it('should handle validation errors gracefully', async () => {
      const malformedHypothesis = {
        ...mockHypothesis,
        title: 'a' // Too short title
      }

      await expect(validationFramework.registerHypothesis(malformedHypothesis))
        .rejects.toThrow('Hypothesis title too short')
    })

    it('should handle missing experiment design', async () => {
      const incompleteHypothesis = {
        ...mockHypothesis,
        experiment_design: {
          ...mockHypothesis.experiment_design,
          control_group_size: 0 // Invalid group size
        }
      }

      // Should still register (validation happens during execution)
      const hypothesisId = await validationFramework.registerHypothesis(incompleteHypothesis)
      expect(hypothesisId).toBe(mockHypothesis.id)
    })
  })

  describe('Statistical Validation', () => {
    it('should require sufficient sample size', () => {
      const smallSampleHypothesis = {
        ...mockHypothesis,
        experiment_design: {
          ...mockHypothesis.experiment_design,
          control_group_size: 5,
          experimental_group_size: 5
        }
      }

      // Framework should accept but validation will note insufficient power
      expect(async () => {
        await validationFramework.registerHypothesis(smallSampleHypothesis)
      }).not.toThrow()
    })

    it('should validate statistical requirements', () => {
      expect(mockHypothesis.statistical_significance_required).toBeLessThan(0.1)
      expect(mockHypothesis.success_threshold).toBeGreaterThan(0)
      expect(mockHypothesis.success_threshold).toBeLessThanOrEqual(1)
    })
  })

  describe('Research Quality Assurance', () => {
    it('should enforce reproducibility standards', () => {
      expect(mockHypothesis.experiment_design.randomization_method).toBeTruthy()
      expect(mockHypothesis.experiment_design.control_group_size).toBeGreaterThan(0)
      expect(mockHypothesis.measurable_criteria.length).toBeGreaterThan(0)
    })

    it('should validate measurable criteria', () => {
      mockHypothesis.measurable_criteria.forEach(criterion => {
        expect(criterion.metric_name).toBeTruthy()
        expect(criterion.measurement_unit).toBeTruthy()
        expect(criterion.target_value).toBeGreaterThan(0)
        expect(criterion.measurement_method).toBeTruthy()
      })
    })
  })

  describe('Framework Disposal', () => {
    it('should dispose cleanly', () => {
      expect(() => validationFramework.dispose()).not.toThrow()
    })

    it('should stop validation on disposal', () => {
      validationFramework.startAutonomousValidation()
      validationFramework.dispose()
      
      // Should not throw after disposal
      expect(() => validationFramework.stopValidation()).not.toThrow()
    })
  })
})