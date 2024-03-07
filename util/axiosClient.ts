/* eslint-disable @typescript-eslint/no-var-requires */
import axios, { AxiosInstance } from 'axios';
const Agent = require('agentkeepalive');
import { getManagementClientCredentials } from './helpers';

let client: AxiosInstance;

export default function getAxios(): AxiosInstance {
  if (!client) {
    const httpAgent = new Agent({
      maxSockets: 100,
      maxFreeSockets: 10,
      timeout: 60000,
      freeSocketTimeout: 30000,
    });
    const credentials = getManagementClientCredentials();
    client = axios.create({
      httpAgent,
      headers: {
        Authorization: credentials,
        'Content-Type': 'application/json',
      },
      timeout: 5000,
    });
  }
  return client;
}
