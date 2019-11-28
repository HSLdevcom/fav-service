"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.deleteFavorites = exports.updateFavorites = exports.getFavorites = exports.createDataStorage = exports.getDataStorage = void 0;

var _axios = _interopRequireDefault(require("axios"));

var _helpers = require("../util/helpers");

var _Err = _interopRequireDefault(require("../util/Err"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const makeHslIdRequest = async options => {
  const hslIdUrl = (0, _helpers.getHslIdUrl)();
  const credentials = (0, _helpers.getManagementClientCredentials)();
  options.url = `${hslIdUrl}${options.endpoint}`, options.headers = {
    'Authorization': credentials,
    'Content-Type': 'application/json'
  };
  const response = await (0, _axios.default)(options);
  return response;
};

const getDataStorage = async id => {
  const options = {
    method: 'GET',
    endpoint: '/api/rest/v1/datastorage',
    params: {
      dsfilter: `ownerId eq "${id}" and name eq "favorites"`
    }
  };
  const response = await makeHslIdRequest(options);

  try {
    const dataStorage = response.data.resources[0];
    return dataStorage;
  } catch (error) {
    throw new _Err.default(404, 'DataStorage not found');
  }
};

exports.getDataStorage = getDataStorage;

const createDataStorage = async id => {
  const managementClientId = (0, _helpers.getManagementClientId)();
  const options = {
    method: 'POST',
    endpoint: `/api/rest/v1/datastorage`,
    data: {
      name: 'favorites',
      description: 'Suosikit',
      ownerId: id,
      adminAccess: [managementClientId],
      readAccess: [managementClientId],
      writeAccess: [managementClientId]
    }
  };
  const response = await makeHslIdRequest(options);
  return response.data.id;
};

exports.createDataStorage = createDataStorage;

const getFavorites = async dsId => {
  const options = {
    method: 'GET',
    endpoint: `/api/rest/v1/datastorage/${dsId}/data`
  };

  try {
    const response = await makeHslIdRequest(options);
    return response.data;
  } catch (err) {
    return {};
  }
};

exports.getFavorites = getFavorites;

const updateFavorites = async (dsId, favorites) => {
  const options = {
    method: 'PUT',
    endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
    data: favorites
  };
  const response = await makeHslIdRequest(options);
  return response;
};

exports.updateFavorites = updateFavorites;

const deleteFavorites = async (dsId, keys) => {
  const responses = [];

  for (let i = 0; i < keys.length; i++) {
    try {
      const key = keys[i];
      const options = {
        method: 'DELETE',
        endpoint: `/api/rest/v1/datastorage/${dsId}/data/${key}`
      };
      responses.push((await makeHslIdRequest(options)));
    } catch (err) {
      responses.push(err);
    }
  }

  return responses;
};

exports.deleteFavorites = deleteFavorites;