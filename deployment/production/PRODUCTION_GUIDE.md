# Agent Mesh Sim XR - Production Deployment Guide

## 🚀 Quick Start

This guide covers deploying Agent Mesh Sim XR in production environments with enterprise-grade reliability, security, and performance optimization.

## 📋 Prerequisites

### System Requirements
- **CPU**: Minimum 8 cores, Recommended 16+ cores
- **Memory**: Minimum 16GB RAM, Recommended 32GB+ RAM
- **GPU**: Optional but recommended for acceleration (NVIDIA GPU with CUDA support)
- **Storage**: 100GB+ SSD for optimal performance
- **Network**: Stable internet connection with low latency

### Software Requirements
- Docker 20.10+ and Docker Compose 2.0+
- Kubernetes 1.24+ (for K8s deployment)
- Node.js 18+ (for development builds)
- SSL certificates for HTTPS endpoints

## 🔧 Configuration

### 1. Environment Variables

Create a `.env` file in the project root:

```bash
# Core Configuration
NODE_ENV=production
PORT=3000
WS_PORT=8080
MAX_AGENTS=10000

# Network Configuration
NETWORK_ENDPOINT=wss://api.agent-mesh.com/ws
CORS_ORIGIN=https://your-domain.com

# Security Configuration
JWT_SECRET=your-super-secure-jwt-secret-here
SECURITY_ENABLED=true
RATE_LIMIT_REQUESTS=1000
RATE_LIMIT_WINDOW_MS=60000

# Database Configuration
POSTGRES_URL=postgresql://username:password@postgres:5432/agentmesh
REDIS_URL=redis://username:password@redis:6379
DB_PASSWORD=your-secure-db-password
REDIS_PASSWORD=your-secure-redis-password

# Monitoring & Logging
LOG_LEVEL=info
PERFORMANCE_MONITORING=true
METRICS_ENABLED=true
JAEGER_ENDPOINT=http://jaeger:14268/api/traces

# Performance Optimization
GPU_ACCELERATION=true
WORKER_THREADS=auto
MEMORY_LIMIT=2048
CACHE_TTL=3600

# Third-party Integrations
GRAFANA_PASSWORD=your-grafana-password
PROMETHEUS_RETENTION_DAYS=30
```

### 2. SSL Certificates

For HTTPS deployment, place your SSL certificates in `deployment/production/nginx/ssl/`:

```bash
deployment/production/nginx/ssl/
├── cert.pem
├── privkey.pem
└── chain.pem
```

## 🐳 Docker Deployment

### Option 1: Docker Compose (Recommended for single-node deployments)

```bash
# 1. Clone and setup
git clone https://github.com/your-org/Agent-Mesh-Sim-XR.git
cd Agent-Mesh-Sim-XR

# 2. Configure environment
cp .env.example .env
# Edit .env with your configuration

# 3. Build and deploy
docker-compose -f docker-compose.production.yml up -d

# 4. Verify deployment
docker-compose -f docker-compose.production.yml ps
docker-compose -f docker-compose.production.yml logs -f agent-mesh-xr
```

### Health Check Endpoints
- Application: `http://localhost:3000/health`
- Metrics: `http://localhost:3000/metrics`
- WebSocket: `ws://localhost:8080/ws`

## ☸️ Kubernetes Deployment

### Option 2: Kubernetes (Recommended for multi-node/high-availability)

```bash
# 1. Deploy namespace and configurations
kubectl apply -f k8s-deployment.yaml

# 2. Verify deployment
kubectl get pods -n agent-mesh-xr
kubectl get services -n agent-mesh-xr
kubectl get ingress -n agent-mesh-xr

# 3. Check logs
kubectl logs -f deployment/agent-mesh-xr -n agent-mesh-xr

# 4. Scale if needed
kubectl scale deployment agent-mesh-xr --replicas=5 -n agent-mesh-xr
```

### Ingress Configuration
Update `k8s-deployment.yaml` with your domain:
```yaml
spec:
  tls:
  - hosts:
    - your-domain.com  # Replace with your domain
    secretName: agent-mesh-xr-tls
  rules:
  - host: your-domain.com  # Replace with your domain
```

## 📊 Monitoring & Observability

### Prometheus Metrics
- **Application metrics**: `http://localhost:3000/metrics`
- **Prometheus UI**: `http://localhost:9090`
- **Custom dashboards**: Available in `deployment/production/grafana/dashboards/`

### Grafana Dashboards
- **Main Dashboard**: `http://localhost:3001` (admin/your-password)
- **Agent Performance**: Real-time agent metrics and visualization
- **System Health**: Infrastructure monitoring and alerts
- **Security Dashboard**: Threat detection and authentication metrics

### Key Metrics to Monitor
- **Agent Count**: Current active agents
- **Render FPS**: Real-time rendering performance
- **Memory Usage**: Application memory consumption
- **Network Latency**: WebSocket connection latency
- **Error Rates**: Application and network error frequencies
- **Security Events**: Threat detection and authentication failures

### Jaeger Tracing
- **Tracing UI**: `http://localhost:16686`
- Distributed tracing for debugging complex interactions
- Performance bottleneck identification

## 🔐 Security Configuration

### 1. Network Security
```bash
# Enable firewall
ufw enable
ufw allow 22/tcp   # SSH
ufw allow 80/tcp   # HTTP
ufw allow 443/tcp  # HTTPS
ufw allow 8080/tcp # WebSocket
```

### 2. Application Security
- **HTTPS Only**: All connections force HTTPS redirect
- **CORS Protection**: Configured for specific origins
- **Rate Limiting**: 1000 requests per minute per IP
- **Input Validation**: All inputs sanitized and validated
- **JWT Authentication**: Secure token-based authentication
- **Security Headers**: Comprehensive security headers implemented

### 3. Database Security
- **Encrypted Connections**: All DB connections use SSL/TLS
- **Strong Passwords**: Auto-generated secure passwords
- **Access Control**: Database access limited to application pods
- **Regular Backups**: Automated backup strategy

## 🚨 Alerting

### Alert Channels
Configure in `deployment/production/monitoring/alertmanager.yml`:

```yaml
global:
  slack_api_url: 'https://hooks.slack.com/your-webhook'
  smtp_smarthost: 'localhost:587'
  smtp_from: 'alerts@your-domain.com'

receivers:
  - name: 'critical-alerts'
    slack_configs:
      - channel: '#critical-alerts'
        title: 'Agent Mesh XR Critical Alert'
  
  - name: 'warning-alerts'
    email_configs:
      - to: 'devops@your-domain.com'
        subject: 'Agent Mesh XR Warning'
```

### Alert Types
- **Service Down**: Critical service unavailability
- **High Resource Usage**: CPU/Memory threshold breaches
- **Performance Degradation**: Slow response times or low FPS
- **Security Events**: Threat detection or authentication failures
- **Agent Failures**: High agent failure rates

## 🔄 Backup & Recovery

### Database Backups
```bash
# Automated PostgreSQL backup
docker exec postgres pg_dump -U postgres agentmesh > backup_$(date +%Y%m%d_%H%M%S).sql

# Redis backup
docker exec redis redis-cli BGSAVE
docker cp redis:/data/dump.rdb ./redis_backup_$(date +%Y%m%d_%H%M%S).rdb
```

### Application State
- **Configuration Backup**: Store all config files in version control
- **SSL Certificates**: Keep secure backups of certificates
- **Environment Variables**: Document all environment configurations

## 📈 Performance Optimization

### 1. Agent Scaling
```javascript
// Configure agent limits based on hardware
const config = {
  maxAgents: process.env.MAX_AGENTS || 10000,
  agentPoolSize: Math.ceil(maxAgents / 100),
  batchSize: Math.min(100, Math.ceil(maxAgents / 100)),
  updateFrequency: maxAgents > 5000 ? 30 : 60 // FPS
}
```

### 2. GPU Acceleration
```bash
# Enable NVIDIA GPU support
docker run --gpus all agent-mesh-xr:production

# Kubernetes GPU node selector
nodeSelector:
  accelerator: nvidia-tesla-k80
```

### 3. Memory Optimization
- **Object Pooling**: Reuse agent objects to reduce GC pressure
- **Batch Processing**: Process agents in batches for efficiency
- **LOD System**: Automatic level-of-detail rendering based on distance
- **Cache Management**: Intelligent caching with TTL and LRU eviction

## 🔧 Troubleshooting

### Common Issues

#### 1. High Memory Usage
```bash
# Check memory usage
docker stats agent-mesh-xr

# Adjust memory limits
docker update --memory="4g" agent-mesh-xr
```

#### 2. WebGL Context Issues
```bash
# Check GPU acceleration status
curl http://localhost:3000/debug/gpu-status

# Restart with software rendering fallback
docker restart agent-mesh-xr
```

#### 3. WebSocket Connection Problems
```bash
# Check WebSocket endpoint
curl --include \
     --no-buffer \
     --header "Connection: Upgrade" \
     --header "Upgrade: websocket" \
     http://localhost:8080/ws
```

#### 4. Performance Issues
```bash
# Check system resources
top -p $(docker inspect -f '{{.State.Pid}}' agent-mesh-xr)

# Monitor application metrics
curl http://localhost:3000/metrics | grep agent_mesh_xr
```

### Log Analysis
```bash
# Application logs
docker-compose -f docker-compose.production.yml logs -f agent-mesh-xr

# System logs
journalctl -u docker.service -f

# Performance logs
docker exec agent-mesh-xr cat /app/logs/performance.log
```

## 🚀 Scaling & High Availability

### Horizontal Scaling
```yaml
# Kubernetes HPA configuration
spec:
  minReplicas: 3
  maxReplicas: 20
  metrics:
  - type: Resource
    resource:
      name: cpu
      target:
        type: Utilization
        averageUtilization: 70
```

### Load Balancing
- **NGINX**: HTTP load balancing with health checks
- **WebSocket**: Sticky sessions for WebSocket connections
- **Database**: Read replicas for improved performance

### Regional Deployment
- **Multi-region**: Deploy across multiple cloud regions
- **CDN**: Static asset distribution via CDN
- **Edge Computing**: Edge nodes for reduced latency

## 📞 Support & Maintenance

### Regular Maintenance Tasks
1. **Weekly**: Review metrics and alerts
2. **Monthly**: Update dependencies and security patches
3. **Quarterly**: Performance optimization review
4. **Annually**: Architecture review and capacity planning

### Support Contacts
- **Technical Issues**: `devops@your-domain.com`
- **Security Incidents**: `security@your-domain.com`
- **Performance Questions**: `performance@your-domain.com`

### Documentation
- **API Documentation**: `https://docs.your-domain.com/api`
- **Architecture Guide**: `https://docs.your-domain.com/architecture`
- **Troubleshooting Guide**: `https://docs.your-domain.com/troubleshooting`

## 🔗 Additional Resources

- [Agent Mesh XR Documentation](https://agent-mesh-sim-xr.dev)
- [Performance Optimization Guide](docs/PERFORMANCE.md)
- [Security Best Practices](docs/SECURITY.md)
- [API Reference](docs/API.md)
- [Architecture Overview](docs/ARCHITECTURE.md)

---

**Production Deployment Status**: ✅ **READY**

This system is production-ready with enterprise-grade features including:
- 🔒 Advanced security with threat detection
- 📊 Comprehensive monitoring and alerting
- ⚡ Performance optimization and GPU acceleration
- 🛡️ Fault tolerance and error recovery
- 📈 Auto-scaling and load balancing
- 🔄 Backup and disaster recovery
- 🎯 Support for 10,000+ concurrent agents