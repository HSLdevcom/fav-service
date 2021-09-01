import { JSONSchemaType } from 'ajv';
import createErrorResponse from '../util/createErrorResponse';
import validate from '../util/validator';
import { RedisSettings, Cache, Favourites, UpdateSchema } from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import {
  getFavorites,
  updateFavorites,
  getDataStorage,
  createDataStorage,
} from '../agent/Agent';
import mergeFavorites from '../util/mergeFavorites';
import { getRedisHost, getRedisPass, getRedisPort } from '../util/helpers';
import * as Redis from 'ioredis';

const updateSchema: JSONSchemaType<UpdateSchema> = {
  type: 'object',
  properties: {
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          favouriteId: { type: 'string', format: 'uuid' },
          type: { enum: ['route', 'stop', 'station', 'place', 'bikeStation'] },
          lastUpdated: { type: 'number' },
          gtfsId: { type: 'string' },
          gid: { type: 'string' },
          name: { type: 'string' },
          address: { type: 'string' },
          lat: { type: 'number' },
          lon: { type: 'number' },
          selectedIconId: { type: 'string' },
          layer: { type: 'string' },
          code: { oneOf: [{ type: 'string' }, { type: 'null' }] },
          stationId: { type: 'string' },
          networks: { type: 'array', items: { type: 'string' } },
        },
        allOf: [
          {
            if: {
              properties: {
                type: { enum: ['route', 'stop', 'station'] },
              },
            },
            then: {
              required: ['type', 'lastUpdated', 'gtfsId'],
            },
          },
          {
            if: {
              properties: { type: { const: 'place' } },
            },
            then: {
              required: ['type', 'lastUpdated', 'address', 'lat', 'lon'],
            },
          },
          {
            if: {
              properties: { type: { const: 'bikeStation' } },
            },
            then: {
              required: ['type', 'lastUpdated', 'stationId', 'networks'],
            },
          },
        ],
      },
      additionalProperties: false,
    },
    hslId: {
      type: 'string',
    },
    store: {
      type: 'string',
    },
  },
  required: ['hslId', 'store', 'body'],
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
} as any;

const putFavoritesTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  try {
    const settings: RedisSettings = {};
    settings.redisHost = getRedisHost();
    settings.redisPort = getRedisPort();
    settings.redisPass = getRedisPass();
    const userId = req?.params?.id;
    const store = req?.query?.store;
    const schema: UpdateSchema = {
      body: req?.body,
      hslId: userId,
      store: store && String(store),
    };
    validate(updateSchema, schema);
    const dataStorage = {
      id: '',
    };
    try {
      context.log('searching existing datastorage');
      const oldDataStorage = await getDataStorage(req.params.id);
      context.log('existing datastorage found');
      dataStorage.id = oldDataStorage.id;
    } catch (err) {
      context.log('error occured');
      if (err.status && err.status === 404) {
        context.log('datastorage not found');
        try {
          context.log('trying to create new datastorage');
          const newDataStorage = await createDataStorage(req.params.id);
          context.log('datastorage created');
          dataStorage.id = newDataStorage;
        } catch (err) {
          context.log('something went wrong creating datastorage');
          throw err;
        }
      } else {
        context.log('some other error occured');
        context.log(err);
        throw err;
      }
    }
    const key = String(store ? `${store}-${userId}` : userId);
    context.log('getting favorites from datastorage');
    const currentFavorites: Favourites = await getFavorites(dataStorage.id);
    context.log('merging favorites with current ones');
    const mergedFavorites = await mergeFavorites(
      currentFavorites,
      req.body,
      String(store),
    );
    context.log('updating favorites to datastorage');
    const response = await updateFavorites(dataStorage.id, mergedFavorites);
    const cache: Cache = { data: mergedFavorites };
    // update data to redis with hslid key
    const redisOptions = settings.redisPass
      ? {
          password: settings.redisPass,
          tls: { servername: settings.redisHost },
        }
      : {};
    const client = new Redis(
      settings.redisPort,
      settings.redisHost,
      redisOptions,
    );
    const waitForRedis = async (client: Redis.Redis) => {
      await client.set(
        key,
        JSON.stringify(cache.data),
        'EX',
        60 * 60 * 24 * 14,
      );
      await client.quit();
    };
    await waitForRedis(client);

    const statusCode = response.status === 204 ? 200 : response.status;
    const responseBody: string = JSON.stringify(Object.values(mergedFavorites));
    context.res = {
      status: statusCode,
      body: statusCode > 204 ? response.data : responseBody,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    context.res = createErrorResponse(err, context);
  }
};

export default putFavoritesTrigger;
