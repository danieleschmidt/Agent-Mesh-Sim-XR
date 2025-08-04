# Deployment Guide - Agent Mesh Sim XR

## Prerequisites

### System Requirements
- Node.js 18.0+
- NPM 9.0+
- HTTPS-enabled web server
- WebSocket support
- Modern browser with WebXR support

### Hardware Requirements
- **Development**: 8GB RAM, dedicated GPU recommended
- **Production**: 16GB+ RAM, high-performance GPU for large swarms
- **VR Devices**: Meta Quest 2/3/Pro, Apple Vision Pro, or desktop VR headset

## Quick Start

### 1. Environment Setup

```bash
# Clone repository
git clone https://github.com/danieleschmidt/Agent-Mesh-Sim-XR.git
cd Agent-Mesh-Sim-XR

# Install dependencies
npm install

# Build for production
npm run build
```

### 2. Configuration

Create `.env.production`:

```env
VITE_AGENT_MESH_ENDPOINT=wss://your-agent-mesh.production.com
VITE_MAX_AGENTS=5000
VITE_ENABLE_PERFORMANCE_MONITORING=true
VITE_LOG_LEVEL=INFO
```

### 3. HTTPS Certificate Setup

**Required for WebXR functionality:**

```bash
# Using Let's Encrypt (recommended)
certbot certonly --webroot -w /var/www/html -d your-domain.com

# Or generate self-signed for development
openssl req -x509 -newkey rsa:4096 -keyout key.pem -out cert.pem -days 365
```

### 4. Web Server Configuration

#### Nginx Configuration

```nginx
server {
    listen 443 ssl http2;
    server_name your-domain.com;
    
    ssl_certificate /path/to/cert.pem;
    ssl_certificate_key /path/to/key.pem;
    
    # Enable CORS for agent mesh integration
    add_header Access-Control-Allow-Origin "https://agent-mesh.local:8080";
    add_header Access-Control-Allow-Methods "GET, POST, OPTIONS";
    add_header Access-Control-Allow-Headers "Content-Type, Authorization";
    
    # WebXR requires these headers
    add_header Permissions-Policy "xr-spatial-tracking=*,camera=*,microphone=*";
    add_header Feature-Policy "vr *; ar *";
    
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
        
        # Enable compression for better performance
        gzip on;
        gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
    }
    
    # WebSocket proxy for agent mesh
    location /ws {
        proxy_pass http://agent-mesh-backend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

#### Apache Configuration

```apache
<VirtualHost *:443>
    ServerName your-domain.com
    DocumentRoot /path/to/dist
    
    SSLEngine on
    SSLCertificateFile /path/to/cert.pem
    SSLCertificateKeyFile /path/to/key.pem
    
    # CORS headers
    Header always set Access-Control-Allow-Origin "https://agent-mesh.local:8080"
    Header always set Access-Control-Allow-Methods "GET, POST, OPTIONS"
    Header always set Access-Control-Allow-Headers "Content-Type, Authorization"
    
    # WebXR headers
    Header always set Permissions-Policy "xr-spatial-tracking=*,camera=*,microphone=*"
    Header always set Feature-Policy "vr *; ar *"
    
    # Enable compression
    LoadModule deflate_module modules/mod_deflate.so
    <Location />
        SetOutputFilter DEFLATE
        SetEnvIfNoCase Request_URI "\.(?:gif|jpe?g|png)$" no-gzip dont-vary
        SetEnvIfNoCase Request_URI "\.(?:exe|t?gz|zip|bz2|sit|rar)$" no-gzip dont-vary
    </Location>
    
    # WebSocket proxy
    ProxyPreserveHost On
    ProxyPass /ws ws://agent-mesh-backend:8080/
    ProxyPassReverse /ws ws://agent-mesh-backend:8080/
</VirtualHost>
```

## Performance Optimization

### Production Configuration

```typescript
// src/config/production.ts
export const productionConfig = {
  agentMeshXR: {
    maxAgents: 5000,
    physicsEngine: 'rapier', // Most performant
    renderMode: 'instanced',
    vrSupport: true,
    arSupport: true
  },
  
  performance: {
    targetFPS: 60,
    minFPS: 30,
    maxMemoryUsage: 1000, // MB
    maxCPUUsage: 80, // %
    adaptiveQuality: true
  },
  
  lod: {
    levels: [
      { distance: 3, model: 'high-poly', updateRate: 60 },
      { distance: 10, model: 'medium-poly', updateRate: 30 },
      { distance: 30, model: 'low-poly', updateRate: 15 },
      { distance: 100, model: 'billboard', updateRate: 5 },
      { distance: Infinity, model: 'culled', updateRate: 1 }
    ]
  },
  
  security: {
    maxAgentsPerUser: 1000,
    maxConnectionsPerIP: 20,
    requireHTTPS: true,
    sessionTimeoutMs: 3600000,
    rateLimitRequests: 200,
    rateLimitWindowMs: 60000
  }
}
```

### CDN Setup

```bash
# Build optimized bundles
npm run build

# Upload to CDN
aws s3 sync dist/ s3://your-cdn-bucket --delete
aws cloudfront create-invalidation --distribution-id YOUR_DIST_ID --paths "/*"
```

## Monitoring & Observability

### Performance Monitoring

```typescript
// Enable comprehensive monitoring
import { PerformanceMonitor } from './monitoring/PerformanceMonitor'

const monitor = new PerformanceMonitor({
  minFPS: 30,
  maxRenderTime: 33,
  maxMemoryUsage: 1000,
  maxCPUUsage: 85
})

monitor.on('performanceWarning', (data) => {
  // Send to monitoring service
  analytics.track('performance_warning', data)
})
```

### Health Checks

```typescript
// src/health/healthcheck.ts
export class HealthCheck {
  async checkSystem(): Promise<{
    status: 'healthy' | 'degraded' | 'unhealthy'
    details: Record<string, any>
  }> {
    const health = {
      webxr: await this.checkWebXRSupport(),
      agentMesh: await this.checkAgentMeshConnection(),
      performance: await this.checkPerformanceMetrics(),
      security: await this.checkSecurityStatus()
    }
    
    const unhealthyCount = Object.values(health).filter(h => !h.healthy).length
    
    return {
      status: unhealthyCount === 0 ? 'healthy' : 
              unhealthyCount <= 1 ? 'degraded' : 'unhealthy',
      details: health
    }
  }
}
```

## Security Hardening

### Production Security Checklist

- [ ] HTTPS certificate installed and valid
- [ ] CORS properly configured
- [ ] Rate limiting enabled
- [ ] Input validation active
- [ ] Session management secure
- [ ] Audit logging enabled
- [ ] Security headers configured
- [ ] CSP policy implemented

### Content Security Policy

```html
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               script-src 'self' 'unsafe-eval'; 
               style-src 'self' 'unsafe-inline'; 
               connect-src 'self' wss://agent-mesh.production.com;
               img-src 'self' data: blob:;
               media-src 'self' blob:;">
```

## Scaling Considerations

### Horizontal Scaling

```yaml
# docker-compose.yml
version: '3.8'
services:
  agent-mesh-xr-1:
    build: .
    ports:
      - "3001:3000"
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=1
      
  agent-mesh-xr-2:
    build: .
    ports:
      - "3002:3000"
    environment:
      - NODE_ENV=production
      - INSTANCE_ID=2
      
  nginx:
    image: nginx:alpine
    ports:
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/ssl
    depends_on:
      - agent-mesh-xr-1
      - agent-mesh-xr-2
```

### Load Balancing

```nginx
upstream agent_mesh_xr {
    server agent-mesh-xr-1:3000 weight=1 max_fails=3 fail_timeout=30s;
    server agent-mesh-xr-2:3000 weight=1 max_fails=3 fail_timeout=30s;
    keepalive 32;
}

server {
    location / {
        proxy_pass http://agent_mesh_xr;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

## Troubleshooting

### Common Issues

**WebXR Not Working**
- Ensure HTTPS is enabled
- Check browser WebXR support
- Verify VR device connectivity
- Check console for WebXR errors

**Performance Issues**
- Monitor FPS and memory usage
- Adjust LOD settings
- Reduce max agent count
- Enable adaptive quality

**Connection Issues**
- Verify WebSocket endpoint
- Check CORS configuration
- Test network connectivity
- Review security settings

### Debug Mode

```bash
# Run with debug logging
VITE_LOG_LEVEL=DEBUG npm run dev

# Performance profiling
VITE_PERFORMANCE_PROFILING=true npm run dev
```

### Log Analysis

```bash
# Production logs
tail -f /var/log/nginx/access.log | grep "agent-mesh"
journalctl -u agent-mesh-xr -f
```

## Backup & Recovery

### Configuration Backup

```bash
#!/bin/bash
# backup-config.sh
DATE=$(date +%Y%m%d_%H%M%S)
tar -czf "agent-mesh-xr-config-$DATE.tar.gz" \
    .env.production \
    nginx.conf \
    ssl/ \
    src/config/
```

### Disaster Recovery

1. **Database Backup**: Agent state snapshots
2. **Configuration Backup**: Environment and server config
3. **SSL Certificate Backup**: Certificate and key files
4. **Monitoring Setup**: Restore dashboard configurations

## Support & Maintenance

### Updates

```bash
# Check for updates
npm outdated

# Update dependencies
npm update

# Rebuild and redeploy
npm run build
```

### Monitoring Dashboards

- Performance metrics visualization
- Error rate tracking
- User session analytics
- System resource utilization
- Security event monitoring

For additional support, refer to the main README.md and CLAUDE.md documentation files.