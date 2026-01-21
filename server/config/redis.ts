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
    console.log('[Redis] URL format:', redisUrl.replace(/:[^:@]+@/, ':****@')); // Hide password in logs
    return redisUrl;
  }
  
  // Fallback to individual env vars
  const host = process.env.REDIS_HOST || 'localhost';
  const port = parseInt(process.env.REDIS_PORT || '6379');
  const password = process.env.REDIS_PASSWORD;
  
  console.log(`[Redis] Using individual config - host: ${host}:${port}`);
  
  // Warning if using localhost in production
  if (host === 'localhost' && process.env.NODE_ENV === 'production') {
    console.warn('[Redis] ⚠️  WARNING: Using localhost in production! This will likely fail in Railway.');
    console.warn('[Redis] ⚠️  Please set REDIS_URL environment variable in Railway.');
    console.warn('[Redis] ⚠️  Get it from: Railway Dashboard → Redis Service → Variables → REDIS_URL');
  }
  
  return {
    host,
    port,
    password,
    maxRetriesPerRequest: null, // Required for Bull
    enableReadyCheck: false,
    retryStrategy: (times: number) => {
      if (times > 10) {
        console.error('[Redis] Max retry attempts reached. Giving up.');
        return null; // Stop retrying
      }
      const delay = Math.min(times * 1000, 5000); // Max 5 seconds
      console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms...`);
      return delay;
    },
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
        retryStrategy: (times: number) => {
          if (times > 10) {
            console.error('[Redis] Max retry attempts reached. Giving up.');
            return null;
          }
          const delay = Math.min(times * 1000, 5000);
          console.log(`[Redis] Retry attempt ${times}, waiting ${delay}ms...`);
          return delay;
        },
      });
    } else {
      redisClient = new Redis(config);
    }
    
    redisClient.on('connect', () => {
      console.log('[Redis] ✅ Connected successfully');
    });
    
    redisClient.on('ready', () => {
      console.log('[Redis] ✅ Ready to accept commands');
    });
    
    redisClient.on('error', (err) => {
      console.error('[Redis] ❌ Connection error:', err.message);
      if (err.message.includes('ECONNREFUSED')) {
        console.error('[Redis] ❌ Cannot connect to Redis server.');
        console.error('[Redis] 💡 Make sure REDIS_URL is set in Railway environment variables.');
      }
    });
    
    redisClient.on('close', () => {
      console.log('[Redis] Connection closed');
    });
    
    redisClient.on('reconnecting', () => {
      console.log('[Redis] Attempting to reconnect...');
    });
  }
  
  return redisClient;
}

/**
 * Test Redis connection
 */
export async function testRedisConnection(): Promise<boolean> {
  try {
    const client = getRedisClient();
    await client.ping();
    console.log('[Redis] ✅ Connection test successful');
    return true;
  } catch (error) {
    console.error('[Redis] ❌ Connection test failed:', error);
    return false;
  }
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
