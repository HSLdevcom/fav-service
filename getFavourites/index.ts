/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JSONSchemaType } from 'ajv';
import { RedisSettings, Cache, GetSchema } from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import validate from '../util/validator';
import createErrorResponse from '../util/createErrorResponse';
import { getDataStorage, getFavorites } from '../agent/Agent';
import { getRedisHost, getRedisPort, getRedisPass } from '../util/helpers';
import filterFavorites from '../util/filterFavorites';
import Redis from 'ioredis';

const getSchema: JSONSchemaType<GetSchema> = {
  type: 'object',
  properties: {
    hslId: {
      type: 'string',
    },
    store: {
      type: 'string',
    },
  },
  required: ['hslId', 'store'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const getFavoritesTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  const settings: RedisSettings = {};
  const userId = req?.params?.id;
  const store = req?.query?.store;
  const type = req?.query?.type;
  try {
    const schema: GetSchema = {
      hslId: userId,
      store: store,
    };
    validate(getSchema, schema);
    settings.redisHost = getRedisHost();
    settings.redisPort = getRedisPort();
    settings.redisPass = getRedisPass();
  } catch (err) {
    context.res = createErrorResponse(err, context);
    return;
  }
  const redisOptions = settings.redisPass
    ? { password: settings.redisPass, tls: { servername: settings.redisHost } }
    : {};
  const client = new Redis({
    port: settings.redisPort,
    host: settings.redisHost,
    ...redisOptions,
  });

  const key = String(store ? `${store}-${userId}` : userId);

  let cache!: Cache;
  const waitForRedis = (client: Redis): Promise<void> =>
    new Promise((resolve, reject) => {
      client.on('ready', async () => {
        context.log('redis connected');
        const data = String(await client.get(key));
        cache = { data: JSON.parse(data) };
        resolve();
      });
      client.on('error', async () => {
        context.log('redis error');
        reject();
      });
    });
  try {
    // redis check cache
    context.log('checking redis cache');

    await waitForRedis(client);

    if (!cache || cache.data === null) {
      context.log('no data in cache');
      context.log('getting dataStorage');
      const dataStorage = await getDataStorage(req.params.id);
      context.log('found datastorage');
      const favorites = await getFavorites(dataStorage.id);
      const filteredFavorites = filterFavorites(favorites, type);
      const json = JSON.stringify(filteredFavorites);
      // cache data
      context.log('caching data');
      await client.set(key, JSON.stringify(favorites), 'EX', 60 * 60 * 24 * 14);
      context.res = {
        status: 200,
        body: json,
        headers: {
          'Content-Type': 'application/json',
        },
      };
    } else {
      context.log('found data in cache');
      const filteredFavorites = filterFavorites(cache.data, type);
      const json = JSON.stringify(filteredFavorites);
      context.res = {
        status: 200,
        body: json,
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }
    client.quit();
  } catch (err) {
    client.quit();
    context.res = createErrorResponse(err, context);
  }
};

export default getFavoritesTrigger;
