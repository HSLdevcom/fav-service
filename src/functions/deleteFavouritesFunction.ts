import { JSONSchemaType } from 'ajv';
import { createErrorResponse, createResponse } from '../util/responses.js';
import validate from '../util/validator.js';
import { DeleteSchema } from '../util/types.js';
import functions from '@azure/functions';
import {
  deleteFavourites,
  getDataStorage,
  getFavourites,
} from '../agent/Agent.js';
import filterFavourites from '../util/filterFavourites.js';
import getClient from '../util/redisClient.js';
import Err from '../util/Err.js';

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

export async function deleteFavouriteTrigger(
  req: functions.HttpRequest,
  context: functions.InvocationContext,
): Promise<functions.HttpResponseInit> {
  try {
    const userId = req?.params?.id;
    const store = req?.query?.get('store') || undefined;
    const type = req?.query?.get('type') || undefined;
    if (!req.body) {
      return { status: 400, body: 'Request has no body.' };
    }
    const data = (await req?.json()) as string[];
    const schema: DeleteSchema = {
      body: data,
      hslId: userId,
      store: store && String(store),
    };
    validate(deleteSchema, schema);
    const key = store ? `${store}-${req.params.id}` : req.params.id;
    context.log('getting dataStorage');
    const dataStorage = await getDataStorage(req.params.id, context);
    if (!dataStorage) {
      return createResponse([]);
    }
    context.log('deleting items');
    const hslidResponses = await deleteFavourites(
      dataStorage.id,
      data,
      store,
      context,
    );
    context.log('deleted items');
    const responses = data.map((key: string, i: number) => {
      const response = hslidResponses[i];
      if (response && 'status' in response && 'statusText' in response) {
        return {
          key,
          status: hslidResponses[i]?.status,
          statusText: response.statusText,
        };
      } else {
        return {
          key,
          status: null,
          statusText: 'Error',
        };
      }
    });
    try {
      // redis delete key from cache
      const client = getClient();
      await client.expire(String(key), 0);
    } catch (err) {
      context.error(err); // redis IO error
    }
    const deleteSuccessful = responses.every(
      response => response.status === 204,
    );
    const favourites = await getFavourites(dataStorage.id);
    const filteredFavourites = filterFavourites(favourites, type);
    const responseBody = Object.values(filteredFavourites);
    return {
      status: deleteSuccessful ? 200 : 400,
      jsonBody: deleteSuccessful ? responseBody : responses,
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (err) {
    return createErrorResponse(<Err>err, context);
  }
}

functions.app.http('deleteFavourites', {
  methods: ['DELETE'],
  authLevel: 'function',
  handler: deleteFavouriteTrigger,
  route: 'favorites/{id}',
});
