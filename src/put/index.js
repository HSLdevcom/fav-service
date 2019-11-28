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
          id: {type: 'string'},
          name: {type: 'string'},
          type: {type: 'string'},
          iconName: {type: 'string'},
          isStation: {type: 'boolean'},
          status: {type: 'string'},
          address: {
            type: 'object',
            properties: {
              name: {type: 'string'},
              desc: {type: 'string'},
              housenumber: {type: 'string'},
              street: {type: 'string'},
              postalcode: {type: ['string', 'null']},
              region: {type: ['string', 'null']},
              locality: {type: ['string', 'null']},
              neighbourhood: {type: ['string', 'null']},
              label: {type: 'string'},
              lat: {type: ['number', 'null']},
              lon: {type: ['number', 'null']},
              code: {type: ['string', 'null']},
              platformCode: {type: 'string'},
              nextDeparture: {type: 'string'},
              gtfsId: {type: 'string'},
              coordinates: {
                type: 'array',
                items: {type: 'number'},
              },
            },
            required: ['name'],
            additionalProperties: false,
          },
        },
        required: ['id', 'type', 'address'],
        additionalProperties: false,
      },
    },
    params: {
      type: 'object',
      properties: {
        id: {type: 'string'},
      },
      required: ['id'],
      additionalProperties: false,
    },
    method: {
      type: 'string',
      pattern: 'PUT',
    },
  },
  required: ['method', 'params', 'body'],
}

export default async function(context: AzureContext, req: Request) {
  context.log(req)
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
    } catch(err) {
      context.log('error occured')
      if (err.status && err.status === 404) {
        context.log('datastorage not found')
        try {
          context.log('trying to create new datastorage')
          const newDataStorage = await createDataStorage(req.params.id)
          context.log('datastorage created')
          dataStorage.id = newDataStorage
        } catch(err) {
          context.log('something went wrong creating datastorage')
          throw err
        }
      } else {
        context.log('some other error occured')
        context.log(err)
        throw err
      }
    }
    context.log('using dataStorage with id ' + dataStorage.id)
    const currentFavorites: Object = await getFavorites(dataStorage.id)
    const mergedFavorites = mergeFavorites(currentFavorites, req.body)
    const response = await updateFavorites(dataStorage.id, mergedFavorites)
    cache.data = mergedFavorites
    // update data to redis with hslid key
    const redisOptions = settings.redisPass ? {password: settings.redisPass, tls: {servername: settings.redisHost}} : {}
    const client = new Redis(settings.redisPort, settings.redisHost, redisOptions)
    const waitForRedis = (client) => new Promise((resolve, reject) => {
      client.on('ready', async() => {
        context.log('redis connected')
        await client.set(req.params.id, JSON.stringify(cache.data))
        await client.quit()
        resolve()
      })
      client.on('error', async() => {
        context.log('redis error')
        await client.quit()
        reject()
      })
    })
    await waitForRedis(client)

    context.res = {
      status: response.status,
      body: response.data,
    }
  } catch(err) {
    context.res = createErrorResponse(err, context.log)
  }
}
