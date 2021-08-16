/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import * as Redis from 'ioredis';
import { JSONSchemaType } from 'ajv';
import {
  RedisSettings,
  Cache,
  Favourite,
  Favourites,
  GetSchema,
} from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import validate from '../util/validator';
import createErrorResponse from '../util/createErrorResponse';
import { getDataStorage, getFavorites } from '../agent/Agent.js';
import { getRedisHost, getRedisPort, getRedisPass } from '../util/helpers';

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

const filterFavorites = (favorites: Favourites): Array<Favourite> => {
  const keys = Object.keys(favorites);
  const responseArray: Array<Favourite> = keys.map((key: string) => {
    return favorites[key];
  });
  const filteredArray: Array<Favourite> = responseArray.filter(item => {
    return item !== null;
  });
  return filteredArray;
};

const getFavoritesTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  const cache: Cache = {};
  const settings: RedisSettings = {};
  const userId = req.params.id;
  const store = req.query.store;
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
  const client = new Redis(
    settings.redisPort,
    settings.redisHost,
    redisOptions,
  );

  const key = String(store ? `${store}-${userId}` : userId);
  const data = String(await client.get(String(key)));
  const asd: Favourites = JSON.parse(data);
  cache.data = asd;
  try {
    // redis check cache
    context.log('checking redis cache');
    // await waitForRedis(client);

    if (cache.data === null) {
      context.log('no data in cache');
      context.log('getting dataStorage');
      const dataStorage = await getDataStorage(req.params.id);
      context.log('found datastorage');
      const favorites = await getFavorites(dataStorage.id);
      const filteredFavorites = filterFavorites(favorites);
      // cache data
      context.log('caching data');
      await client.set(key, JSON.stringify(favorites), 'EX', 60 * 60 * 24 * 14);
      context.res = {
        status: 200,
        body: filteredFavorites,
      };
    } else {
      context.log('found data in cache');
      const filteredFavorites = filterFavorites(cache.data);
      context.res = {
        status: 200,
        body: filteredFavorites,
      };
    }
    client.quit();
  } catch (err) {
    client.quit();
    context.log('3333', err);
    context.res = createErrorResponse(err, context);
  }
};

export default getFavoritesTrigger;
