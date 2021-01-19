"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = _default;

require("core-js/modules/es6.array.iterator.js");

var _validator = _interopRequireDefault(require("../util/validator"));

var _createErrorResponse = _interopRequireDefault(require("../util/createErrorResponse"));

var _Agent = require("../agent/Agent.js");

var _helpers = require("../util/helpers");

var _ioredis = _interopRequireDefault(require("ioredis"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const getSchema = {
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
      pattern: 'GET'
    }
  },
  required: ['params', 'method']
};

const filterFavorites = favorites => {
  const keys = Object.keys(favorites);
  const responseArray = keys.map(key => {
    return favorites[key];
  });
  const filteredArray = responseArray.filter(item => {
    return item !== null;
  });
  return filteredArray;
};

async function _default(context, req) {
  const cache = {};
  const settings = {};

  try {
    (0, _validator.default)(getSchema, req);
    settings.redisHost = (0, _helpers.getRedisHost)();
    settings.redisPort = (0, _helpers.getRedisPort)();
    settings.redisPass = (0, _helpers.getRedisPass)();
  } catch (err) {
    context.res = (0, _createErrorResponse.default)(err, context.log);
    return;
  }

  const redisOptions = settings.redisPass ? {
    password: settings.redisPass,
    tls: {
      servername: settings.redisHost
    }
  } : {};
  const client = new _ioredis.default(settings.redisPort, settings.redisHost, redisOptions);
  const store = req.query.store;
  const key = store ? `${store}-${req.params.id}` : req.params.id;

  const waitForRedis = client => new Promise((resolve, reject) => {
    client.on('ready', async () => {
      context.log('redis connected');
      const data = await client.get(key);
      context.log(data);
      cache.data = JSON.parse(data);
      resolve();
    });
    client.on('error', async () => {
      context.log('redis error');
      reject();
    });
  });

  try {
    // redis check cache
    context.log('checking redis cache');
    await waitForRedis(client);

    if (cache.data === null) {
      context.log('no data in cache');
      context.log('getting dataStorage');
      const dataStorage = await (0, _Agent.getDataStorage)(req.params.id);
      context.log(`found datastorage with id ${dataStorage.id}`);
      const favorites = await (0, _Agent.getFavorites)(dataStorage.id);
      const filteredFavorites = filterFavorites(favorites); // cache data

      context.log('caching data');
      await client.set(key, JSON.stringify(favorites), 'EX', 60 * 60 * 24 * 14);
      context.res = {
        status: 200,
        body: filteredFavorites
      };
    } else {
      context.log('found data in cache');
      const filteredFavorites = filterFavorites(cache.data);
      context.res = {
        status: 200,
        body: filteredFavorites
      };
    }

    client.quit();
  } catch (err) {
    client.quit();
    context.res = (0, _createErrorResponse.default)(err, context.log);
  }
}