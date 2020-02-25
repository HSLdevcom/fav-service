// @flow
import axios from 'axios'
import {
  getHslIdUrl,
  getManagementClientCredentials,
  getManagementClientId,
} from '../util/helpers'
import Err from '../util/Err'

const makeHslIdRequest = async(options: Object) => {
  const hslIdUrl = getHslIdUrl()
  const credentials = getManagementClientCredentials()
  options.url = `${hslIdUrl}${options.endpoint}`,
  options.headers = {
    'Authorization': credentials,
    'Content-Type': 'application/json',
  }
  const response: Object = await axios(options)
  return response
}

export const getDataStorage = async(id: string) => {
  const managementClientId = getManagementClientId()
  const options = {
    method: 'GET',
    endpoint: '/api/rest/v1/datastorage',
    params: {
      dsfilter: `ownerId eq "${id}" and name eq "favorites-${managementClientId || ''}"`,
    },
  }
  const response = await makeHslIdRequest(options)
  try {
    const dataStorage = response.data.resources[0]
    if (dataStorage) {
      return dataStorage
    } else {
      throw new Err(404, 'DataStorage not found')
    }
  } catch(error) {
    throw new Err(404, 'DataStorage not found')
  }
}

export const createDataStorage = async(id: string) => {
  const managementClientId = getManagementClientId()
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
  }
  const response = await makeHslIdRequest(options)
  return response.data.id
}

export const getFavorites = async(dsId: string) => {
  const options = {
    method: 'GET',
    endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
  }
  try {
    const response = await makeHslIdRequest(options)
    return response.data
  } catch(err) {
    return {}
  }
}

export const updateFavorites = async(dsId: string, favorites: Object) => {
  const options = {
    method: 'PUT',
    endpoint: `/api/rest/v1/datastorage/${dsId}/data`,
    data: favorites,
  }
  const response = await makeHslIdRequest(options)
  return response
}

export const deleteFavorites = async(dsId: string, keys: Array<string>) => {
  const responses = []
  for (let i = 0; i < keys.length; i++) {
    try {
      const key = keys[i]
      const options = {
        method: 'DELETE',
        endpoint: `/api/rest/v1/datastorage/${dsId}/data/${key}`,
      }
      responses.push(await makeHslIdRequest(options))
    } catch(err) {
      responses.push(err)
    }
  }
  return responses
}
