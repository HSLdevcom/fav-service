import { AxiosResponse, AxiosError } from 'axios';
import { InvocationContext } from '@azure/functions';
import Err from '../util/Err.js';
import { HsldIdOptions, Favourites } from '../util/types.js';
import getAxios from '../util/axiosClient.js';
import { getHslIdUrl, getManagementClientId } from '../util/helpers.js';

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
  context: InvocationContext,
): Promise<{ [key: string]: string } | null> => {
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
    const dataStorage = response.data?.resources?.[0];
    if (dataStorage) {
      return dataStorage;
    }
  } catch (err: unknown) {
    const error = err as AxiosError;
    if (error?.response) {
      context.error(error.response.data);
      context.error(error.response.status);
    } else if (error?.message) {
      context.error(error.message);
    } else {
      context.error(error);
    }
    if (error?.code === 'ECONNABORTED') {
      throw new Err(504, 'Datastorage timeout exceeded');
    }
    throw new Err(404, 'Could not get datastorage');
  }
  context.log('User has no datastorage');
  return null;
};

export const createDataStorage = async (
  id: string | undefined,
  context: InvocationContext,
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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (err) {
    return {};
  }
};

export const updateFavourites = async (
  dsId: string | undefined,
  favourites: Favourites,
  context: InvocationContext,
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
  context: InvocationContext,
): Promise<Array<AxiosResponse<string> | AxiosError>> => {
  const responses: Array<AxiosResponse<string> | AxiosError> = [];
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
      responses.push(err as AxiosError);
    }
  }
  return responses;
};

export const deleteExpiredNotes = async (
  dsId: string | undefined,
  favourites: Favourites,
  context: InvocationContext,
): Promise<Array<AxiosResponse<string> | AxiosError>> => {
  let responses: Array<AxiosResponse<string> | AxiosError> = [];
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
