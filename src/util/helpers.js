// @flow
import Err from './Err'

const validateEnv = (variable) => {
  if (typeof variable === 'undefined') {
    throw new Err(500, 'Environment variable not set')
  }
}

export const getHslIdUrl = (): string => {
  const hslIdUrl = process.env.hslIdUrl
  validateEnv(hslIdUrl)
  return hslIdUrl || ''
}

export const getManagementClientCredentials = () => {
  const clientCredentials = process.env.clientCredentials
  validateEnv(clientCredentials)
  return clientCredentials
}

export const getManagementClientId = () => {
  const managementClientId = process.env.clientId
  validateEnv(managementClientId)
  return managementClientId
}

export const getRedisHost = () => {
  const redisHost = process.env.redisHost
  validateEnv(redisHost)
  return redisHost
}

export const getRedisPort = () => {
  const redisPort = process.env.redisPort
  validateEnv(redisPort)
  return redisPort
}

export const getRedisPass = () => {
  const redisPass = process.env.redisPass
  return redisPass
}
