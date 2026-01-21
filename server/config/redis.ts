/**
 * Redis Configuration for Bull Queue
 * Connects to Railway Redis addon or local Redis
 */

import Redis from 'ioredis';

let redisClient: Redis | null = null;

/**
 * Get Redis connection configuration
 */
export function getRedisConfig() {
  // Railway Redis URL format: redis://default:password@host:port
  const redisUrl = process.env.REDIS_URL;
  
  if (redisUrl) {
    console.log('[Redis] Using REDIS_URL from environment');
    return redisUrl;
  }
  
  // Fallback to individual env vars
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379');
  const password = process.env.REDIS_PASSWORD;
  
  console.log(`[Redis] Using host: ${host}:${port}`);
  
  return {
    host,
    port,
    password,
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,
  };
}

/**
 * Get or create Redis client
 */
export function getRedisClient(): Redis {
  if (!redisClient) {
    const config = getRedisConfig();
    
    if (typeof config === 'string') {
      redisClient = new Redis(config, {
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
      });
    } else {
      redisClient = new Redis(config);
    }
    
    redisClient.on('connect', () => {
      console.log('[Redis] Connected successfully');
    });
    
    redisClient.on('error', (err) => {
      console.error('[Redis] Connection error:', err);
    });
  }
  
  return redisClient;
}

/**
 * Close Redis connection
 */
export async function closeRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
    console.log('[Redis] Connection closed');
  }
}
