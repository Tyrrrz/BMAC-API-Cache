export const getPort = () => {
  return Number(process.env.PORT) || 3000;
};

export const getRedisUrl = () => {
  const value = process.env.REDIS_URL;
  if (!value) {
    throw new Error("Environment variable 'REDIS_URL' not set");
  }

  return value;
};
