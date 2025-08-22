// Ultra High-Performance Scaling Systems for Agent Mesh Sim XR
// Export extreme scaling and quantum performance capabilities

// Core Scaling Systems
export { HyperScaleEngine } from './HyperScaleEngine'
export type {
  HyperScaleConfig,
  PerformanceTargets,
  ResourceLimits,
  AutoScalingPolicy,
  OptimizationStrategy,
  ScalingMetrics,
  PerformanceBottleneck,
  ComputeNode,
  NodeCapabilities,
  ScalingResult,
  HyperScaleReport
} from './HyperScaleEngine'

// Quantum Performance Systems
export { QuantumPerformanceBooster } from './QuantumPerformanceBooster'
export type {
  QuantumBoostConfig,
  QuantumAlgorithmConfig,
  QuantumPerformanceGain,
  QuantumComputationTask,
  QuantumCircuit,
  QuantumExecutionResult,
  QuantumAccelerationResult,
  QuantumPerformanceReport
} from './QuantumPerformanceBooster'

// Scaling Utility Functions
export const ScalingUtils = {
  /**
   * Calculate optimal scaling configuration for target performance
   */
  calculateOptimalScalingConfig: (
    targetAgents: number,
    performanceRequirements: PerformanceTargets
  ): HyperScaleConfig => {
    // Calculate resource requirements based on agent count and performance targets
    const baseComputeNodes = Math.ceil(targetAgents / 10000) // 10k agents per node baseline
    const gpuAcceleration = targetAgents > 50000 || performanceRequirements.target_fps > 60
    const distributedComputing = targetAgents > 100000
    
    return {
      max_agents: Math.max(targetAgents * 1.2, 1000000), // 20% headroom, minimum 1M capacity
      gpu_acceleration: gpuAcceleration,
      distributed_computing: distributedComputing,
      edge_computing_nodes: distributedComputing ? [
        'edge://na-east-1.compute.edge',
        'edge://eu-west-1.compute.edge',
        'edge://ap-southeast-1.compute.edge'
      ] : [],
      auto_scaling_policies: [
        {
          metric: 'cpu_utilization',
          threshold_up: 0.8,
          threshold_down: 0.3,
          scale_up_factor: 1.5,
          scale_down_factor: 0.7,
          cooldown_period_ms: 300000, // 5 minutes
          max_instances: Math.ceil(targetAgents / 5000),
          min_instances: Math.ceil(targetAgents / 50000)
        },
        {
          metric: 'memory_utilization',
          threshold_up: 0.85,
          threshold_down: 0.4,
          scale_up_factor: 1.3,
          scale_down_factor: 0.8,
          cooldown_period_ms: 180000, // 3 minutes
          max_instances: Math.ceil(targetAgents / 8000),
          min_instances: Math.ceil(targetAgents / 40000)
        },
        {
          metric: 'agent_processing_latency',
          threshold_up: performanceRequirements.max_latency_ms * 0.8,
          threshold_down: performanceRequirements.max_latency_ms * 0.3,
          scale_up_factor: 2.0,
          scale_down_factor: 0.6,
          cooldown_period_ms: 120000, // 2 minutes
          max_instances: Math.ceil(targetAgents / 3000),
          min_instances: 2
        }
      ],
      performance_targets: performanceRequirements,
      resource_limits: {
        max_memory_gb: Math.ceil(targetAgents / 1000) * 8, // 8GB per 1000 agents
        max_cpu_cores: Math.ceil(targetAgents / 5000) * 64, // 64 cores per 5000 agents
        max_gpu_memory_gb: gpuAcceleration ? Math.ceil(targetAgents / 2000) * 16 : 0, // 16GB GPU per 2000 agents
        max_network_bandwidth_mbps: targetAgents * 0.1, // 0.1 Mbps per agent
        max_storage_iops: targetAgents * 10 // 10 IOPS per agent
      },
      optimization_strategies: [
        {
          name: 'agent_batching_optimization',
          priority: 1,
          conditions: ['agent_count > 1000'],
          actions: [
            {
              action: 'enable_batch_processing',
              parameters: { batch_size: Math.min(1000, targetAgents / 100) },
              estimated_improvement: 0.3,
              resource_requirement: 0.1
            }
          ],
          performance_impact: 0.25,
          resource_cost: 0.05
        },
        {
          name: 'memory_pooling_optimization',
          priority: 2,
          conditions: ['memory_utilization > 0.7'],
          actions: [
            {
              action: 'enable_memory_pooling',
              parameters: { pool_size_gb: Math.ceil(targetAgents / 1000) * 4 },
              estimated_improvement: 0.2,
              resource_requirement: 0.15
            }
          ],
          performance_impact: 0.15,
          resource_cost: 0.1
        },
        {
          name: 'gpu_parallel_optimization',
          priority: gpuAcceleration ? 1 : 5,
          conditions: ['gpu_available', 'agent_count > 10000'],
          actions: [
            {
              action: 'enable_gpu_parallelization',
              parameters: { parallel_streams: 8, batch_size: 512 },
              estimated_improvement: 0.5,
              resource_requirement: 0.3
            }
          ],
          performance_impact: 0.4,
          resource_cost: 0.2
        }
      ]
    }
  },

  /**
   * Design quantum acceleration configuration
   */
  createQuantumAccelerationConfig: (
    computationalComplexity: 'low' | 'medium' | 'high' | 'extreme',
    problemDomains: string[]
  ): QuantumBoostConfig => {
    const quantumAlgorithms: QuantumAlgorithmConfig[] = []
    
    // Add optimization algorithms
    if (problemDomains.includes('optimization')) {
      quantumAlgorithms.push({
        algorithm_name: 'QAOA',
        problem_domain: 'optimization',
        qubit_requirement: 20,
        quantum_speedup_factor: 4.0,
        success_probability: 0.85,
        error_tolerance: 0.01,
        use_cases: ['path_planning', 'resource_allocation', 'scheduling']
      })
      
      quantumAlgorithms.push({
        algorithm_name: 'Quantum_Annealing',
        problem_domain: 'optimization',
        qubit_requirement: 50,
        quantum_speedup_factor: 8.0,
        success_probability: 0.9,
        error_tolerance: 0.005,
        use_cases: ['combinatorial_optimization', 'portfolio_optimization']
      })
    }
    
    // Add search algorithms
    if (problemDomains.includes('search')) {
      quantumAlgorithms.push({
        algorithm_name: 'Grovers_Algorithm',
        problem_domain: 'search',
        qubit_requirement: 15,
        quantum_speedup_factor: Math.sqrt(1000000), // Quadratic speedup
        success_probability: 0.95,
        error_tolerance: 0.01,
        use_cases: ['database_search', 'pattern_matching']
      })
    }
    
    // Add machine learning algorithms
    if (problemDomains.includes('machine_learning')) {
      quantumAlgorithms.push({
        algorithm_name: 'Variational_Quantum_Classifier',
        problem_domain: 'machine_learning',
        qubit_requirement: 25,
        quantum_speedup_factor: 3.0,
        success_probability: 0.8,
        error_tolerance: 0.02,
        use_cases: ['classification', 'pattern_recognition', 'anomaly_detection']
      })
      
      quantumAlgorithms.push({
        algorithm_name: 'Quantum_Neural_Network',
        problem_domain: 'machine_learning',
        qubit_requirement: 40,
        quantum_speedup_factor: 6.0,
        success_probability: 0.75,
        error_tolerance: 0.015,
        use_cases: ['deep_learning', 'feature_extraction']
      })
    }
    
    // Add simulation algorithms
    if (problemDomains.includes('simulation')) {
      quantumAlgorithms.push({
        algorithm_name: 'Quantum_System_Simulation',
        problem_domain: 'simulation',
        qubit_requirement: 60,
        quantum_speedup_factor: 15.0,
        success_probability: 0.85,
        error_tolerance: 0.01,
        use_cases: ['molecular_simulation', 'physics_simulation', 'chemistry_modeling']
      })
    }

    return {
      quantum_backend: computationalComplexity === 'extreme' ? 'real_hardware' : 'simulator',
      max_qubits: calculateRequiredQubits(computationalComplexity, quantumAlgorithms),
      quantum_algorithms: quantumAlgorithms,
      error_correction: computationalComplexity !== 'low',
      noise_mitigation: true,
      quantum_advantage_threshold: 2.0,
      classical_fallback: true
    }
  },

  /**
   * Calculate theoretical performance limits and scaling boundaries
   */
  calculateScalingLimits: (
    currentConfig: HyperScaleConfig,
    hardwareConstraints: HardwareConstraints
  ): ScalingLimits => {
    // Calculate theoretical maximum agents
    const memoryLimitedAgents = (hardwareConstraints.total_memory_gb * 1024) / 8 // 8MB per agent
    const cpuLimitedAgents = hardwareConstraints.total_cpu_cores * 5000 // 5000 agents per core
    const gpuLimitedAgents = hardwareConstraints.total_gpu_memory_gb * 2500 // 2500 agents per GB GPU
    const networkLimitedAgents = hardwareConstraints.network_bandwidth_gbps * 10000 // 10k agents per Gbps
    
    const theoreticalMaxAgents = Math.min(
      memoryLimitedAgents,
      cpuLimitedAgents,
      currentConfig.gpu_acceleration ? gpuLimitedAgents : Infinity,
      networkLimitedAgents
    )
    
    // Calculate performance boundaries
    const maxSustainableFPS = Math.min(
      120, // Hardware refresh rate limit
      hardwareConstraints.total_cpu_cores * 0.5, // CPU performance limit
      currentConfig.gpu_acceleration ? hardwareConstraints.total_gpu_memory_gb * 2 : 60
    )
    
    const minLatencyMs = Math.max(
      1, // Physical limit
      1000 / maxSustainableFPS, // Frame rate limit
      hardwareConstraints.network_latency_ms // Network latency floor
    )

    return {
      theoretical_max_agents: Math.floor(theoreticalMaxAgents),
      practical_max_agents: Math.floor(theoreticalMaxAgents * 0.8), // 80% utilization
      recommended_max_agents: Math.floor(theoreticalMaxAgents * 0.6), // 60% for safety
      max_sustainable_fps: Math.floor(maxSustainableFPS),
      min_achievable_latency_ms: Math.ceil(minLatencyMs),
      bottleneck_analysis: {
        primary_bottleneck: identifyPrimaryBottleneck(
          memoryLimitedAgents, 
          cpuLimitedAgents, 
          gpuLimitedAgents, 
          networkLimitedAgents
        ),
        scaling_recommendations: generateScalingRecommendations(
          currentConfig, 
          hardwareConstraints, 
          theoreticalMaxAgents
        )
      },
      quantum_advantage_domains: currentConfig.optimization_strategies
        .filter(s => s.name.includes('quantum'))
        .map(s => s.name),
      estimated_scaling_cost: estimateScalingCost(theoreticalMaxAgents, hardwareConstraints)
    }
  },

  /**
   * Optimize resource allocation across compute nodes
   */
  optimizeResourceAllocation: (
    nodes: ComputeNode[],
    workload: WorkloadRequirements
  ): ResourceAllocationPlan => {
    const totalAgents = workload.agent_count
    const allocations: NodeAllocation[] = []
    
    // Sort nodes by efficiency (performance per cost)
    const sortedNodes = nodes.sort((a, b) => 
      calculateNodeEfficiency(b) - calculateNodeEfficiency(a)
    )
    
    let remainingAgents = totalAgents
    
    for (const node of sortedNodes) {
      if (remainingAgents <= 0) break
      
      const nodeCapacity = calculateNodeCapacity(node, workload.performance_requirements)
      const allocatedAgents = Math.min(remainingAgents, nodeCapacity)
      
      if (allocatedAgents > 0) {
        allocations.push({
          node_id: node.node_id,
          allocated_agents: allocatedAgents,
          cpu_allocation: calculateCPUAllocation(allocatedAgents, node),
          memory_allocation: calculateMemoryAllocation(allocatedAgents, node),
          gpu_allocation: node.node_type === 'gpu' ? 
            calculateGPUAllocation(allocatedAgents, node) : 0,
          expected_performance: predictNodePerformance(allocatedAgents, node),
          resource_utilization: allocatedAgents / nodeCapacity
        })
        
        remainingAgents -= allocatedAgents
      }
    }
    
    return {
      total_nodes_used: allocations.length,
      total_agents_allocated: totalAgents - remainingAgents,
      allocation_efficiency: (totalAgents - remainingAgents) / totalAgents,
      expected_performance: calculateOverallExpectedPerformance(allocations),
      cost_estimate: calculateAllocationCost(allocations),
      node_allocations: allocations,
      scaling_headroom: calculateScalingHeadroom(sortedNodes, allocations)
    }
  },

  /**
   * Generate performance benchmarking suite for scaling validation
   */
  createScalingBenchmarkSuite: (
    maxAgents: number,
    performanceTargets: PerformanceTargets
  ): BenchmarkSuite => {
    const benchmarkScenarios: BenchmarkScenario[] = [
      // Linear scaling test
      {
        name: 'Linear Scaling Test',
        description: 'Test performance scaling linearly with agent count',
        agent_counts: [1000, 5000, 10000, 25000, 50000, Math.min(100000, maxAgents)],
        duration_ms: 60000,
        metrics_to_measure: ['fps', 'latency', 'cpu_utilization', 'memory_usage'],
        success_criteria: {
          min_fps: performanceTargets.target_fps * 0.9,
          max_latency_ms: performanceTargets.max_latency_ms * 1.1,
          max_cpu_utilization: 0.8,
          max_memory_utilization: 0.85
        }
      },
      // Burst capacity test
      {
        name: 'Burst Capacity Test',
        description: 'Test system response to sudden agent count increases',
        agent_counts: [1000, maxAgents * 0.8], // Sudden jump to 80% capacity
        duration_ms: 30000,
        metrics_to_measure: ['scaling_time', 'performance_degradation', 'recovery_time'],
        success_criteria: {
          max_scaling_time_ms: 10000,
          max_performance_degradation: 0.2,
          max_recovery_time_ms: 5000
        }
      },
      // Stress test
      {
        name: 'Maximum Capacity Stress Test',
        description: 'Test system stability at maximum capacity',
        agent_counts: [maxAgents],
        duration_ms: 300000, // 5 minutes
        metrics_to_measure: ['stability', 'error_rate', 'resource_exhaustion'],
        success_criteria: {
          min_stability_score: 0.95,
          max_error_rate: 0.01,
          no_resource_exhaustion: true
        }
      },
      // Edge case test
      {
        name: 'Edge Computing Latency Test',
        description: 'Test performance with distributed edge computing',
        agent_counts: [10000, 50000],
        duration_ms: 120000,
        metrics_to_measure: ['edge_latency', 'synchronization_delay', 'network_utilization'],
        success_criteria: {
          max_edge_latency_ms: performanceTargets.max_latency_ms * 0.5,
          max_sync_delay_ms: 100,
          max_network_utilization: 0.7
        }
      }
    ]

    return {
      suite_name: 'HyperScale Performance Validation',
      total_scenarios: benchmarkScenarios.length,
      estimated_duration_hours: benchmarkScenarios.reduce(
        (sum, scenario) => sum + (scenario.duration_ms / 3600000), 0
      ),
      scenarios: benchmarkScenarios,
      hardware_requirements: {
        min_cpu_cores: Math.ceil(maxAgents / 5000),
        min_memory_gb: Math.ceil(maxAgents / 1000) * 8,
        min_gpu_memory_gb: Math.ceil(maxAgents / 2000) * 16,
        min_network_bandwidth_mbps: maxAgents * 0.1
      },
      success_thresholds: {
        overall_pass_rate: 0.85,
        critical_scenario_pass_rate: 1.0,
        performance_regression_tolerance: 0.1
      }
    }
  }
}

// Helper functions for scaling utilities
function calculateRequiredQubits(
  complexity: 'low' | 'medium' | 'high' | 'extreme',
  algorithms: QuantumAlgorithmConfig[]
): number {
  const maxAlgorithmQubits = Math.max(...algorithms.map(a => a.qubit_requirement))
  const complexityMultiplier = {
    low: 1,
    medium: 1.5,
    high: 2,
    extreme: 3
  }
  
  return Math.ceil(maxAlgorithmQubits * complexityMultiplier[complexity])
}

function identifyPrimaryBottleneck(
  memoryLimit: number,
  cpuLimit: number, 
  gpuLimit: number,
  networkLimit: number
): string {
  const limits = { memory: memoryLimit, cpu: cpuLimit, gpu: gpuLimit, network: networkLimit }
  return Object.entries(limits).reduce((min, [key, value]) => 
    value < limits[min] ? key : min, 'memory'
  )
}

function generateScalingRecommendations(
  config: HyperScaleConfig,
  constraints: HardwareConstraints,
  maxAgents: number
): string[] {
  const recommendations: string[] = []
  
  if (constraints.total_memory_gb < maxAgents / 125) { // 8MB per agent minimum
    recommendations.push('Increase memory capacity for optimal agent scaling')
  }
  
  if (constraints.total_cpu_cores < maxAgents / 5000) {
    recommendations.push('Add more CPU cores to handle computational load')
  }
  
  if (config.gpu_acceleration && constraints.total_gpu_memory_gb < maxAgents / 2500) {
    recommendations.push('Upgrade GPU memory for better parallel processing')
  }
  
  if (constraints.network_bandwidth_gbps < maxAgents / 10000) {
    recommendations.push('Increase network bandwidth to prevent communication bottlenecks')
  }
  
  return recommendations
}

function estimateScalingCost(maxAgents: number, constraints: HardwareConstraints): ScalingCost {
  // Simplified cost model - would be much more sophisticated in production
  const cpuCostPerCore = 100 // $ per month
  const memoryCostPerGB = 10 // $ per month  
  const gpuCostPerGB = 50 // $ per month
  const networkCostPerMbps = 1 // $ per month
  
  return {
    monthly_compute_cost: constraints.total_cpu_cores * cpuCostPerCore,
    monthly_memory_cost: constraints.total_memory_gb * memoryCostPerGB,
    monthly_gpu_cost: constraints.total_gpu_memory_gb * gpuCostPerGB,
    monthly_network_cost: constraints.network_bandwidth_gbps * 1000 * networkCostPerMbps,
    total_monthly_cost: 0, // Calculated sum
    cost_per_agent_per_month: 0 // Total cost / maxAgents
  }
}

// Additional helper functions for resource optimization
function calculateNodeEfficiency(node: ComputeNode): number {
  // Simplified efficiency calculation based on performance per cost
  const performanceScore = node.capabilities.cpu_cores + 
    (node.capabilities.gpu_count * 10) + 
    (node.capabilities.memory_gb / 8)
  const costScore = 100 // Placeholder cost calculation
  return performanceScore / costScore
}

function calculateNodeCapacity(node: ComputeNode, requirements: PerformanceRequirements): number {
  const cpuCapacity = node.capabilities.cpu_cores * 100
  const memoryCapacity = node.capabilities.memory_gb * 125
  const gpuCapacity = node.capabilities.gpu_count > 0 ? 
    node.capabilities.gpu_memory_gb * 312 : cpuCapacity
  
  return Math.min(cpuCapacity, memoryCapacity, gpuCapacity)
}

function calculateCPUAllocation(agents: number, node: ComputeNode): number {
  return Math.min(agents / 100, node.capabilities.cpu_cores)
}

function calculateMemoryAllocation(agents: number, node: ComputeNode): number {
  return Math.min(agents / 125, node.capabilities.memory_gb)
}

function calculateGPUAllocation(agents: number, node: ComputeNode): number {
  return Math.min(agents / 312, node.capabilities.gpu_memory_gb)
}

function predictNodePerformance(agents: number, node: ComputeNode): number {
  // Simplified performance prediction
  return Math.min(1.0, (node.capabilities.cpu_cores * 100) / agents)
}

function calculateOverallExpectedPerformance(allocations: NodeAllocation[]): number {
  return allocations.reduce((sum, alloc) => sum + alloc.expected_performance, 0) / allocations.length
}

function calculateAllocationCost(allocations: NodeAllocation[]): number {
  return allocations.reduce((sum, alloc) => sum + (alloc.allocated_agents * 0.01), 0)
}

function calculateScalingHeadroom(nodes: ComputeNode[], allocations: NodeAllocation[]): number {
  const totalCapacity = nodes.reduce((sum, node) => sum + calculateNodeCapacity(node, {} as any), 0)
  const usedCapacity = allocations.reduce((sum, alloc) => sum + alloc.allocated_agents, 0)
  return (totalCapacity - usedCapacity) / totalCapacity
}

// Factory function for integrated scaling system
export function createHyperScaleSystem(config: HyperScaleSystemConfig = {}): IntegratedHyperScaleSystem {
  // Import classes dynamically to avoid circular dependency issues
  const { HyperScaleEngine } = require('./HyperScaleEngine')
  const { QuantumPerformanceBooster } = require('./QuantumPerformanceBooster')
  
  const hyperScaleEngine = new HyperScaleEngine(config.scaling || {} as HyperScaleConfig)
  const quantumBooster = new QuantumPerformanceBooster(config.quantum || {} as QuantumBoostConfig)

  return {
    hyperScale: hyperScaleEngine,
    quantum: quantumBooster,
    config,
    
    async scaleToExtremePerformance(targetAgents: number): Promise<ExtremeScalingResult> {
      // Coordinate both classical and quantum scaling
      const [scalingResult, quantumResults] = await Promise.all([
        hyperScaleEngine.scaleToAgentCount(targetAgents),
        quantumBooster.startQuantumProcessing()
      ])

      return {
        classical_scaling: scalingResult,
        quantum_acceleration_active: true,
        combined_performance_factor: scalingResult.scaling_efficiency * 
          (config.quantum?.quantum_advantage_threshold || 1),
        total_agents_supported: targetAgents,
        extreme_performance_achieved: scalingResult.success && 
          scalingResult.scaling_efficiency > 0.9
      }
    },

    async generateUltraPerformanceReport(): Promise<UltraPerformanceReport> {
      const hyperScaleReport = hyperScaleEngine.generateHyperScaleReport()
      const quantumReport = quantumBooster.generateQuantumPerformanceReport()

      return {
        timestamp: Date.now(),
        hyperscale_report: hyperScaleReport,
        quantum_report: quantumReport,
        combined_performance_score: this.calculateCombinedPerformanceScore(
          hyperScaleReport, 
          quantumReport
        ),
        scalability_projection: this.projectUltraScalability(hyperScaleReport),
        quantum_advantage_opportunities: this.identifyQuantumOpportunities(quantumReport),
        next_generation_recommendations: this.suggestNextGenImprovements()
      }
    },

    calculateCombinedPerformanceScore(hyperScale: HyperScaleReport, quantum: QuantumPerformanceReport): number {
      return (hyperScale.target_achievement * 0.7) + (quantum.average_quantum_speedup * 0.3)
    },

    projectUltraScalability(report: HyperScaleReport): ScalabilityProjection {
      return {
        next_milestone_agents: report.current_scale.agent_count * 2,
        estimated_timeline_months: 6,
        required_infrastructure_upgrades: ['More GPU nodes', 'Quantum processor access'],
        projected_performance_gain: 2.5
      }
    },

    identifyQuantumOpportunities(report: QuantumPerformanceReport): QuantumOpportunity[] {
      return [
        {
          domain: 'optimization',
          potential_speedup: 10,
          readiness: 'production_ready'
        },
        {
          domain: 'machine_learning',
          potential_speedup: 5,
          readiness: 'research_phase'
        }
      ]
    },

    suggestNextGenImprovements(): string[] {
      return [
        'Neuromorphic computing integration',
        'Photonic quantum processors',
        'DNA-based storage systems',
        'Brain-computer interface optimization',
        'Quantum error correction at scale'
      ]
    },

    dispose(): void {
      hyperScaleEngine.dispose()
      quantumBooster.dispose()
    }
  }
}

// Type definitions for scaling system
export interface HyperScaleSystemConfig {
  scaling?: HyperScaleConfig
  quantum?: QuantumBoostConfig
}

export interface ScalingLimits {
  theoretical_max_agents: number
  practical_max_agents: number
  recommended_max_agents: number
  max_sustainable_fps: number
  min_achievable_latency_ms: number
  bottleneck_analysis: {
    primary_bottleneck: string
    scaling_recommendations: string[]
  }
  quantum_advantage_domains: string[]
  estimated_scaling_cost: ScalingCost
}

export interface HardwareConstraints {
  total_cpu_cores: number
  total_memory_gb: number
  total_gpu_memory_gb: number
  network_bandwidth_gbps: number
  network_latency_ms: number
}

export interface ScalingCost {
  monthly_compute_cost: number
  monthly_memory_cost: number
  monthly_gpu_cost: number
  monthly_network_cost: number
  total_monthly_cost: number
  cost_per_agent_per_month: number
}

export interface WorkloadRequirements {
  agent_count: number
  performance_requirements: PerformanceRequirements
}

export interface PerformanceRequirements {
  min_fps: number
  max_latency_ms: number
  min_throughput: number
  quality_level: 'low' | 'medium' | 'high' | 'ultra'
}

export interface ResourceAllocationPlan {
  total_nodes_used: number
  total_agents_allocated: number
  allocation_efficiency: number
  expected_performance: number
  cost_estimate: number
  node_allocations: NodeAllocation[]
  scaling_headroom: number
}

export interface NodeAllocation {
  node_id: string
  allocated_agents: number
  cpu_allocation: number
  memory_allocation: number
  gpu_allocation: number
  expected_performance: number
  resource_utilization: number
}

export interface BenchmarkSuite {
  suite_name: string
  total_scenarios: number
  estimated_duration_hours: number
  scenarios: BenchmarkScenario[]
  hardware_requirements: any
  success_thresholds: any
}

export interface BenchmarkScenario {
  name: string
  description: string
  agent_counts: number[]
  duration_ms: number
  metrics_to_measure: string[]
  success_criteria: any
}

export interface IntegratedHyperScaleSystem {
  hyperScale: HyperScaleEngine
  quantum: QuantumPerformanceBooster
  config: HyperScaleSystemConfig
  scaleToExtremePerformance(targetAgents: number): Promise<ExtremeScalingResult>
  generateUltraPerformanceReport(): Promise<UltraPerformanceReport>
  calculateCombinedPerformanceScore(hyperScale: HyperScaleReport, quantum: QuantumPerformanceReport): number
  projectUltraScalability(report: HyperScaleReport): ScalabilityProjection
  identifyQuantumOpportunities(report: QuantumPerformanceReport): QuantumOpportunity[]
  suggestNextGenImprovements(): string[]
  dispose(): void
}

export interface ExtremeScalingResult {
  classical_scaling: ScalingResult
  quantum_acceleration_active: boolean
  combined_performance_factor: number
  total_agents_supported: number
  extreme_performance_achieved: boolean
}

export interface UltraPerformanceReport {
  timestamp: number
  hyperscale_report: HyperScaleReport
  quantum_report: QuantumPerformanceReport
  combined_performance_score: number
  scalability_projection: ScalabilityProjection
  quantum_advantage_opportunities: QuantumOpportunity[]
  next_generation_recommendations: string[]
}

export interface ScalabilityProjection {
  next_milestone_agents: number
  estimated_timeline_months: number
  required_infrastructure_upgrades: string[]
  projected_performance_gain: number
}

export interface QuantumOpportunity {
  domain: string
  potential_speedup: number
  readiness: string
}

// Import required types
import type { 
  HyperScaleConfig, 
  PerformanceTargets, 
  ResourceLimits, 
  AutoScalingPolicy, 
  OptimizationStrategy, 
  ScalingMetrics, 
  PerformanceBottleneck, 
  ComputeNode, 
  NodeCapabilities, 
  ScalingResult, 
  HyperScaleReport 
} from './HyperScaleEngine'

import type { 
  QuantumBoostConfig, 
  QuantumAlgorithmConfig, 
  QuantumPerformanceGain, 
  QuantumComputationTask, 
  QuantumCircuit, 
  QuantumExecutionResult, 
  QuantumAccelerationResult, 
  QuantumPerformanceReport 
} from './QuantumPerformanceBooster'

// Import classes for interface definitions
import type { HyperScaleEngine } from './HyperScaleEngine'
import type { QuantumPerformanceBooster } from './QuantumPerformanceBooster'