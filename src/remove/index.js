// @flow
import createErrorResponse from '../util/createErrorResponse'
import validate from '../util/validator'
import type {AzureContext, Request} from '../util/types'
import {
  deleteFavorites,
  getDataStorage,
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
    context.log(req)

    context.log('getting dataStorage')
    const dataStorage = await getDataStorage(req.params.id)
    context.log(`got dataStorage with id ${dataStorage.id}`)
    context.log('deleting items')
    const responses = await deleteFavorites(dataStorage.id, req.body)
    context.log('deleted items')
    const success = req.body.map((key, i) => {
      return {
        key,
        status: responses[i].status,
        statusText: responses[i].statusText,
      }
    })
    context.log(success)
    // redis delete key from cache
    const redisOptions = settings.redisPass ? {password: settings.redisPass, tls: {servername: settings.redisHost}} : {}
    const client = new Redis(settings.redisPort, settings.redisHost, redisOptions)
    const waitForRedis = (client) => new Promise((resolve, reject) => {
      client.on('ready', async () => {
        context.log('redis connected')
        await client.expire(req.params.id, 0)
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

    context.res = {
      status: 200,
      body: JSON.stringify(success),
    }
  } catch (err) {
    context.res = createErrorResponse(err, context.log)
  }
}
