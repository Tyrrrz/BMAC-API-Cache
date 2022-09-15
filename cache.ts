import { createClient } from 'redis';
import { getCacheTtl, getRedisUrl } from './utils/env';

const redis = createClient({
  url: getRedisUrl()
});

redis.on('error', (err) => console.error('Redis error:', err));

const ensureConnected = async () => {
  if (redis.isReady) {
    return;
  }

  await redis.connect();
};

export const getCacheItem = async (key: string) => {
  await ensureConnected();

  const value = redis.get(key);

  return value;
};

export const setCacheItem = async (key: string, value: string) => {
  await ensureConnected();

  await redis.set(key, value, {
    EX: getCacheTtl()
  });
};
