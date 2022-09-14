export const getRedisUrl = () => {
  const value = process.env.REDIS_URL;
  if (!value) {
    throw new Error("Environment variable 'REDIS_URL' not set");
  }

  return value;
};
