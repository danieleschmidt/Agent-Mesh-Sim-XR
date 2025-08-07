#!/usr/bin/env node

/**
 * Production Health Check Script
 * Comprehensive health validation for Agent Mesh Sim XR
 */

const http = require('http')
const process = require('process')

const HEALTH_CHECK_TIMEOUT = 5000
const MAX_RETRIES = 3

const healthChecks = [
  {
    name: 'HTTP Server',
    check: () => checkHttpEndpoint('http://localhost:3000/health')
  },
  {
    name: 'WebSocket Server', 
    check: () => checkHttpEndpoint('http://localhost:3000/ws-health')
  },
  {
    name: 'Memory Usage',
    check: () => checkMemoryUsage()
  },
  {
    name: 'System Resources',
    check: () => checkSystemResources()
  }
]

async function checkHttpEndpoint(url) {
  return new Promise((resolve, reject) => {
    const request = http.get(url, { timeout: HEALTH_CHECK_TIMEOUT }, (response) => {
      let data = ''
      
      response.on('data', (chunk) => {
        data += chunk
      })
      
      response.on('end', () => {
        if (response.statusCode === 200) {
          try {
            const healthData = JSON.parse(data)
            resolve({
              status: 'healthy',
              statusCode: response.statusCode,
              data: healthData
            })
          } catch (error) {
            resolve({
              status: 'healthy',
              statusCode: response.statusCode,
              data: { message: 'OK' }
            })
          }
        } else {
          reject(new Error(`HTTP ${response.statusCode}: ${data}`))
        }
      })
    })
    
    request.on('error', (error) => {
      reject(new Error(`Network error: ${error.message}`))
    })
    
    request.on('timeout', () => {
      request.destroy()
      reject(new Error('Request timeout'))
    })
  })
}

async function checkMemoryUsage() {
  const memUsage = process.memoryUsage()
  const maxMemory = 32 * 1024 * 1024 * 1024 // 32GB limit
  
  const heapPercentage = (memUsage.heapUsed / maxMemory) * 100
  const rssPercentage = (memUsage.rss / maxMemory) * 100
  
  if (heapPercentage > 90 || rssPercentage > 95) {
    throw new Error(`High memory usage: Heap ${heapPercentage.toFixed(1)}%, RSS ${rssPercentage.toFixed(1)}%`)
  }
  
  return {
    status: 'healthy',
    data: {
      heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
      heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
      rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
      external: `${(memUsage.external / 1024 / 1024).toFixed(2)}MB`,
      heapPercentage: `${heapPercentage.toFixed(1)}%`,
      rssPercentage: `${rssPercentage.toFixed(1)}%`
    }
  }
}

async function checkSystemResources() {
  const uptime = process.uptime()
  const cpuUsage = process.cpuUsage()
  
  // Check if system has been running for a reasonable time
  if (uptime < 10) {
    throw new Error('System just started, not fully initialized')
  }
  
  return {
    status: 'healthy',
    data: {
      uptime: `${Math.floor(uptime)}s`,
      nodeVersion: process.version,
      platform: process.platform,
      arch: process.arch,
      pid: process.pid,
      cpuUser: cpuUsage.user,
      cpuSystem: cpuUsage.system
    }
  }
}

async function runHealthCheck() {
  console.log('🏥 Running health checks...')
  
  const results = {}
  let overallHealthy = true
  
  for (const healthCheck of healthChecks) {
    let retries = 0
    let success = false
    let lastError = null
    
    while (retries < MAX_RETRIES && !success) {
      try {
        const result = await healthCheck.check()
        results[healthCheck.name] = result
        console.log(`✅ ${healthCheck.name}: ${result.status}`)
        success = true
      } catch (error) {
        lastError = error
        retries++
        
        if (retries < MAX_RETRIES) {
          console.log(`⚠️  ${healthCheck.name} failed (attempt ${retries}/${MAX_RETRIES}): ${error.message}`)
          await new Promise(resolve => setTimeout(resolve, 1000))
        }
      }
    }
    
    if (!success) {
      results[healthCheck.name] = {
        status: 'unhealthy',
        error: lastError.message,
        retries: retries
      }
      console.log(`❌ ${healthCheck.name}: ${lastError.message}`)
      overallHealthy = false
    }
  }
  
  // Overall health summary
  const summary = {
    healthy: overallHealthy,
    timestamp: new Date().toISOString(),
    checks: results,
    environment: {
      NODE_ENV: process.env.NODE_ENV,
      PORT: process.env.PORT,
      WS_PORT: process.env.WS_PORT,
      MAX_AGENTS: process.env.MAX_AGENTS
    }
  }
  
  if (overallHealthy) {
    console.log('✅ All health checks passed')
    console.log(`📊 System Status: ${JSON.stringify(summary, null, 2)}`)
    process.exit(0)
  } else {
    console.log('❌ Health check failed')
    console.error(`📊 System Status: ${JSON.stringify(summary, null, 2)}`)
    process.exit(1)
  }
}

// Handle process termination gracefully
process.on('SIGTERM', () => {
  console.log('Health check received SIGTERM, exiting...')
  process.exit(1)
})

process.on('SIGINT', () => {
  console.log('Health check received SIGINT, exiting...')
  process.exit(1)
})

// Run health check
runHealthCheck().catch((error) => {
  console.error('❌ Health check script error:', error)
  process.exit(1)
})