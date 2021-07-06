// @flow
import type {AzureContext, Request} from '../util/types'
import validate from '../util/validator'
import createErrorResponse from '../util/createErrorResponse'
import {
  getDataStorage,
  getFavorites,
} from '../agent/Agent.js'
import {
  getRedisHost,
  getRedisPort,
  getRedisPass,
} from '../util/helpers'
import Redis from 'ioredis'

const getSchema = {
  properties: {
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
      pattern: 'GET',
    },
  },
  required: ['params', 'method'],
}

const filterFavorites = (favorites: Object) => {
  const keys = Object.keys(favorites)
  const responseArray: Array<Object> = keys.map((key) => {
    return favorites[key]
  })
  const filteredArray: Array<Object> = responseArray.filter((item) => {
    return item !== null
  })
  return filteredArray
}

export default async function (context: AzureContext, req: Request) {
  const cache = {}
  const settings = {}
  try {
    validate(getSchema, req)
    settings.redisHost = getRedisHost()
    settings.redisPort = getRedisPort()
    settings.redisPass = getRedisPass()
  } catch(err) {
    context.res = createErrorResponse(err, context.log)
    return
  }
  const redisOptions = settings.redisPass ? {password: settings.redisPass, tls: {servername: settings.redisHost}} : {}
  const client = new Redis(settings.redisPort, settings.redisHost, redisOptions)
  const store = req.query.store
  const key = store ? `${store}-${req.params.id}` : req.params.id
  const waitForRedis = (client) => new Promise((resolve, reject) => {
    client.on('ready', async() => {
      context.log('redis connected')
      const data = await client.get(key)
      cache.data = JSON.parse(data)
      resolve()
    })
    client.on('error', async() => {
      context.log('redis error')
      reject()
    })
  })
  try {
    // redis check cache
    context.log('checking redis cache')
    await waitForRedis(client)

    if (cache.data === null) {
      context.log('no data in cache')
      context.log('getting dataStorage')
      const dataStorage = await getDataStorage(req.params.id)
      context.log('found datastorage')
      const favorites: Object = await getFavorites(dataStorage.id)
      const filteredFavorites = filterFavorites(favorites)
      // cache data
      context.log('caching data')
      await client.set(key, JSON.stringify(favorites), 'EX', 60 * 60 * 24 * 14)
      context.res = {
        status: 200,
        body: filteredFavorites,
      }
    } else {
      context.log('found data in cache')
      const filteredFavorites = filterFavorites(cache.data)
      context.res = {
        status: 200,
        body: filteredFavorites,
      }
    }
    client.quit()
  } catch(err) {
    client.quit()
    context.res = createErrorResponse(err, context.log)
  }
}
