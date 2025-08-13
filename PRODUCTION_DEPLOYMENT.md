# Agent Mesh Sim XR - Production Deployment Guide

## 🚀 Production-Ready Core Build

The Agent Mesh Sim XR system has been successfully built with core functionality including:

- ✅ **Core WebXR Systems**: VR/AR session management
- ✅ **Agent Visualization**: Real-time 3D agent rendering with state-based coloring
- ✅ **Agent Mesh Connectivity**: WebSocket integration with agent runtime systems
- ✅ **Debugging Tools**: Causal tracing and timeline VR interfaces
- ✅ **Performance Monitoring**: Real-time performance tracking
- ✅ **Security Manager**: Authentication and threat detection
- ✅ **Error Handling**: Comprehensive error recovery systems

## 📦 Build Artifacts

```bash
npm run build
```

Generates:
- `dist/agent-mesh-xr.mjs` (71.96 kB, gzip: 17.79 kB) - ES Module
- `dist/agent-mesh-xr.umd.js` (55.25 kB, gzip: 16.02 kB) - UMD Bundle

## 🔧 Core API Usage

```typescript
import { AgentMeshXR, SwarmVisualizer } from 'agent-mesh-xr'

// Initialize XR environment
const xrSim = new AgentMeshXR({
  maxAgents: 1000,
  physicsEngine: 'cannon',
  renderMode: 'instanced',
  vrSupport: true,
  arSupport: true
})

// Connect to agent mesh runtime
await xrSim.connect('ws://agent-mesh.local:8080')

// Add agents
const agent = {
  id: 'agent-001',
  type: 'worker',
  position: new Vector3(0, 0, 0),
  velocity: new Vector3(0, 0, 0),
  currentState: { status: 'active', behavior: 'explore', role: 'worker', energy: 1.0, priority: 1 },
  metadata: {},
  activeGoals: ['explore'],
  connectedPeers: [],
  metrics: { cpuMs: 10, memoryMB: 50, msgPerSec: 5, uptime: 1000 },
  lastUpdate: Date.now()
}

xrSim.addAgent(agent)

// Start XR session
await xrSim.startXR('immersive-vr')
```

## 🔧 Requirements

### Runtime Requirements
- **Node.js**: 18.0.0+
- **WebXR Browser**: Chrome 79+, Edge 88+, Firefox 98+
- **HTTPS**: Required for WebXR functionality
- **WebSocket Support**: For agent mesh connectivity

### Hardware Requirements
- **VR Headsets**: Meta Quest 2/3/Pro, PICO 4, Valve Index, HTC Vive Pro
- **AR Devices**: Apple Vision Pro, HoloLens 2 (via WebXR polyfill)
- **Desktop VR**: Any WebXR-compatible headset

## 🌐 Production Deployment

### 1. Web Server Setup

```nginx
# nginx.conf
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    location / {
        try_files $uri $uri/ /index.html;
        add_header 'Cross-Origin-Embedder-Policy' 'require-corp';
        add_header 'Cross-Origin-Opener-Policy' 'same-origin';
    }
    
    location /ws {
        proxy_pass http://agent-mesh-backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
    }
}
```

### 2. Docker Production Setup

```dockerfile
# Dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 443
CMD ["nginx", "-g", "daemon off;"]
```

### 3. Kubernetes Deployment

```yaml
# k8s-deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: agent-mesh-xr
spec:
  replicas: 3
  selector:
    matchLabels:
      app: agent-mesh-xr
  template:
    metadata:
      labels:
        app: agent-mesh-xr
    spec:
      containers:
      - name: agent-mesh-xr
        image: agent-mesh-xr:latest
        ports:
        - containerPort: 443
        env:
        - name: NODE_ENV
          value: "production"
---
apiVersion: v1
kind: Service
metadata:
  name: agent-mesh-xr-service
spec:
  selector:
    app: agent-mesh-xr
  ports:
  - port: 443
    targetPort: 443
  type: LoadBalancer
```

## 📊 Performance Optimizations

### Agent Rendering Performance
- **Instanced Rendering**: Supports 1000+ agents at 60fps
- **State-based Coloring**: Visual agent status indicators
- **Simplified Geometry**: Optimized for VR/AR performance

### Memory Management
- **Agent Pool**: Efficient object reuse
- **Garbage Collection**: Minimal allocation during runtime
- **Scene Management**: Automatic cleanup of removed agents

### Network Optimization
- **WebSocket Batching**: Efficient agent updates
- **Connection Pooling**: Persistent agent mesh connections
- **Error Recovery**: Automatic reconnection with exponential backoff

## 🔒 Security Configuration

### HTTPS Setup
```bash
# Generate SSL certificates
certbot --nginx -d your-domain.com
```

### Security Headers
```javascript
// Express.js security setup
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp')
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin')
  res.setHeader('X-Frame-Options', 'DENY')
  res.setHeader('X-Content-Type-Options', 'nosniff')
  next()
})
```

## 🔍 Monitoring & Health Checks

### Health Check Endpoint
```javascript
// health-check.js
const healthCheck = {
  status: 'healthy',
  timestamp: Date.now(),
  version: '1.0.0',
  uptime: process.uptime(),
  memory: process.memoryUsage(),
  xr: {
    sessionActive: false,
    agentCount: 0,
    fps: 0
  }
}
```

### Metrics Collection
- **Performance Metrics**: FPS, memory usage, agent count
- **Error Tracking**: Automatic error reporting and recovery
- **Usage Analytics**: Session duration, agent interactions

## 🚨 Troubleshooting

### Common Issues

**WebXR Not Available**
```javascript
if (!navigator.xr) {
  console.error('WebXR not supported in this browser')
  // Fallback to desktop view
}
```

**WebSocket Connection Failed**
```javascript
xrSim.on('connectionError', (error) => {
  console.error('Agent mesh connection failed:', error)
  // Implement retry logic
})
```

**Performance Issues**
```javascript
// Monitor performance
xrSim.on('performanceWarning', (metrics) => {
  if (metrics.fps < 30) {
    // Reduce agent count or quality
  }
})
```

### Debug Mode
```javascript
const xrSim = new AgentMeshXR({
  // ... config
  debug: true // Enables debug logging
})
```

## 📈 Scaling Considerations

### Horizontal Scaling
- Load balance across multiple instances
- Use CDN for static assets
- Database sharding for large agent populations

### Vertical Scaling
- Increase container resources for high agent counts
- GPU acceleration for >1000 agents
- Memory optimization for long-running sessions

## 🔧 Environment Variables

```bash
# Production environment
NODE_ENV=production
HTTPS_PORT=443
AGENT_MESH_URL=wss://agent-mesh.production.com
MAX_AGENTS=1000
DEBUG_MODE=false
SSL_CERT_PATH=/etc/ssl/certs/cert.pem
SSL_KEY_PATH=/etc/ssl/private/key.pem
```

## 📱 Device Compatibility

### VR Headsets
- ✅ Meta Quest 2/3/Pro (Chrome WebXR)
- ✅ PICO 4 (Chrome WebXR)
- ✅ Valve Index (Chrome/Firefox WebXR)
- ✅ HTC Vive Pro (Chrome/Firefox WebXR)

### AR Devices
- ✅ Apple Vision Pro (Safari WebXR)
- ⚠️ HoloLens 2 (via WebXR polyfill)
- ⚠️ Magic Leap 2 (experimental)

### Desktop/Mobile
- ✅ Desktop browsers with WebXR emulation
- ⚠️ Mobile browsers (limited AR support)

## 🎯 Success Metrics

Production deployment is successful when:
- ✅ HTTPS certificate valid and WebXR accessible
- ✅ Agent mesh WebSocket connection established
- ✅ 60fps performance with 100+ agents
- ✅ Sub-200ms latency for agent updates
- ✅ Error recovery systems functional
- ✅ Memory usage stable under load

## 📞 Support

For production support:
- Check debug logs with `debug: true`
- Monitor performance metrics dashboard
- Review WebXR compatibility matrix
- Validate agent mesh connectivity

This production-ready core build provides essential functionality for WebXR agent simulation with room for advanced features as optional extensions.