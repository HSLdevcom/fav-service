"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
const Redis = require("ioredis");
const validator_1 = require("../util/validator");
const createErrorResponse_1 = require("../util/createErrorResponse");
const Agent_1 = require("../agent/Agent");
const helpers_1 = require("../util/helpers");
const filterFavorites_1 = require("../util/filterFavorites");
const getSchema = {
    type: 'object',
    properties: {
        hslId: {
            type: 'string',
        },
        store: {
            type: 'string',
        },
    },
    required: ['hslId', 'store'],
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
};
const getFavoritesTrigger = function (context, req) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        const settings = {};
        const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const store = (_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.store;
        const type = (_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.type;
        try {
            const schema = {
                hslId: userId,
                store: store,
            };
            validator_1.default(getSchema, schema);
            settings.redisHost = helpers_1.getRedisHost();
            settings.redisPort = helpers_1.getRedisPort();
            settings.redisPass = helpers_1.getRedisPass();
        }
        catch (err) {
            context.res = createErrorResponse_1.default(err, context);
            return;
        }
        const redisOptions = settings.redisPass
            ? { password: settings.redisPass, tls: { servername: settings.redisHost } }
            : {};
        const client = new Redis(settings.redisPort, settings.redisHost, redisOptions);
        const key = String(store ? `${store}-${userId}` : userId);
        let cache;
        const waitForRedis = (client) => new Promise((resolve, reject) => {
            client.on('ready', () => __awaiter(this, void 0, void 0, function* () {
                context.log('redis connected');
                const data = String(yield client.get(key));
                cache = { data: JSON.parse(data) };
                resolve();
            }));
            client.on('error', () => __awaiter(this, void 0, void 0, function* () {
                context.log('redis error');
                reject();
            }));
        });
        try {
            // redis check cache
            context.log('checking redis cache');
            yield waitForRedis(client);
            if (!cache || cache.data === null) {
                context.log('no data in cache');
                context.log('getting dataStorage');
                const dataStorage = yield Agent_1.getDataStorage(req.params.id);
                context.log('found datastorage');
                const favorites = yield Agent_1.getFavorites(dataStorage.id);
                const filteredFavorites = filterFavorites_1.default(favorites, type);
                const json = JSON.stringify(filteredFavorites);
                // cache data
                context.log('caching data');
                yield client.set(key, JSON.stringify(favorites), 'EX', 60 * 60 * 24 * 14);
                context.res = {
                    status: 200,
                    body: json,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };
            }
            else {
                context.log('found data in cache');
                const filteredFavorites = filterFavorites_1.default(cache.data, type);
                const json = JSON.stringify(filteredFavorites);
                context.res = {
                    status: 200,
                    body: json,
                    headers: {
                        'Content-Type': 'application/json',
                    },
                };
            }
            client.quit();
        }
        catch (err) {
            client.quit();
            context.res = createErrorResponse_1.default(err, context);
        }
    });
};
exports.default = getFavoritesTrigger;
//# sourceMappingURL=index.js.map