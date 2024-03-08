/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JSONSchemaType } from 'ajv';
import { Cache, GetSchema } from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import validate from '../util/validator';
import { createErrorResponse, createResponse } from '../util/responses';
import { getDataStorage, getFavorites } from '../agent/Agent';
import filterFavorites from '../util/filterFavorites';
import getClient from '../util/redisClient';

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
  const userId = req?.params?.id;
  const store = req?.query?.store;
  const type = req?.query?.type;
  try {
    const schema: GetSchema = {
      hslId: userId,
      store: store,
    };
    validate(getSchema, schema);
  } catch (err) {
    context.res = createErrorResponse(err, context);
    return;
  }

  const key = String(store ? `${store}-${userId}` : userId);
  let cache!: Cache;

  const client = getClient();
  try {
    context.log('checking redis cache');
    const data = String(await client.get(key));
    cache = { data: JSON.parse(data) };
  } catch (err) {
    context.log(err); // redis IO error - not fatal, just log
  }

  try {
    let filteredFavorites: Array<Favourite>;
    if (!cache || cache.data === null) {
      context.log('no data in cache');
      context.log('getting dataStorage');
      const dataStorage = await getDataStorage(req.params.id, context);
      if (!dataStorage) {
        context.res = createResponse(JSON.stringify([]), context);
        return;
      }
      context.log('found datastorage');
      const favorites = await getFavorites(dataStorage.id);
      filteredFavorites = filterFavorites(favorites, type);
      context.log('caching data');
      await client.set(key, JSON.stringify(favorites), 'EX', 60 * 60 * 24 * 14);
    } else {
      context.log('found data in cache');
      filteredFavorites = filterFavorites(cache.data, type);
    }
    context.res = createResponse(JSON.stringify(filteredFavorites), context);
  } catch (err) {
    context.res = createErrorResponse(err, context);
  }
};

export default getFavoritesTrigger;
