# Agent-Mesh-Sim-XR 🕸️🥽🤖

[![TypeScript](https://img.shields.io/badge/TypeScript-4.9+-blue.svg)](https://www.typescriptlang.org/)
[![WebXR](https://img.shields.io/badge/WebXR-1.0-green.svg)](https://immersiveweb.dev/)
[![License](https://img.shields.io/badge/License-MIT-orange.svg)](LICENSE)
[![Medium](https://img.shields.io/badge/Blog-Medium-black.svg)](https://medium.com/@yourusername)

WebXR-based simulator for thousand-agent swarms, integrating with agent-mesh-federated-runtime and adding VR debugging with causal trace-rewind capabilities.

## 🌟 Key Features

- **Massive Scale**: Visualize and debug 1000+ agent swarms in VR/AR
- **Causal Debugging**: Rewind time and trace causality chains
- **Real-time Metrics**: Performance overlays and agent state inspection  
- **Collaborative Debug**: Multi-user VR debugging sessions
- **Cross-Platform**: Works on Quest, Vision Pro, and desktop VR
- **Integration Ready**: Direct connection to production agent systems

## 🚀 Quick Start

### Installation

```bash
# Install package
npm install agent-mesh-sim-xr

# Or with yarn
yarn add agent-mesh-sim-xr

# Development setup
git clone https://github.com/yourusername/Agent-Mesh-Sim-XR.git
cd Agent-Mesh-Sim-XR
npm install
npm run dev
```

### Basic Usage

```typescript
import { AgentMeshXR, SwarmVisualizer } from 'agent-mesh-sim-xr';

// Initialize XR environment
const xrSim = new AgentMeshXR({
  maxAgents: 5000,
  physicsEngine: 'rapier', // or 'cannon', 'matter'
  renderMode: 'instanced',
  vrSupport: true,
  arSupport: true
});

// Connect to agent mesh runtime
await xrSim.connect('ws://agent-mesh.local:8080');

// Create swarm visualization
const swarm = new SwarmVisualizer({
  agentModel: 'geometric', // or 'avatar', 'particle'
  colorScheme: 'byState',
  trailLength: 100,
  clusterDetection: true
});

// Start XR session
xrSim.startXR({
  mode: 'immersive-vr',
  referenceSpace: 'local-floor',
  controllers: true,
  handTracking: true
});

// Handle agent updates
xrSim.on('agentUpdate', (agents) => {
  swarm.updateAgents(agents);
});

// Enable time controls
xrSim.enableTimeControl({
  maxRewind: 3600, // seconds
  recordInterval: 0.1,
  causalTracking: true
});
```

## 🏗️ Architecture

```
agent-mesh-sim-xr/
├── src/
│   ├── core/               # Core XR systems
│   │   ├── xr-manager.ts   # WebXR session management
│   │   ├── renderer.ts     # Three.js/Babylon renderer
│   │   ├── physics.ts      # Physics simulation
│   │   └── networking.ts   # Agent mesh connection
│   ├── visualization/      # Visualization components
│   │   ├── agents/         # Agent representations
│   │   ├── swarms/         # Swarm patterns
│   │   ├── metrics/        # Performance overlays
│   │   └── timeline/       # Time control UI
│   ├── interaction/        # XR interactions
│   │   ├── controllers.ts  # VR controller input
│   │   ├── hands.ts        # Hand tracking
│   │   ├── gestures.ts     # Gesture recognition
│   │   └── spatial-ui.ts   # 3D UI components
│   ├── debugging/          # Debug tools
│   │   ├── causal-trace.ts # Causality tracking
│   │   ├── rewind.ts       # Time rewind system
│   │   ├── inspector.ts    # Agent state inspector
│   │   └── profiler.ts     # Performance profiler
│   ├── collaboration/      # Multi-user features
│   │   ├── session.ts      # Shared sessions
│   │   ├── avatars.ts      # User avatars
│   │   ├── voice.ts        # Spatial audio
│   │   └── annotations.ts  # Shared annotations
│   └── integrations/       # External integrations
│       ├── agent-mesh/     # Agent mesh runtime
│       ├── langchain/      # LangChain agents
│       ├── autogen/        # AutoGen agents
│       └── custom/         # Custom frameworks
├── shaders/                # GPU shaders
│   ├── agent-instance.glsl # Instanced rendering
│   ├── trail-render.glsl   # Motion trails
│   └── cluster-heat.glsl   # Heatmap visualization
├── assets/                 # 3D models and textures
└── examples/               # Example applications
    ├── swarm-robotics/
    ├── market-simulation/
    ├── social-dynamics/
    └── neural-networks/
```

## 🥽 VR Debugging Interface

### Spatial Agent Inspector

```typescript
import { SpatialInspector, AgentPanel } from 'agent-mesh-sim-xr';

// Create floating inspector panel
const inspector = new SpatialInspector({
  followUser: true,
  anchorDistance: 1.5, // meters
  autoHide: false
});

// Inspect agent on controller point
xrSim.onControllerSelect((controller) => {
  const agent = swarm.getAgentAtPosition(controller.position);
  
  if (agent) {
    // Show agent details panel
    const panel = new AgentPanel(agent);
    panel.addSection('State', {
      id: agent.id,
      type: agent.type,
      state: agent.currentState,
      goals: agent.activeGoals,
      memory: agent.memorySnapshot
    });
    
    panel.addSection('Connections', {
      incoming: agent.incomingMessages.length,
      outgoing: agent.outgoingMessages.length,
      peers: agent.connectedPeers
    });
    
    panel.addSection('Performance', {
      cpuTime: agent.metrics.cpuMs,
      memoryMB: agent.metrics.memoryMB,
      messageRate: agent.metrics.msgPerSec
    });
    
    inspector.showPanel(panel);
  }
});

// Voice commands for debugging
xrSim.enableVoiceCommands({
  "freeze all agents": () => swarm.pauseAll(),
  "resume simulation": () => swarm.resumeAll(),
  "highlight leaders": () => swarm.highlightByRole('leader'),
  "show message flow": () => swarm.visualizeMessages(true),
  "cluster by behavior": () => swarm.applyClustering('behavior')
});
```

### Causal Trace Visualization

```typescript
import { CausalTracer, TimelineVR } from 'agent-mesh-sim-xr';

// Initialize causal tracking
const tracer = new CausalTracer({
  maxHistorySize: 10000,
  trackMessages: true,
  trackStateChanges: true,
  trackDecisions: true
});

// Create VR timeline
const timeline = new TimelineVR({
  length: 10, // meters
  height: 2,
  position: { x: 0, y: 1, z: -3 }
});

// Trace causality from an event
xrSim.onAgentSelect((agent) => {
  // Find what caused this agent's current state
  const causalChain = tracer.traceCausality({
    agent: agent.id,
    state: agent.currentState,
    maxDepth: 10
  });
  
  // Visualize in 3D
  const visualization = tracer.visualizeCausalChain(causalChain, {
    layout: 'force-directed',
    showTimestamps: true,
    animateFlow: true,
    colors: {
      message: 0x00ff00,
      stateChange: 0xff0000,
      decision: 0x0000ff
    }
  });
  
  xrSim.scene.add(visualization);
  
  // Add to timeline
  timeline.addEvents(causalChain.events);
  timeline.focusOn(agent.stateChangeTime);
});

// Time rewind with causal highlighting
timeline.onScrub((timestamp) => {
  // Rewind simulation
  swarm.rewindTo(timestamp);
  
  // Highlight active causal chains
  const activeCausality = tracer.getActiveChains(timestamp);
  swarm.highlightAgents(activeCausality.affectedAgents);
  swarm.showMessageFlows(activeCausality.messages);
});
```

## 🎮 Interaction Systems

### Hand Tracking Controls

```typescript
import { HandGestureController } from 'agent-mesh-sim-xr';

const handControl = new HandGestureController();

// Define custom gestures
handControl.registerGesture('pinch_drag', {
  startCondition: (hand) => hand.isPinching(),
  updateCondition: (hand) => hand.pinchStrength > 0.8,
  onStart: (hand) => {
    const nearest = swarm.getNearestAgent(hand.position);
    hand.attachObject(nearest);
  },
  onUpdate: (hand, delta) => {
    if (hand.attachedObject) {
      hand.attachedObject.position.copy(hand.position);
    }
  },
  onEnd: (hand) => {
    hand.releaseObject();
  }
});

// Swarm control gestures
handControl.registerGesture('swarm_command', {
  gesture: 'open_palm',
  direction: 'forward',
  onTrigger: (hand) => {
    // Send all agents in cone toward palm direction
    const cone = hand.getForwardCone(45); // degrees
    swarm.getAgentsInVolume(cone).forEach(agent => {
      agent.setGoal(hand.position.add(hand.forward.multiplyScalar(5)));
    });
  }
});

// Two-handed zoom
handControl.registerBimanualGesture('zoom', {
  condition: (leftHand, rightHand) => 
    leftHand.isPinching() && rightHand.isPinching(),
  onUpdate: (leftHand, rightHand, delta) => {
    const distance = leftHand.position.distanceTo(rightHand.position);
    const scale = distance / this.lastDistance;
    swarm.scale(scale);
    this.lastDistance = distance;
  }
});
```

### Spatial UI Components

```typescript
import { SpatialUI, RadialMenu, Slider3D } from 'agent-mesh-sim-xr';

// Create floating control panel
const controlPanel = new SpatialUI.Panel({
  width: 0.5,
  height: 0.3,
  position: { x: 1, y: 1.5, z: -0.5 },
  billboarding: 'y-axis'
});

// Add controls
controlPanel.addSlider('Agent Speed', {
  min: 0,
  max: 10,
  value: swarm.agentSpeed,
  onChange: (value) => swarm.setAgentSpeed(value)
});

controlPanel.addToggle('Show Trails', {
  value: true,
  onChange: (enabled) => swarm.showTrails(enabled)
});

controlPanel.addDropdown('Visualization Mode', {
  options: ['default', 'heatmap', 'clustering', 'communication'],
  onChange: (mode) => swarm.setVisualizationMode(mode)
});

// Radial menu for quick actions
const radialMenu = new RadialMenu({
  triggerButton: 'a_button', // Oculus A button
  items: [
    { icon: '⏸️', label: 'Pause', action: () => swarm.pause() },
    { icon: '▶️', label: 'Play', action: () => swarm.resume() },
    { icon: '⏪', label: 'Rewind', action: () => timeline.rewind(10) },
    { icon: '📊', label: 'Stats', action: () => showStats() },
    { icon: '🔍', label: 'Inspect', action: () => enterInspectMode() },
    { icon: '📷', label: 'Capture', action: () => captureScene() }
  ]
});
```

## 📊 Performance Visualization

### Real-time Metrics Overlay

```typescript
import { MetricsOverlay, PerformanceProfiler } from 'agent-mesh-sim-xr';

// Create AR metrics overlay
const metrics = new MetricsOverlay({
  position: 'top-right',
  transparency: 0.7,
  fontSize: 0.02 // meters
});

// Track key metrics
metrics.addMetric('Total Agents', () => swarm.agentCount);
metrics.addMetric('Active Agents', () => swarm.activeCount);
metrics.addMetric('Messages/sec', () => swarm.messageRate);
metrics.addMetric('Simulation FPS', () => swarm.simulationFPS);
metrics.addMetric('Render FPS', () => xrSim.renderFPS);

// Performance profiler
const profiler = new PerformanceProfiler();

profiler.startProfiling({
  sampleRate: 60, // Hz
  metrics: ['cpu', 'gpu', 'memory', 'network']
});

// Visualize bottlenecks
profiler.on('bottleneck', (data) => {
  const warning = new SpatialUI.Alert({
    type: 'warning',
    message: `Performance bottleneck: ${data.component}`,
    details: `${data.metric} at ${data.value}`,
    position: 'center',
    duration: 5000
  });
  
  warning.show();
});

// 3D performance graph
const perfGraph = profiler.create3DGraph({
  width: 2,
  height: 1,
  depth: 0.1,
  position: { x: -2, y: 1.5, z: -1 },
  metrics: ['agentCount', 'cpuUsage', 'messageRate'],
  timeWindow: 60 // seconds
});
```

### Swarm Analytics Dashboard

```typescript
import { SwarmAnalytics, HolographicChart } from 'agent-mesh-sim-xr';

const analytics = new SwarmAnalytics(swarm);

// Create holographic dashboard
const dashboard = new HolographicChart.Dashboard({
  position: { x: 0, y: 1.5, z: -2 },
  size: { width: 3, height: 2 }
});

// Agent distribution heatmap
dashboard.addVisualization('heatmap', {
  data: () => analytics.getSpatialDistribution(),
  type: 'volumetric-heatmap',
  colorScale: 'viridis',
  updateRate: 5 // Hz
});

// Communication network graph  
dashboard.addVisualization('network', {
  data: () => analytics.getCommunicationGraph(),
  type: 'force-directed-3d',
  showMessageFlow: true,
  edgeThickness: 'byMessageCount'
});

// Behavior clustering
dashboard.addVisualization('clusters', {
  data: () => analytics.getBehaviorClusters(),
  type: 'scatter-3d',
  colorBy: 'cluster',
  sizeBy: 'influence',
  showConvexHull: true
});

// Time series metrics
dashboard.addVisualization('timeseries', {
  data: () => analytics.getTimeSeriesMetrics(),
  type: 'line-3d',
  metrics: ['convergence', 'diversity', 'efficiency'],
  timeWindow: 300 // seconds
});
```

## 🌐 Multi-User Collaboration

### Shared Debugging Sessions

```typescript
import { CollaborativeSession, Avatar, SpatialVoice } from 'agent-mesh-sim-xr';

// Create or join session
const session = new CollaborativeSession({
  roomId: 'debug-session-42',
  maxUsers: 8,
  voiceChat: true,
  persistence: true
});

// User avatar
const avatar = new Avatar({
  model: 'stylized', // or 'realistic', 'minimal'
  nameTag: true,
  expressionTracking: true
});

// Spatial voice chat
const voice = new SpatialVoice({
  echoCancellation: true,
  noiseSuppression: true,
  spatialRange: 10 // meters
});

// Shared annotations
session.on('userAnnotation', (annotation) => {
  const marker = new SpatialUI.Annotation({
    text: annotation.text,
    position: annotation.position,
    author: annotation.userId,
    color: annotation.color
  });
  
  xrSim.scene.add(marker);
});

// Synchronized debugging state
session.on('debugAction', (action) => {
  switch (action.type) {
    case 'pause':
      swarm.pause();
      break;
    case 'rewind':
      swarm.rewindTo(action.timestamp);
      break;
    case 'highlight':
      swarm.highlightAgents(action.agentIds);
      break;
  }
});

// Collaborative inspection
const sharedInspector = new SpatialInspector({
  collaborative: true,
  session: session
});

sharedInspector.on('agentSelected', (agent, userId) => {
  // Show who's inspecting what
  const indicator = new SpatialUI.Indicator({
    target: agent,
    color: session.getUserColor(userId),
    label: session.getUserName(userId)
  });
  
  indicators.set(userId, indicator);
});
```

## 🔌 Agent Framework Integration

### LangChain Integration

```typescript
import { LangChainConnector } from 'agent-mesh-sim-xr';

const langchain = new LangChainConnector({
  endpoint: 'http://langchain-server:8000',
  apiKey: process.env.LANGCHAIN_API_KEY
});

// Visualize LangChain agents
langchain.on('agentCreated', (agent) => {
  const visual = swarm.addAgent({
    id: agent.id,
    type: 'langchain',
    position: randomPosition(),
    metadata: {
      model: agent.model,
      temperature: agent.temperature,
      tools: agent.tools
    }
  });
  
  // Show thought process
  visual.showThoughtBubble(agent.thoughts);
});

// Trace tool usage
langchain.on('toolUse', (event) => {
  const beam = new VisualEffects.EnergyBeam({
    start: swarm.getAgent(event.agentId),
    end: getToolPosition(event.tool),
    color: getToolColor(event.tool),
    duration: 1000
  });
  
  xrSim.scene.add(beam);
});
```

### AutoGen Integration

```typescript
import { AutoGenConnector } from 'agent-mesh-sim-xr';

const autogen = new AutoGenConnector({
  workspace: '/path/to/autogen/workspace'
});

// Visualize AutoGen conversations
autogen.on('conversation', (conv) => {
  const circle = new SwarmFormation.Circle({
    center: getConversationPosition(conv.id),
    radius: 1,
    agents: conv.participants.map(p => swarm.getAgent(p.id))
  });
  
  // Animate speaking
  conv.on('message', (msg) => {
    const speaker = swarm.getAgent(msg.sender);
    speaker.animate('speaking');
    
    // Show message
    const bubble = new SpatialUI.SpeechBubble({
      text: msg.content,
      position: speaker.position.add(new Vector3(0, 0.5, 0)),
      duration: 3000
    });
  });
});
```

## 🎬 Scene Recording & Playback

```typescript
import { SceneRecorder, PlaybackControls } from 'agent-mesh-sim-xr';

const recorder = new SceneRecorder({
  captureRate: 60, // fps
  compression: 'h265',
  includeAudio: true,
  resolution: { width: 3840, height: 2160 }
});

// Record debugging session
recorder.startRecording({
  viewpoint: 'first-person', // or 'third-person', 'overview'
  includeUI: true,
  includeAnnotations: true,
  includeVoiceChat: true
});

// Playback controls in VR
const playback = new PlaybackControls({
  position: { x: 0, y: 0.8, z: -1 },
  style: 'holographic'
});

playback.on('seek', (timestamp) => {
  recorder.seekTo(timestamp);
  swarm.rewindTo(timestamp);
});

// Export for sharing
recorder.export({
  format: 'webm',
  annotations: 'embedded',
  chapters: recorder.autoDetectChapters()
});

## 📈 Performance Optimization

### Level-of-Detail System

```typescript
import { LODSystem, AgentLOD } from 'agent-mesh-sim-xr';

const lod = new LODSystem({
  distances: [5, 20, 50, 100], // meters
  updateRate: 10 // Hz
});

// Define LOD levels
lod.defineLOD(0, { // Closest
  model: 'high-poly',
  animations: true,
  trails: true,
  stateIndicators: true,
  updateRate: 60
});

lod.defineLOD(1, {
  model: 'medium-poly',
  animations: true,
  trails: false,
  stateIndicators: true,
  updateRate: 30
});

lod.defineLOD(2, {
  model: 'low-poly',
  animations: false,
  trails: false,
  stateIndicators: false,
  updateRate: 10
});

lod.defineLOD(3, { // Furthest
  model: 'billboard',
  animations: false,
  trails: false,
  stateIndicators: false,
  updateRate: 5
});

// Culling for massive swarms
const culling = new FrustumCulling({
  cellSize: 10, // meters
  maxVisibleAgents: 2000,
  priorityFunction: (agent) => {
    // Prioritize interesting agents
    return agent.activity * agent.influence * agent.anomalyScore;
  }
});
```

### GPU Instancing

```typescript
// Shader for instanced agent rendering
const agentShader = `
  // Vertex shader
  attribute vec3 offset;
  attribute vec4 color;
  attribute float scale;
  
  uniform float time;
  uniform mat4 viewMatrix;
  uniform mat4 projectionMatrix;
  
  varying vec4 vColor;
  
  void main() {
    vec3 transformed = position * scale + offset;
    
    // Simple animation
    transformed.y += sin(time + offset.x) * 0.1;
    
    gl_Position = projectionMatrix * viewMatrix * vec4(transformed, 1.0);
    vColor = color;
  }
`;

// Create instanced mesh for thousands of agents
const agentGeometry = new THREE.SphereGeometry(0.1, 8, 6);
const agentMaterial = new THREE.ShaderMaterial({
  vertexShader: agentShader,
  fragmentShader: fragmentShader,
  uniforms: {
    time: { value: 0 }
  }
});

const instancedMesh = new THREE.InstancedMesh(
  agentGeometry,
  agentMaterial,
  maxAgents
);

// Update instances efficiently
function updateInstances(agents: Agent[]) {
  const matrices = new Float32Array(agents.length * 16);
  const colors = new Float32Array(agents.length * 4);
  
  agents.forEach((agent, i) => {
    // Set position matrix
    tempMatrix.setPosition(agent.position);
    tempMatrix.toArray(matrices, i * 16);
    
    // Set color based on state
    const color = getStateColor(agent.state);
    colors[i * 4] = color.r;
    colors[i * 4 + 1] = color.g;
    colors[i * 4 + 2] = color.b;
    colors[i * 4 + 3] = 1.0;
  });
  
  instancedMesh.instanceMatrix.array = matrices;
  instancedMesh.instanceColor.array = colors;
  instancedMesh.instanceMatrix.needsUpdate = true;
  instancedMesh.instanceColor.needsUpdate = true;
}
```

## 🧪 Example Scenarios

### Swarm Robotics Debugging

```typescript
// Example: Debug drone swarm navigation
import { DroneSwarmScenario } from 'agent-mesh-sim-xr/examples';

const scenario = new DroneSwarmScenario({
  droneCount: 100,
  environment: 'urban',
  mission: 'search-and-rescue'
});

// Add obstacles
scenario.addBuildings(cityModel);
scenario.addWeather({ wind: [5, 0, 2], turbulence: 0.3 });

// Visualize sensor ranges
scenario.showSensorCones({
  lidar: { color: 0x00ff00, opacity: 0.2 },
  camera: { color: 0x0000ff, opacity: 0.1 },
  radio: { color: 0xffff00, opacity: 0.05 }
});

// Debug path planning
scenario.on('pathPlanned', (drone, path) => {
  const pathVis = new PathVisualization({
    path: path,
    color: drone.teamColor,
    animated: true,
    showWaypoints: true
  });
  
  scene.add(pathVis);
});

// Collision prediction
scenario.enableCollisionPrediction({
  timeHorizon: 5, // seconds
  showWarnings: true,
  autoAvoid: false // Let user see the problem
});
```

### Multi-Agent Market Simulation

```typescript
// Example: Visualize market dynamics
import { MarketSimulation } from 'agent-mesh-sim-xr/examples';

const market = new MarketSimulation({
  traders: 500,
  marketMakers: 10,
  assets: ['BTC', 'ETH', 'AAPL', 'GOOGL']
});

// 3D order book visualization
const orderBook = new OrderBook3D({
  position: { x: -2, y: 1, z: -2 },
  size: { width: 1, height: 2, depth: 1 },
  priceAxis: 'y',
  volumeAxis: 'z',
  timeAxis: 'x'
});

// Trace order flow
market.on('order', (order) => {
  const flow = new OrderFlow({
    from: market.getTrader(order.traderId),
    to: orderBook,
    type: order.type,
    size: order.size,
    price: order.price
  });
  
  flow.animate();
});

// Analyze trading strategies
const strategyAnalyzer = new StrategyVisualizer();
strategyAnalyzer.groupByStrategy(market.traders);
strategyAnalyzer.showPerformanceHalos();
strategyAnalyzer.traceProfitablePaths();
```

## 🛠️ Development Tools

### XR Debug Console

```typescript
import { XRDebugConsole } from 'agent-mesh-sim-xr';

const debugConsole = new XRDebugConsole({
  position: 'wrist-mounted',
  fontSize: 0.01,
  maxLines: 20,
  transparency: 0.8
});

// Log to VR console
debugConsole.log('Simulation started');
debugConsole.warn('High agent density detected');
debugConsole.error('Agent 42 in invalid state');

// Interactive REPL
debugConsole.enableREPL({
  context: {
    swarm: swarm,
    sim: xrSim,
    selected: () => inspector.selectedAgent
  }
});

// Execute commands in VR
debugConsole.on('command', async (cmd) => {
  try {
    const result = await eval(cmd);
    debugConsole.log(`> ${cmd}`);
    debugConsole.log(result);
  } catch (error) {
    debugConsole.error(error.message);
  }
});
```

### Performance Profiler

```typescript
const profiler = new XRProfiler({
  position: { x: 2, y: 1.5, z: -1 },
  mode: 'minimal' // or 'detailed'
});

profiler.addSection('Rendering', [
  'FPS',
  'Draw Calls', 
  'Triangles',
  'GPU Time'
]);

profiler.addSection('Simulation', [
  'Agent Updates/s',
  'Physics Steps/s',
  'Message Queue',
  'Memory Usage'
]);

profiler.addSection('Network', [
  'Latency',
  'Bandwidth',
  'Packet Loss',
  'Connected Peers'
]);

// Flame graph in VR
profiler.showFlameGraph({
  duration: 1000, // ms
  minTime: 0.1 // ms
});
```

## 📊 Export & Analysis

### Data Export

```typescript
import { DataExporter } from 'agent-mesh-sim-xr';

const exporter = new DataExporter();

// Export simulation data
const data = exporter.exportSimulation({
  format: 'parquet', // or 'csv', 'json', 'hdf5'
  include: {
    agentStates: true,
    messages: true,
    positions: true,
    metrics: true
  },
  timeRange: {
    start: session.startTime,
    end: session.endTime
  },
  sampling: {
    rate: 60, // Hz
    method: 'interpolate' // or 'nearest', 'aggregate'
  }
});

// Export for analysis tools
exporter.exportForPython(data, 'simulation_data.pkl');
exporter.exportForR(data, 'simulation_data.rds');
exporter.exportForMatlab(data, 'simulation_data.mat');

// Generate analysis notebook
exporter.generateNotebook({
  template: 'swarm-analysis',
  data: data,
  format: 'jupyter', // or 'observable', 'quarto'
  includeCode: true
});
```

## 🔒 Security & Privacy

### Secure Multi-User Sessions

```typescript
import { SecureSession } from 'agent-mesh-sim-xr';

const secure = new SecureSession({
  encryption: 'e2e', // End-to-end
  authentication: 'oauth2',
  provider: 'corporate-sso'
});

// Role-based access control
secure.setPermissions({
  roles: {
    admin: ['all'],
    developer: ['view', 'debug', 'modify'],
    observer: ['view']
  }
});

// Audit logging
secure.enableAuditLog({
  logLevel: 'all',
  storage: 's3://audit-logs/',
  retention: '90d'
});

// Data sanitization for screen recording
secure.enablePrivacyMode({
  blurSensitiveData: true,
  hideAgentIds: true,
  anonymizeMetrics: false
});
```

## 📚 Research & Citations

```bibtex
@inproceedings{agent_mesh_xr2025,
  title={Agent-Mesh-Sim-XR: Immersive Debugging for Large-Scale Multi-Agent Systems},
  author={Your Name et al.},
  booktitle={IEEE VR},
  year={2025}
}

@article{causal_debugging_vr2024,
  title={Causal Trace Analysis in Virtual Reality for Agent Swarm Debugging},
  author={Your Team},
  journal={IEEE Transactions on Visualization and Computer Graphics},
  year={2024}
}
```

## 🤝 Contributing

We welcome contributions in:
- New visualization techniques
- Agent framework integrations  
- Performance optimizations
- Interaction paradigms

See [CONTRIBUTING.md](CONTRIBUTING.md)

## 🎮 Supported Devices

- **Meta Quest 2/3/Pro**
- **Apple Vision Pro**
- **PICO 4**
- **Valve Index**
- **HTC Vive Pro**
- **Windows Mixed Reality**
- **WebXR-compatible browsers**

## 📄 License

MIT License - see [LICENSE](LICENSE)

## 🔗 Resources

- [Documentation](https://agent-mesh-sim-xr.dev)
- [Video Tutorials](https://youtube.com/agent-mesh-xr)
- [Discord Community](https://discord.gg/agent-mesh-xr)
- [Blog Post](https://medium.com/@yourusername/debugging-ai-swarms-in-vr)
