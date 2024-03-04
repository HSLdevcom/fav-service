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
const validator_1 = require("../util/validator");
const createErrorResponse_1 = require("../util/createErrorResponse");
const Agent_1 = require("../agent/Agent");
const filterFavorites_1 = require("../util/filterFavorites");
const redisClient_1 = require("../util/redisClient");
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
        const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
        const store = (_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.store;
        const type = (_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.type;
        try {
            const schema = {
                hslId: userId,
                store: store,
            };
            validator_1.default(getSchema, schema);
        }
        catch (err) {
            context.res = createErrorResponse_1.default(err, context);
            return;
        }
        const key = String(store ? `${store}-${userId}` : userId);
        let cache;
        const client = redisClient_1.default();
        try {
            context.log('checking redis cache');
            const data = String(yield client.get(key));
            cache = { data: JSON.parse(data) };
        }
        catch (err) {
            context.log(err); // redis IO error - not fatal, just log
        }
        try {
            if (!cache || cache.data === null) {
                context.log('no data in cache');
                context.log('getting dataStorage');
                const dataStorage = yield Agent_1.getDataStorage(req.params.id, context);
                context.log('found datastorage');
                const favorites = yield Agent_1.getFavorites(dataStorage.id);
                const filteredFavorites = filterFavorites_1.default(favorites, type);
                const json = JSON.stringify(filteredFavorites);
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
        }
        catch (err) {
            context.res = createErrorResponse_1.default(err, context);
        }
    });
};
exports.default = getFavoritesTrigger;
