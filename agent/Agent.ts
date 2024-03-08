/* eslint-disable @typescript-eslint/no-unsafe-assignment */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-return */
import { AxiosResponse } from 'axios';
import { Context } from '@azure/functions';
import Err from '../util/Err';
import { HsldIdOptions, Favourites } from '../util/types';
import getAxios from '../util/axiosClient';
import { getHslIdUrl, getManagementClientId } from '../util/helpers';

const makeHslIdRequest = async (
  options: HsldIdOptions,
): Promise<AxiosResponse> => {
  const client = getAxios();
  const hslIdUrl = getHslIdUrl();
  options.url = `${hslIdUrl}${options.endpoint}`;
  const response: AxiosResponse = await client(options);
  return response;
};

export const getDataStorage = async (
  id: string | undefined,
  context: Context,
): Promise<{ [key: string]: string } | null> => {
  const managementClientId = getManagementClientId();
  const options: HsldIdOptions = {
    method: 'GET',
    endpoint: '/api/rest/v1/datastorage',
    params: {
      dsfilter: `ownerId eq "${id}" and name eq "favourites-${
        managementClientId || ''
      }"`,
    },
  };
  try {
    const response = await makeHslIdRequest(options);
    const dataStorage = response.data?.resources?.[0];
    if (dataStorage) {
      return dataStorage;
    }
  } catch (err) {
    if (err?.response) {
      context.error(err.response.data);
      context.error(err.response.status);
    } else if (err?.message) {
      context.error(err.message);
    } else {
      context.error(err);
    }
    throw new Err(404, 'Could not get datastorage');
  }
  context.log('User has no datastorage');
  return null;
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
        name: `favourites-${managementClientId || ''}`,
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
    context.error(err);
    throw new Err(500, `Creating datastorage failed`);
  }
};

export const getFavourites = async (
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

export const updateFavourites = async (
  dsId: string | undefined,
  favourites: Favourites,
  context: Context,
): Promise<AxiosResponse> => {
  try {
    const options: HsldIdOptions = {
      method: 'PUT',
      endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
      data: favourites,
    };
    const response = await makeHslIdRequest(options);
    return response;
  } catch (err) {
    context.error(err);
    throw new Err(500, `Updating datastorage failed`);
  }
};

export const deleteFavourites = async (
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
      context.error(err);
      responses.push(err);
    }
  }
  return responses;
};

export const deleteExpiredNotes = async (
  dsId: string | undefined,
  favourites: Favourites,
  context: Context,
): Promise<AxiosResponse<string>[]> => {
  let responses = [];
  const expired: string[] = [];
  const keys = Object.keys(favourites);
  keys.forEach(key => {
    const fav = favourites[key];
    const now = Math.floor(Date.now() / 1000); // Unix time in seconds
    if (String(fav.type) === 'note' && Number(fav?.expires) < now) {
      expired.push(key);
      delete favourites[key];
    }
  });
  responses = await deleteFavourites(dsId, expired, undefined, context);
  return responses;
};
