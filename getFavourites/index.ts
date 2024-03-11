/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { JSONSchemaType } from 'ajv';
import { Cache, GetSchema, Favourite } from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import validate from '../util/validator';
import { createErrorResponse, createResponse } from '../util/responses';
import { getDataStorage, getFavourites } from '../agent/Agent';
import filterFavourites from '../util/filterFavourites';
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

const getFavouritesTrigger: AzureFunction = async function (
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
  /*  try {
    context.log('checking redis cache');
    const data = String(await client.get(key));
    cache = { data: JSON.parse(data) };
  } catch (err) {
    context.log.error(err); // redis IO error - not fatal, just log
  } */

  try {
    let filteredFavourites: Array<Favourite>;
    if (!cache || cache.data === null) {
      context.log('no data in cache');
      context.log('getting dataStorage');
      const dataStorage = await getDataStorage(req.params.id, context);
      if (!dataStorage) {
        context.res = createResponse(JSON.stringify([]));
        return;
      }
      context.log('found datastorage');
      const favourites = await getFavourites(dataStorage.id);
      filteredFavourites = filterFavourites(favourites, type);
      context.log('caching data');
      await client.set(
        key,
        JSON.stringify(favourites),
        'EX',
        60 * 60 * 24 * 14,
      );
    } else {
      context.log('found data in cache');
      filteredFavourites = filterFavourites(cache.data, type);
    }
    context.res = createResponse(JSON.stringify(filteredFavourites));
  } catch (err) {
    context.res = createErrorResponse(err, context);
  }
};

export default getFavouritesTrigger;
