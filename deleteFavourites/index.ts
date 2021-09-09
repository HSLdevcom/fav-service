import { JSONSchemaType } from 'ajv';
import { AxiosResponse } from 'axios';
import * as Redis from 'ioredis';
import createErrorResponse from '../util/createErrorResponse';
import validate from '../util/validator';
import { RedisSettings, DeleteSchema } from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import { deleteFavorites, getDataStorage, getFavorites } from '../agent/Agent';
import { getRedisHost, getRedisPass, getRedisPort } from '../util/helpers';
import filterFavorites from '../util/filterFavorites';

const deleteSchema: JSONSchemaType<DeleteSchema> = {
  type: 'object',
  properties: {
    body: {
      type: 'array',
      items: { type: 'string' },
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

const deleteFavouriteTrigger: AzureFunction = async function (
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
    const type = req?.query?.type;
    const schema: DeleteSchema = {
      body: req?.body,
      hslId: userId,
      store: store && String(store),
    };
    validate(deleteSchema, schema);
    const key = store ? `${store}-${req.params.id}` : req.params.id;
    context.log('getting dataStorage');
    const dataStorage = await getDataStorage(req.params.id);
    context.log('deleting items');
    const hslidResponses = await deleteFavorites(
      dataStorage.id,
      req?.body,
      store,
    );
    context.log('deleted items');
    const responses = req.body.map((key: string, i: number) => {
      return {
        key,
        status: hslidResponses[i]?.status,
        statusText: hslidResponses[i]?.statusText,
      };
    });
    // redis delete key from cache
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
    const waitForRedis = (client: Redis.Redis): Promise<void> =>
      new Promise((resolve, reject) => {
        client.on('ready', async () => {
          context.log('redis connected');
          await client.expire(String(key), 0);
          client.quit();
          resolve();
        });
        client.on('error', async () => {
          context.log('redis error');
          client.quit();
          reject();
        });
      });
    await waitForRedis(client);

    const deleteSuccessful = responses.every(
      (response: AxiosResponse) => response.status === 204,
    );
    const favorites = await getFavorites(dataStorage.id);
    const filteredFavorites = filterFavorites(favorites, type);
    const responseBody = JSON.stringify(Object.values(filteredFavorites));
    context.res = {
      status: deleteSuccessful ? 200 : 400,
      body: deleteSuccessful ? responseBody : responses,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    context.res = createErrorResponse(err, context);
  }
};

export default deleteFavouriteTrigger;