import { JSONSchemaType } from 'ajv';
import { Cache, GetSchema, Favourite, Favourites } from '../util/types.js';
import functions from '@azure/functions';
import validate from '../util/validator.js';
import { createErrorResponse, createResponse } from '../util/responses.js';
import { getDataStorage, getFavourites } from '../agent/Agent.js';
import filterFavourites from '../util/filterFavourites.js';
import getClient from '../util/redisClient.js';
import Err from '../util/Err.js';

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

export async function getFavouritesTrigger(
  req: functions.HttpRequest,
  context: functions.InvocationContext,
): Promise<functions.HttpResponseInit> {
  const userId = req?.params?.id;
  const store = req?.query?.get('store') || undefined;
  const type = req?.query?.get('type') || undefined;
  try {
    const schema: GetSchema = {
      hslId: userId,
      store: store,
    };
    validate(getSchema, schema);
  } catch (err) {
    return createErrorResponse(<Err>err, context);
  }

  const key = String(store ? `${store}-${userId}` : userId);
  let cache!: Cache;

  const client = getClient();
  try {
    context.log('checking redis cache');
    const data = String(await client.get(key));
    cache = { data: JSON.parse(data) };
  } catch (err) {
    context.error(err); // redis IO error - not fatal, just log
  }

  try {
    let filteredFavourites: Array<Favourite>;
    if (!cache || !cache.data) {
      context.log('no data in cache');
      context.log('getting dataStorage');
      let favourites: Favourites;
      const dataStorage = await getDataStorage(req.params.id, context);
      if (dataStorage) {
        context.log('found datastorage');
        favourites = await getFavourites(dataStorage.id);
        filteredFavourites = filterFavourites(favourites, type);
      } else {
        favourites = {};
        filteredFavourites = [];
      }
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
    return createResponse(filteredFavourites);
  } catch (err) {
    return createErrorResponse(<Err>err, context);
  }
}

functions.app.http('getFavourites', {
  methods: ['GET'],
  authLevel: 'function',
  handler: getFavouritesTrigger,
  route: 'favorites/{id}',
});
