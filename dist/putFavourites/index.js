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
const createErrorResponse_1 = require("../util/createErrorResponse");
const validator_1 = require("../util/validator");
const Agent_1 = require("../agent/Agent");
const mergeFavorites_1 = require("../util/mergeFavorites");
const helpers_1 = require("../util/helpers");
const filterFavorites_1 = require("../util/filterFavorites");
const ioredis_1 = require("ioredis");
const updateSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'array',
            items: {
                type: 'object',
                properties: {
                    favouriteId: { type: 'string', format: 'uuid' },
                    noteId: { type: 'string' },
                    type: {
                        enum: [
                            'route',
                            'stop',
                            'station',
                            'place',
                            'bikeStation',
                            'note',
                            'postalCode',
                        ],
                    },
                    lastUpdated: { type: 'number' },
                    gtfsId: { type: 'string' },
                    gid: { type: 'string' },
                    name: { type: 'string' },
                    address: { type: 'string' },
                    lat: { type: 'number' },
                    lon: { type: 'number' },
                    selectedIconId: { type: 'string' },
                    layer: { type: 'string' },
                    code: { oneOf: [{ type: 'string' }, { type: 'null' }] },
                    stationId: { type: 'string' },
                    networks: { type: 'array', items: { type: 'string' } },
                    expires: { type: 'number' },
                    postalCode: { type: 'string' },
                },
                allOf: [
                    {
                        if: {
                            properties: {
                                type: { enum: ['route', 'stop', 'station'] },
                            },
                        },
                        then: {
                            required: ['type', 'lastUpdated', 'gtfsId'],
                        },
                    },
                    {
                        if: {
                            properties: { type: { const: 'place' } },
                        },
                        then: {
                            required: ['type', 'lastUpdated', 'address', 'lat', 'lon'],
                        },
                    },
                    {
                        if: {
                            properties: { type: { const: 'bikeStation' } },
                        },
                        then: {
                            required: ['type', 'lastUpdated', 'stationId', 'networks'],
                        },
                    },
                    {
                        if: {
                            properties: { type: { const: 'note' } },
                        },
                        then: {
                            required: ['type', 'expires', 'noteId'],
                        },
                    },
                    {
                        if: {
                            properties: { type: { const: 'postalCode' } },
                        },
                        then: {
                            required: ['type', 'postalCode', 'lastUpdated'],
                        },
                    },
                ],
            },
            additionalProperties: false,
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
};
const expireNotes = (context, dsId, favorites) => __awaiter(void 0, void 0, void 0, function* () {
    const hasNotes = Object.keys(favorites).some(key => String(favorites[key].type) === 'note');
    if (!hasNotes) {
        context.log('no notes');
        return;
    }
    context.log('delete expired notes');
    const deleteResponses = yield Agent_1.deleteExpiredNotes(dsId, favorites);
    if (deleteResponses.length > 0) {
        const deleteSuccessful = deleteResponses.every((response) => response.status === 204);
        if (deleteSuccessful) {
            context.log('expired notes succesfully');
        }
        else {
            context.log('expiring notes failed');
        }
    }
});
const putFavoritesTrigger = function (context, req) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const settings = {};
            settings.redisHost = helpers_1.getRedisHost();
            settings.redisPort = helpers_1.getRedisPort();
            settings.redisPass = helpers_1.getRedisPass();
            const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
            const store = (_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.store;
            const type = (_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.type;
            const schema = {
                body: req === null || req === void 0 ? void 0 : req.body,
                hslId: userId,
                store: store && String(store),
            };
            validator_1.default(updateSchema, schema);
            const dataStorage = {
                id: '',
            };
            try {
                context.log('searching existing datastorage');
                const oldDataStorage = yield Agent_1.getDataStorage(req.params.id);
                context.log('existing datastorage found');
                dataStorage.id = oldDataStorage.id;
            }
            catch (err) {
                context.log('error occured');
                if (err.status && err.status === 404) {
                    context.log('datastorage not found');
                    try {
                        context.log('trying to create new datastorage');
                        const newDataStorage = yield Agent_1.createDataStorage(req.params.id);
                        context.log('datastorage created');
                        dataStorage.id = newDataStorage;
                    }
                    catch (err) {
                        context.log('something went wrong creating datastorage');
                        throw err;
                    }
                }
                else {
                    context.log('some other error occured');
                    context.log(err);
                    throw err;
                }
            }
            const key = String(store ? `${store}-${userId}` : userId);
            context.log('getting favorites from datastorage');
            const currentFavorites = yield Agent_1.getFavorites(dataStorage.id);
            context.log('merging favorites with current ones');
            const mergedFavorites = yield mergeFavorites_1.default(currentFavorites, req.body, String(store));
            yield expireNotes(context, dataStorage.id, mergedFavorites);
            context.log('updating favorites to datastorage');
            const response = yield Agent_1.updateFavorites(dataStorage.id, mergedFavorites);
            const cache = { data: mergedFavorites };
            // update data to redis with hslid key
            const redisOptions = settings.redisPass
                ? {
                    password: settings.redisPass,
                    tls: { servername: settings.redisHost },
                }
                : {};
            const client = new ioredis_1.default(Object.assign({ port: settings.redisPort, host: settings.redisHost }, redisOptions));
            const waitForRedis = (client) => __awaiter(this, void 0, void 0, function* () {
                yield client.set(key, JSON.stringify(cache.data), 'EX', 60 * 60 * 24 * 14);
                yield client.quit();
            });
            yield waitForRedis(client);
            const filteredFavorites = filterFavorites_1.default(mergedFavorites, type);
            const statusCode = response.status === 204 ? 200 : response.status;
            const responseBody = JSON.stringify(Object.values(filteredFavorites));
            context.res = {
                status: statusCode,
                body: statusCode > 204 ? response.data : responseBody,
                headers: {
                    'Content-Type': 'application/json',
                },
            };
        }
        catch (err) {
            context.res = createErrorResponse_1.default(err, context);
        }
    });
};
exports.default = putFavoritesTrigger;
