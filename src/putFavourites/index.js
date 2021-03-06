// @flow
import createErrorResponse from '../util/createErrorResponse'
import validate from '../util/validator'
import type {AzureContext, Request} from '../util/types'
import {
  getFavorites,
  updateFavorites,
  getDataStorage,
  createDataStorage,
} from '../agent/Agent'
import mergeFavorites from '../util/mergeFavorites'
import {
  getRedisHost,
  getRedisPass,
  getRedisPort,
} from '../util/helpers'
import Redis from 'ioredis'

const updateSchema = {
  properties: {
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          favouriteId: {type: 'string', format: 'uuid'},
          type: {enum: ['route', 'stop', 'station', 'place', 'bikeStation']},
          lastUpdated: {type: 'number'},
          gtfsId: {type: 'string'},
          gid: {type: 'string'},
          name: {type: 'string'},
          address: {type: 'string'},
          lat: {type: 'number'},
          lon: {type: 'number'},
          selectedIconId: {type: 'string'},
          layer: {type: 'string'},
          code: {oneOf: [{type: 'string'}, {type: 'null'}]},
          stationId: {type: 'string'},
          networks: {type: 'array', items: {type: 'string'}},
        },
        allOf: [
          {
            if: {
              properties: {
                type: {enum: ['route', 'stop', 'station']},
              },
            },
            then: {
              required: ['type', 'lastUpdated', 'gtfsId'],
            },
          },
          {
            if: {
              properties: {type: {const: 'place'}},
            },
            then: {
              required: ['type', 'lastUpdated', 'address'],
            },
          },
          {
            if: {
              properties: {type: {const: 'bikeStation'}},
            },
            then: {
              required: ['type', 'lastUpdated', 'stationId', 'networks'],
            },
          },
        ],
      },
      additionalProperties: false,
    },
    params: {
      type: 'object',
      properties: {
        id: {type: 'string'},
      },
      required: ['id'],
      additionalProperties: false,
    },
    query: {
      type: 'object',
      properties: {
        store: {type: 'string'},
      },
      required: ['store'],
    },
    method: {
      type: 'string',
      pattern: 'PUT',
    },
  },
  required: ['method', 'params', 'body'],
}

export default async function (context: AzureContext, req: Request) {
  try {
    const cache = {}
    const settings = {}
    settings.redisHost = getRedisHost()
    settings.redisPort = getRedisPort()
    settings.redisPass = getRedisPass()
    validate(updateSchema, req)
    const dataStorage = {
      id: '',
    }
    try {
      context.log('searching existing datastorage')
      const oldDataStorage = await getDataStorage(req.params.id)
      context.log('existing datastorage found')
      dataStorage.id = oldDataStorage.id
    } catch (err) {
      context.log('error occured')
      if (err.status && err.status === 404) {
        context.log('datastorage not found')
        try {
          context.log('trying to create new datastorage')
          const newDataStorage = await createDataStorage(req.params.id)
          context.log('datastorage created')
          dataStorage.id = newDataStorage
        } catch (err) {
          context.log('something went wrong creating datastorage')
          throw err
        }
      } else {
        context.log('some other error occured')
        context.log(err)
        throw err
      }
    }
    const store = req.query.store
    const key = store ? `${store}-${req.params.id}` : req.params.id
    context.log('getting favorites from datastorage')
    const currentFavorites: Object = await getFavorites(dataStorage.id)
    context.log('merging favorites with current ones')
    const mergedFavorites = await mergeFavorites(currentFavorites, req.body, store)
    context.log('updating favorites to datastorage')
    const response = await updateFavorites(dataStorage.id, mergedFavorites)
    cache.data = mergedFavorites
    // update data to redis with hslid key
    const redisOptions = settings.redisPass ? {password: settings.redisPass, tls: {servername: settings.redisHost}} : {}
    const client = new Redis(settings.redisPort, settings.redisHost, redisOptions)
    const waitForRedis = (client) => new Promise((resolve, reject) => {
      client.on('ready', async () => {
        context.log('redis connected')
        await client.set(key, JSON.stringify(cache.data), 'EX', 60 * 60 * 24 * 14)
        await client.quit()
        resolve()
      })
      client.on('error', async () => {
        context.log('redis error')
        await client.quit()
        reject()
      })
    })
    await waitForRedis(client)

    const statusCode = response.status === 204 ? 200 : response.status
    const responseBody = JSON.stringify(Object.values(mergedFavorites))
    context.res = {
      status: statusCode,
      body: statusCode > 204 ? response.data : responseBody,
    }
  } catch (err) {
    context.res = createErrorResponse(err, context.log)
  }
}
