import Redis from 'ioredis';

let redisClient: Redis;

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    redisClient = new Redis(process.env.REDIS_URL || 'redis://localhost:6379', {
      maxRetriesPerRequest: null,
    });
    redisClient.on('connect', () => console.log('✅ Redis connected'));
    redisClient.on('error', (err) => console.error('❌ Redis error:', err));
  }
  return redisClient;
};
