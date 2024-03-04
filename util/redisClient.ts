import { RedisSettings } from './types';
import { getRedisHost, getRedisPort, getRedisPass } from './helpers';
import Redis from 'ioredis';

let client: Redis;

function getClient(): Redis {
  if (!client) {
    const settings: RedisSettings = {};
    settings.redisHost = getRedisHost();
    settings.redisPort = getRedisPort();
    settings.redisPass = getRedisPass();

    const redisOptions = settings.redisPass
      ? {
          password: settings.redisPass,
          tls: { servername: settings.redisHost },
        }
      : {};

    const MAX_RETRIES = 10;
    const MAX_DELAY_MS = 5000;

    client = new Redis({
      port: settings.redisPort,
      host: settings.redisHost,
      connectTimeout: 5000,
      retryStrategy: times => {
        if (times > MAX_RETRIES) {
          return null;
        }
        return Math.min(times * 100, MAX_DELAY_MS);
      },
      ...redisOptions,
    });
  }
  return client;
}

export default getClient;
