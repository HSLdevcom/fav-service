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
const filterFavorites_1 = require("../util/filterFavorites");
const redisClient_1 = require("../util/redisClient");
const deleteSchema = {
    type: 'object',
    properties: {
        body: {
            type: 'array',
            items: { type: 'string' },
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
const deleteFavouriteTrigger = function (context, req) {
    var _a, _b, _c;
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const userId = (_a = req === null || req === void 0 ? void 0 : req.params) === null || _a === void 0 ? void 0 : _a.id;
            const store = (_b = req === null || req === void 0 ? void 0 : req.query) === null || _b === void 0 ? void 0 : _b.store;
            const type = (_c = req === null || req === void 0 ? void 0 : req.query) === null || _c === void 0 ? void 0 : _c.type;
            const schema = {
                body: req === null || req === void 0 ? void 0 : req.body,
                hslId: userId,
                store: store && String(store),
            };
            validator_1.default(deleteSchema, schema);
            const key = store ? `${store}-${req.params.id}` : req.params.id;
            context.log('getting dataStorage');
            const dataStorage = yield Agent_1.getDataStorage(req.params.id, context);
            context.log('deleting items');
            const hslidResponses = yield Agent_1.deleteFavorites(dataStorage.id, req === null || req === void 0 ? void 0 : req.body, store, context);
            context.log('deleted items');
            const responses = req.body.map((key, i) => {
                var _a, _b;
                return {
                    key,
                    status: (_a = hslidResponses[i]) === null || _a === void 0 ? void 0 : _a.status,
                    statusText: (_b = hslidResponses[i]) === null || _b === void 0 ? void 0 : _b.statusText,
                };
            });
            try {
                // redis delete key from cache
                const client = redisClient_1.default();
                yield client.expire(String(key), 0);
            }
            catch (err) {
                context.log(err); // redis IO error
            }
            const deleteSuccessful = responses.every((response) => response.status === 204);
            const favorites = yield Agent_1.getFavorites(dataStorage.id);
            const filteredFavorites = filterFavorites_1.default(favorites, type);
            const responseBody = JSON.stringify(Object.values(filteredFavorites));
            context.res = {
                status: deleteSuccessful ? 200 : 400,
                body: deleteSuccessful ? responseBody : responses,
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
exports.default = deleteFavouriteTrigger;
