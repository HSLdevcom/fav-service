import { JSONSchemaType } from 'ajv';
import { AxiosResponse } from 'axios';
import { createErrorResponse } from '../util/responses';
import validate from '../util/validator';
import { Cache, Favourites, UpdateSchema } from '../util/types';
import { AzureFunction, Context, HttpRequest } from '@azure/functions';
import {
  getFavourites,
  updateFavourites,
  getDataStorage,
  createDataStorage,
  deleteExpiredNotes,
} from '../agent/Agent';
import mergeFavourites from '../util/mergeFavourites';
import filterFavourites from '../util/filterFavourites';
import getClient from '../util/redisClient';

const updateSchema: JSONSchemaType<UpdateSchema> = {
  type: 'object',
  properties: {
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          favouriteId: { type: 'string', format: 'uuid' },
          noteId: { type: 'string' },
          type: {
            enum: [
              'route',
              'stop',
              'station',
              'place',
              'bikeStation',
              'note',
              'postalCode',
            ],
          },
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
          expires: { type: 'number' },
          postalCode: { type: 'string' },
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
              required: ['type', 'lastUpdated', 'stationId'],
            },
          },
          {
            if: {
              properties: { type: { const: 'note' } },
            },
            then: {
              required: ['type', 'expires', 'noteId'],
            },
          },
          {
            if: {
              properties: { type: { const: 'postalCode' } },
            },
            then: {
              required: ['type', 'postalCode', 'lastUpdated'],
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

const expireNotes = async (
  context: Context,
  dsId: string,
  favourites: Favourites,
): Promise<void> => {
  const hasNotes = Object.keys(favourites).some(
    key => String(favourites[key].type) === 'note',
  );
  if (!hasNotes) {
    context.log('no notes');
    return;
  }
  context.log('delete expired notes');
  const deleteResponses = await deleteExpiredNotes(dsId, favourites, context);
  if (deleteResponses.length > 0) {
    const deleteSuccessful = deleteResponses.every(
      (response: AxiosResponse) => response.status === 204,
    );
    if (deleteSuccessful) {
      context.log('expired notes succesfully');
    } else {
      context.log.error('expiring notes failed');
    }
  }
};

const putFavouritesTrigger: AzureFunction = async function (
  context: Context,
  req: HttpRequest,
): Promise<void> {
  try {
    const userId = req?.params?.id;
    const store = req?.query?.store;
    const type = req?.query?.type;
    const schema: UpdateSchema = {
      body: req?.body,
      hslId: userId,
      store: store && String(store),
    };
    validate(updateSchema, schema);
    const dataStorage = {
      id: '',
    };
    context.log('searching existing datastorage for putFavourites');
    const oldDataStorage = await getDataStorage(req.params.id, context);
    if (oldDataStorage) {
      context.log('existing datastorage found');
      dataStorage.id = oldDataStorage.id;
    } else {
      context.log('trying to create new datastorage');
      try {
        const newDataStorage = await createDataStorage(req.params.id, context);
        context.log('datastorage created');
        dataStorage.id = newDataStorage;
      } catch (err) {
        context.log.error('something went wrong creating datastorage');
        throw err;
      }
    }
    const key = String(store ? `${store}-${userId}` : userId);
    context.log('getting favourites from datastorage');
    const currentFavourites: Favourites = await getFavourites(dataStorage.id);
    context.log('merging favourites with current ones');
    const mergedFavourites = await mergeFavourites(
      currentFavourites,
      req.body,
      String(store),
    );
    await expireNotes(context, dataStorage.id, mergedFavourites);
    context.log('updating favourites to datastorage');
    const response = await updateFavourites(
      dataStorage.id,
      mergedFavourites,
      context,
    );
    try {
      const cache: Cache = { data: mergedFavourites };
      // update data to redis with hslid key
      const client = getClient();
      await client.set(
        key,
        JSON.stringify(cache.data),
        'EX',
        60 * 60 * 24 * 14,
      );
    } catch (err) {
      context.log.error(err); // redis IO error
    }
    const filteredFavourites = filterFavourites(mergedFavourites, type);
    const statusCode = response.status === 204 ? 200 : response.status;
    const responseBody: string = JSON.stringify(
      Object.values(filteredFavourites),
    );
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

export default putFavouritesTrigger;
