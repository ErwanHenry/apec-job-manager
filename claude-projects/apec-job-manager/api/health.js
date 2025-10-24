/**
 * Health Check Endpoint
 *
 * Returns the health status of the application and its dependencies
 * Used by monitoring services and CI/CD pipelines
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Check database connectivity
 */
async function checkDatabase() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      latency: null,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Check Vercel KV (Redis) connectivity
 */
async function checkCache() {
  try {
    // Only check if KV is configured
    if (!process.env.KV_REST_API_URL) {
      return {
        status: 'not_configured',
      };
    }

    const { kv } = await import('@vercel/kv');
    const startTime = Date.now();
    await kv.ping();
    const latency = Date.now() - startTime;

    return {
      status: 'healthy',
      latency: `${latency}ms`,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Check Vercel Blob storage
 */
async function checkStorage() {
  try {
    // Only check if Blob is configured
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      return {
        status: 'not_configured',
      };
    }

    const { list } = await import('@vercel/blob');
    await list({ limit: 1 });

    return {
      status: 'healthy',
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      error: error.message,
    };
  }
}

/**
 * Get system information
 */
function getSystemInfo() {
  return {
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    platform: process.platform,
    uptime: `${Math.floor(process.uptime())}s`,
    memory: {
      used: `${Math.round(process.memoryUsage().heapUsed / 1024 / 1024)}MB`,
      total: `${Math.round(process.memoryUsage().heapTotal / 1024 / 1024)}MB`,
    },
    vercel: process.env.VERCEL === '1',
    region: process.env.VERCEL_REGION || 'local',
  };
}

/**
 * Calculate overall health status
 */
function calculateOverallStatus(checks) {
  const statuses = Object.values(checks).map(check => check.status);

  if (statuses.includes('unhealthy')) {
    return 'unhealthy';
  }

  if (statuses.every(status => status === 'healthy' || status === 'not_configured')) {
    return 'healthy';
  }

  return 'degraded';
}

/**
 * Vercel Serverless Function Handler
 */
export default async function handler(req, res) {
  const startTime = Date.now();

  try {
    // Run all health checks in parallel
    const [database, cache, storage] = await Promise.all([
      checkDatabase(),
      checkCache(),
      checkStorage(),
    ]);

    const checks = {
      database,
      cache,
      storage,
    };

    const overallStatus = calculateOverallStatus(checks);
    const responseTime = Date.now() - startTime;

    const healthData = {
      status: overallStatus,
      timestamp: new Date().toISOString(),
      responseTime: `${responseTime}ms`,
      system: getSystemInfo(),
      services: checks,
    };

    // Return appropriate HTTP status code
    const statusCode = overallStatus === 'healthy' ? 200 : 503;

    res.status(statusCode).json(healthData);

  } catch (error) {
    console.error('Health check error:', error);

    res.status(503).json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error.message,
      system: getSystemInfo(),
    });
  } finally {
    await prisma.$disconnect();
  }
}
