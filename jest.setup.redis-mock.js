import RedisMock from 'ioredis-mock';
import { jest } from '@jest/globals';

jest.unstable_mockModule('ioredis', async () => ({
  Redis: RedisMock,
}));

// eslint-disable-next-line
const redis = new RedisMock({
  port: 1234,
  host: 'example.com',
  data: {
    'Key:1': [JSON.stringify({ state: 'INITIAL', recordingError: null })],
    'Key:2': [JSON.stringify({ JSONVersionId: '1.0', agentTack: '11ebd1d4' })],
  },
});
