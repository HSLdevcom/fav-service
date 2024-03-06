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
exports.deleteExpiredNotes = exports.deleteFavorites = exports.updateFavorites = exports.getFavorites = exports.createDataStorage = exports.getDataStorage = void 0;
const Err_1 = require("../util/Err");
const axiosClient_1 = require("../util/axiosClient");
const helpers_1 = require("../util/helpers");
const makeHslIdRequest = (options) => __awaiter(void 0, void 0, void 0, function* () {
    const client = axiosClient_1.default();
    const hslIdUrl = helpers_1.getHslIdUrl();
    options.url = `${hslIdUrl}${options.endpoint}`;
    const response = yield client(options);
    return response;
});
const getDataStorage = (id, context) => __awaiter(void 0, void 0, void 0, function* () {
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
    }
    catch (err) {
        context.log(err);
        throw new Err_1.default(404, 'Could not get datastorage');
    }
    // handle nonexisting datastorabe by throwing an error
    throw new Err_1.default(404, 'User has no datastorage');
});
exports.getDataStorage = getDataStorage;
const createDataStorage = (id, context) => __awaiter(void 0, void 0, void 0, function* () {
    try {
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
    }
    catch (err) {
        context.log(err);
        throw new Err_1.default(500, `Creating datastorage failed`);
    }
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
const updateFavorites = (dsId, favorites, context) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const options = {
            method: 'PUT',
            endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
            data: favorites,
        };
        const response = yield makeHslIdRequest(options);
        return response;
    }
    catch (err) {
        context.log(err);
        throw new Err_1.default(500, `Updating datastorage failed`);
    }
});
exports.updateFavorites = updateFavorites;
const deleteFavorites = (dsId, keys, store, context) => __awaiter(void 0, void 0, void 0, function* () {
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
            context.log(err);
            responses.push(err);
        }
    }
    return responses;
});
exports.deleteFavorites = deleteFavorites;
const deleteExpiredNotes = (dsId, favorites, context) => __awaiter(void 0, void 0, void 0, function* () {
    let responses = [];
    const expired = [];
    const keys = Object.keys(favorites);
    keys.forEach(key => {
        const fav = favorites[key];
        const now = Math.floor(Date.now() / 1000); // Unix time in seconds
        if (String(fav.type) === 'note' && Number(fav === null || fav === void 0 ? void 0 : fav.expires) < now) {
            expired.push(key);
            delete favorites[key];
        }
    });
    responses = yield exports.deleteFavorites(dsId, expired, undefined, context);
    return responses;
});
exports.deleteExpiredNotes = deleteExpiredNotes;
