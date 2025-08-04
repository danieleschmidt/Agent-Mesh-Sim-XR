import { describe, it, expect } from 'vitest'
import { Validator, ValidationError } from '../../utils/Validator'
import { Vector3 } from 'three'
import type { Agent } from '../../types'

describe('Validator', () => {
  describe('validateAgent', () => {
    const validAgent: Agent = {
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
      metadata: { created: Date.now() },
      activeGoals: ['explore'],
      connectedPeers: [],
      metrics: {
        cpuMs: 10,
        memoryMB: 20,
        msgPerSec: 5,
        uptime: 1000
      },
      lastUpdate: Date.now()
    }

    it('should validate a correct agent', () => {
      expect(() => Validator.validateAgent(validAgent)).not.toThrow()
    })

    it('should throw for missing ID', () => {
      const invalidAgent = { ...validAgent, id: '' }
      expect(() => Validator.validateAgent(invalidAgent)).toThrow(ValidationError)
    })

    it('should throw for invalid position', () => {
      const invalidAgent = { ...validAgent, position: { x: 'invalid', y: 0, z: 0 } }
      expect(() => Validator.validateAgent(invalidAgent)).toThrow(ValidationError)
    })

    it('should throw for invalid state', () => {
      const invalidAgent = { 
        ...validAgent, 
        currentState: { ...validAgent.currentState, status: 'invalid' as any }
      }
      expect(() => Validator.validateAgent(invalidAgent)).toThrow(ValidationError)
    })

    it('should throw for invalid energy range', () => {
      const invalidAgent = { 
        ...validAgent, 
        currentState: { ...validAgent.currentState, energy: 150 }
      }
      expect(() => Validator.validateAgent(invalidAgent)).toThrow(ValidationError)
    })
  })

  describe('sanitizeString', () => {
    it('should remove script tags', () => {
      const malicious = '<script>alert("xss")</script>Hello'
      const result = Validator.sanitizeString(malicious)
      expect(result).toBe('Hello')
      expect(result).not.toContain('script')
    })

    it('should remove javascript: protocol', () => {
      const malicious = 'javascript:alert("xss")'
      const result = Validator.sanitizeString(malicious)
      expect(result).not.toContain('javascript:')
    })

    it('should limit string length', () => {
      const longString = 'a'.repeat(2000)
      const result = Validator.sanitizeString(longString, 100)
      expect(result.length).toBe(100)
    })

    it('should preserve safe content', () => {
      const safe = 'Hello World 123'
      const result = Validator.sanitizeString(safe)
      expect(result).toBe(safe)
    })
  })

  describe('validateWebSocketURL', () => {
    it('should validate ws:// URLs', () => {
      expect(() => Validator.validateWebSocketURL('ws://localhost:8080')).not.toThrow()
    })

    it('should validate wss:// URLs', () => {
      expect(() => Validator.validateWebSocketURL('wss://example.com:443')).not.toThrow()
    })

    it('should reject http:// URLs', () => {
      expect(() => Validator.validateWebSocketURL('http://example.com')).toThrow(ValidationError)
    })

    it('should reject invalid URLs', () => {
      expect(() => Validator.validateWebSocketURL('not-a-url')).toThrow(ValidationError)
    })
  })

  describe('rateLimitCheck', () => {
    it('should allow requests within limit', () => {
      const result = Validator.rateLimitCheck('test-user', 10, 60000)
      expect(result).toBe(true)
    })

    it('should reject requests over limit', () => {
      const identifier = 'rate-limit-test'
      
      // Make requests up to limit
      for (let i = 0; i < 5; i++) {
        Validator.rateLimitCheck(identifier, 1, 60000)
      }
      
      // This should be rejected
      const result = Validator.rateLimitCheck(identifier, 1, 60000)
      expect(result).toBe(false)
    })
  })

  describe('sanitizeAgentData', () => {
    it('should sanitize agent strings', () => {
      const maliciousAgent: Agent = {
        ...{
          id: 'test-agent-1',
          type: 'worker',
          position: new Vector3(0, 0, 0),
          velocity: new Vector3(1, 0, 1),
          currentState: {
            status: 'active',
            behavior: '<script>alert("xss")</script>exploring',
            role: 'worker',
            energy: 100,
            priority: 1
          },
          metadata: { 
            description: 'javascript:alert("malicious")',
            safe: 'normal text'
          },
          activeGoals: ['<script>malicious</script>goal'],
          connectedPeers: [],
          metrics: {
            cpuMs: 10,
            memoryMB: 20,
            msgPerSec: 5,
            uptime: 1000
          },
          lastUpdate: Date.now()
        }
      }

      const sanitized = Validator.sanitizeAgentData(maliciousAgent)
      
      expect(sanitized.currentState.behavior).not.toContain('script')
      expect(sanitized.metadata.description).not.toContain('javascript:')
      expect(sanitized.activeGoals[0]).not.toContain('script')
      expect(sanitized.metadata.safe).toBe('normal text')
    })
  })
})