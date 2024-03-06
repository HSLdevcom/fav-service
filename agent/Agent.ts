/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
kyimport axios, { AxiosResponse } from 'axios';
import { Context } from '@azure/functions';
import {
  getHslIdUrl,
  getManagementClientCredentials,
  getManagementClientId,
} from '../util/helpers';
import { HsldIdOptions, Favourites } from '../util/types';
import Err from '../util/Err';

const makeHslIdRequest = async (
  options: HsldIdOptions,
): Promise<AxiosResponse> => {
  const hslIdUrl = getHslIdUrl();
  const credentials = getManagementClientCredentials();
  options.url = `${hslIdUrl}${options.endpoint}`;
  options.headers = {
    Authorization: credentials,
    'Content-Type': 'application/json',
  };
  const response: AxiosResponse = await axios(options);
  return response;
};

export const getDataStorage = async (
  id: string | undefined,
  context: Context,
): Promise<{ [key: string]: string }> => {
  const managementClientId = getManagementClientId();
  const options: HsldIdOptions = {
    method: 'GET',
    endpoint: '/api/rest/v1/datastorage',
    params: {
      dsfilter: `ownerId eq "${id}" and name eq "favorites-${
        managementClientId || ''
      }"`,
    },
  };
  try {
    const response = await makeHslIdRequest(options);
    const dataStorage = response.data.resources[0];
    if (dataStorage) {
      return dataStorage;
    }
  } catch (err) {
    context.log(err);
    throw new Err(404, 'Could not get datastorage');
  }
  // handle nonexisting datastorabe by throwing an error
  throw new Err(404, 'User has no datastorage');
};

export const createDataStorage = async (
  id: string | undefined,
  context: Context,
): Promise<string> => {
  try {
    const managementClientId = getManagementClientId();
    const options: HsldIdOptions = {
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
    const response = await makeHslIdRequest(options);
    return response.data.id;
  } catch (err) {
    context.log(err);
    throw new Err(500, `Creating datastorage failed`);
  }
};

export const getFavorites = async (
  dsId: string | undefined,
): Promise<Favourites> => {
  const options: HsldIdOptions = {
    method: 'GET',
    endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
  };
  try {
    const response: AxiosResponse = await makeHslIdRequest(options);
    const favourites = response.data;
    return favourites;
  } catch (err) {
    return {};
  }
};

export const updateFavorites = async (
  dsId: string | undefined,
  favorites: Favourites,
  context: Context,
): Promise<AxiosResponse> => {
  try {
    const options: HsldIdOptions = {
      method: 'PUT',
      endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
      data: favorites,
    };
    const response = await makeHslIdRequest(options);
    return response;
  } catch (err) {
    context.log(err);
    throw new Err(500, `Updating datastorage failed`);
  }
};

export const deleteFavorites = async (
  dsId: string | undefined,
  keys: Array<string>,
  store: string | undefined,
  context: Context,
): Promise<AxiosResponse<string>[]> => {
  const responses = [];
  for (let i = 0; i < keys.length; i++) {
    try {
      const key = store ? `${store}-${keys[i]}` : keys[i];
      const options: HsldIdOptions = {
        method: 'DELETE',
        endpoint: `/api/rest/v1/datastorage/${dsId}/data/${key}`,
      };
      responses.push(await makeHslIdRequest(options));
    } catch (err) {
      context.log(err);
      responses.push(err);
    }
  }
  return responses;
};

export const deleteExpiredNotes = async (
  dsId: string | undefined,
  favorites: Favourites,
  context: Context,
): Promise<AxiosResponse<string>[]> => {
  let responses = [];
  const expired: string[] = [];
  const keys = Object.keys(favorites);
  keys.forEach(key => {
    const fav = favorites[key];
    const now = Math.floor(Date.now() / 1000); // Unix time in seconds
    if (String(fav.type) === 'note' && Number(fav?.expires) < now) {
      expired.push(key);
      delete favorites[key];
    }
  });
  responses = await deleteFavorites(dsId, expired, undefined, context);
  return responses;
};
