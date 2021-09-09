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
exports.deleteFavorites = exports.updateFavorites = exports.getFavorites = exports.createDataStorage = exports.getDataStorage = void 0;
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
const axios_1 = require("axios");
const helpers_1 = require("../util/helpers");
const Err_1 = require("../util/Err");
const makeHslIdRequest = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const hslIdUrl = helpers_1.getHslIdUrl();
    const credentials = helpers_1.getManagementClientCredentials();
    options.url = `${hslIdUrl}${options.endpoint}`;
    options.headers = {
        Authorization: credentials,
        'Content-Type': 'application/json',
    };
    const response = yield axios_1.default(options);
    return response;
});
const getDataStorage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const managementClientId = helpers_1.getManagementClientId();
    const options = {
        method: 'GET',
        endpoint: '/api/rest/v1/datastorage',
        params: {
            dsfilter: `ownerId eq "${id}" and name eq "favorites-${managementClientId || ''}"`,
        },
    };
    try {
        const response = yield makeHslIdRequest(options);
        const dataStorage = response.data.resources[0];
        if (dataStorage) {
            return dataStorage;
        }
        else {
            throw new Err_1.default(404, 'DataStorage not found');
        }
    }
    catch (error) {
        throw new Err_1.default(404, 'DataStorage not found');
    }
});
exports.getDataStorage = getDataStorage;
const createDataStorage = (id) => __awaiter(void 0, void 0, void 0, function* () {
    const managementClientId = helpers_1.getManagementClientId();
    const options = {
        method: 'POST',
        endpoint: `/api/rest/v1/datastorage`,
        data: {
            name: `favorites-${managementClientId || ''}`,
            description: 'Suosikit',
            ownerId: id,
            adminAccess: [managementClientId],
            readAccess: [managementClientId, id],
            writeAccess: [managementClientId, id],
        },
    };
    const response = yield makeHslIdRequest(options);
    return response.data.id;
});
exports.createDataStorage = createDataStorage;
const getFavorites = (dsId) => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        method: 'GET',
        endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
    };
    try {
        const response = yield makeHslIdRequest(options);
        const favourites = response.data;
        return favourites;
    }
    catch (err) {
        return {};
    }
});
exports.getFavorites = getFavorites;
const updateFavorites = (dsId, favorites) => __awaiter(void 0, void 0, void 0, function* () {
    const options = {
        method: 'PUT',
        endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
        data: favorites,
    };
    const response = yield makeHslIdRequest(options);
    return response;
});
exports.updateFavorites = updateFavorites;
const deleteFavorites = (dsId, keys, store) => __awaiter(void 0, void 0, void 0, function* () {
    const responses = [];
    for (let i = 0; i < keys.length; i++) {
        try {
            const key = store ? `${store}-${keys[i]}` : keys[i];
            const options = {
                method: 'DELETE',
                endpoint: `/api/rest/v1/datastorage/${dsId}/data/${key}`,
            };
            responses.push(yield makeHslIdRequest(options));
        }
        catch (err) {
            responses.push(err);
        }
    }
    return responses;
});
exports.deleteFavorites = deleteFavorites;
