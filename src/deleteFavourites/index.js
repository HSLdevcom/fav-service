// @flow
import createErrorResponse from '../util/createErrorResponse'
import validate from '../util/validator'
import type {AzureContext, Request} from '../util/types'
import {
  deleteFavorites,
  getDataStorage,
  getFavorites,
} from '../agent/Agent'
import {
  getRedisHost,
  getRedisPass,
  getRedisPort,
} from '../util/helpers'
import Redis from 'ioredis'

const deleteSchema = {
  properties: {
    params: {
      type: 'object',
      properties: {
        id: {type: 'string'},
      },
      required: ['id'],
      additionalProperties: false,
    },
    body: {
      type: 'array',
      items: {type: 'string'},
    },
    method: {
      type: 'string',
      pattern: 'DELETE',
    },
    query: {
      type: 'object',
      properties: {
        store: {type: 'string'},
      },
      required: ['store'],
    },
  },
  required: ['params', 'method', 'body'],
}

export default async function (context: AzureContext, req: Request) {
  try {
    const settings = {}
    settings.redisHost = getRedisHost()
    settings.redisPort = getRedisPort()
    settings.redisPass = getRedisPass()
    validate(deleteSchema, req)
    const store = req.query.store
    const key = store ? `${store}-${req.params.id}` : req.params.id
    context.log('getting dataStorage')
    const dataStorage = await getDataStorage(req.params.id)
    context.log('deleting items')
    const hslidResponses = await deleteFavorites(dataStorage.id, req.body, store)
    context.log('deleted items')
    const responses = req.body.map((key, i) => {
      return {
        key,
        status: hslidResponses[i].status,
        statusText: hslidResponses[i].statusText,
      }
    })
    // redis delete key from cache
    const redisOptions = settings.redisPass ? {password: settings.redisPass, tls: {servername: settings.redisHost}} : {}
    const client = new Redis(settings.redisPort, settings.redisHost, redisOptions)
    const waitForRedis = (client) => new Promise((resolve, reject) => {
      client.on('ready', async () => {
        context.log('redis connected')
        await client.expire(key, 0)
        client.quit()
        resolve()
      })
      client.on('error', async () => {
        context.log('redis error')
        client.quit()
        reject()
      })
    })
    await waitForRedis(client)

    const deleteSuccessful = responses.every((response) => response.status === 204)
    const favorites = await getFavorites(dataStorage.id)
    const responseBody = JSON.stringify(Object.values(favorites))
    context.res = {
      status: deleteSuccessful ? 200 : 400,
      body: deleteSuccessful ? responseBody : responses,
    }
  } catch (err) {
    context.res = createErrorResponse(err, context.log)
  }
}
