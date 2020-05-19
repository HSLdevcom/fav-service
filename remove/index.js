"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _createErrorResponse = _interopRequireDefault(require("../util/createErrorResponse"));

var _validator = _interopRequireDefault(require("../util/validator"));

var _Agent = require("../agent/Agent");

var _helpers = require("../util/helpers");

var _ioredis = _interopRequireDefault(require("ioredis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const deleteSchema = {
  properties: {
    params: {
      type: 'object',
      properties: {
        id: {
          type: 'string'
        }
      },
      required: ['id'],
      additionalProperties: false
    },
    body: {
      type: 'array',
      items: {
        type: 'string'
      }
    },
    method: {
      type: 'string',
      pattern: 'DELETE'
    },
    query: {
      type: 'object',
      properties: {
        store: {
          type: 'string'
        }
      },
      required: ['store']
    }
  },
  required: ['params', 'method', 'body']
};

async function _default(context, req) {
  try {
    const settings = {};
    settings.redisHost = (0, _helpers.getRedisHost)();
    settings.redisPort = (0, _helpers.getRedisPort)();
    settings.redisPass = (0, _helpers.getRedisPass)();
    (0, _validator.default)(deleteSchema, req);
    context.log(req);
    const store = req.query.store;
    const key = store ? `${store}-${req.params.id}` : req.params.id;
    context.log('getting dataStorage');
    const dataStorage = await (0, _Agent.getDataStorage)(req.params.id);
    context.log(`got dataStorage with id ${dataStorage.id}`);
    context.log('deleting items');
    const responses = await (0, _Agent.deleteFavorites)(dataStorage.id, req.body, store);
    context.log('deleted items');
    const success = req.body.map((key, i) => {
      return {
        key,
        status: responses[i].status,
        statusText: responses[i].statusText
      };
    });
    context.log(success); // redis delete key from cache

    const redisOptions = settings.redisPass ? {
      password: settings.redisPass,
      tls: {
        servername: settings.redisHost
      }
    } : {};
    const client = new _ioredis.default(settings.redisPort, settings.redisHost, redisOptions);

    const waitForRedis = client => new Promise((resolve, reject) => {
      client.on('ready', async () => {
        context.log('redis connected');
        await client.expire(key, 0);
        client.quit();
        resolve();
      });
      client.on('error', async () => {
        context.log('redis error');
        client.quit();
        reject();
      });
    });

    await waitForRedis(client);
    context.res = {
      status: 200,
      body: JSON.stringify(success)
    };
  } catch (err) {
    context.res = (0, _createErrorResponse.default)(err, context.log);
  }
}