import redis from 'redis';
import { getRedisUrl } from './utils/env';

const redisClient = redis.createClient({
  url: getRedisUrl()
});

redisClient.on('error', (err) => console.error('Redis error:', err));

export const getCacheItem = async (key: string) => {
  await redisClient.connect();
  const value = redisClient.get(key);
  await redisClient.disconnect();

  return value;
};

export const setCacheItem = async (key: string, value: string) => {
  await redisClient.connect();
  await redisClient.set(key, value);
  await redisClient.disconnect();
};
