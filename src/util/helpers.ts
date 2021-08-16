import Err from './Err';

const validateEnv = (variable: string | undefined) => {
  if (typeof variable === 'undefined') {
    throw new Err(500, 'Environment variable not set');
  }
};

export const getHslIdUrl = (): string => {
  const hslIdUrl = process.env.hslIdUrl;
  validateEnv(hslIdUrl);
  return hslIdUrl || '';
};

export const getManagementClientCredentials = (): string | undefined => {
  const clientCredentials = process.env.clientCredentials;
  validateEnv(clientCredentials);
  return clientCredentials;
};

export const getManagementClientId = (): string | undefined => {
  const managementClientId: string | undefined = process.env.clientId;
  validateEnv(managementClientId);
  return managementClientId;
};

export const getRedisHost = (): string | undefined => {
  const redisHost = process.env.redisHost;
  validateEnv(redisHost);
  return redisHost;
};

export const getRedisPort = (): number | undefined => {
  const redisPort = process.env.redisPort;
  validateEnv(redisPort);
  return Number(redisPort);
};

export const getRedisPass = (): string | undefined => {
  const redisPass = process.env.redisPass;
  return redisPass;
};
