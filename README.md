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
  includeUI:
