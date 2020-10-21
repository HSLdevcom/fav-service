"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

var _createErrorResponse = _interopRequireDefault(require("../util/createErrorResponse"));

var _validator = _interopRequireDefault(require("../util/validator"));

var _Agent = require("../agent/Agent");

var _mergeFavorites = _interopRequireDefault(require("../util/mergeFavorites"));

var _helpers = require("../util/helpers");

var _ioredis = _interopRequireDefault(require("ioredis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const updateSchema = {
  properties: {
    body: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          favouriteId: {
            type: 'string',
            format: 'uuid'
          },
          type: {
            type: 'string'
          },
          lastUpdated: {
            type: 'number'
          },
          gtfsId: {
            type: 'string'
          },
          gid: {
            type: 'string'
          },
          name: {
            type: 'string'
          },
          address: {
            type: 'string'
          },
          lat: {
            type: 'number'
          },
          lon: {
            type: 'number'
          },
          selectedIconId: {
            type: 'string'
          },
          layer: {
            type: 'string'
          }
        },
        required: ['type', 'lastUpdated']
      },
      additionalProperties: false
    },
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
    query: {
      type: 'object',
      properties: {
        store: {
          type: 'string'
        }
      },
      required: ['store']
    },
    method: {
      type: 'string',
      pattern: 'PUT'
    }
  },
  required: ['method', 'params', 'body']
};

async function _default(context, req) {
  try {
    const cache = {};
    const settings = {};
    settings.redisHost = (0, _helpers.getRedisHost)();
    settings.redisPort = (0, _helpers.getRedisPort)();
    settings.redisPass = (0, _helpers.getRedisPass)();
    (0, _validator.default)(updateSchema, req);
    const dataStorage = {
      id: ''
    };

    try {
      context.log('searching existing datastorage');
      const oldDataStorage = await (0, _Agent.getDataStorage)(req.params.id);
      context.log('existing datastorage found');
      dataStorage.id = oldDataStorage.id;
    } catch (err) {
      context.log('error occured');

      if (err.status && err.status === 404) {
        context.log('datastorage not found');

        try {
          context.log('trying to create new datastorage');
          const newDataStorage = await (0, _Agent.createDataStorage)(req.params.id);
          context.log('datastorage created', newDataStorage);
          dataStorage.id = newDataStorage.id;
        } catch (err) {
          context.log('something went wrong creating datastorage');
          throw err;
        }
      } else {
        context.log('some other error occured');
        context.log(err);
        throw err;
      }
    }

    context.log('using dataStorage with id ' + dataStorage.id);
    const store = req.query.store;
    const key = store ? `${store}-${req.params.id}` : req.params.id;
    const currentFavorites = await (0, _Agent.getFavorites)(dataStorage.id);
    const mergedFavorites = await (0, _mergeFavorites.default)(currentFavorites, req.body, store);
    const response = await (0, _Agent.updateFavorites)(dataStorage.id, mergedFavorites);
    context.log('updateFavorites', response);
    cache.data = mergedFavorites; // update data to redis with hslid key

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
        await client.set(key, JSON.stringify(cache.data), 'EX', 60 * 60 * 24 * 14);
        await client.quit();
        resolve();
      });
      client.on('error', async () => {
        context.log('redis error');
        await client.quit();
        reject();
      });
    });

    await waitForRedis(client);
    context.res = {
      status: response.status,
      body: response.data
    };
  } catch (err) {
    context.res = (0, _createErrorResponse.default)(err, context.log);
  }
}