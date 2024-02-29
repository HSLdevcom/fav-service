// eslint-disable-next-line @typescript-eslint/no-var-requires
const RedisMock = require('ioredis-mock');
jest.mock('ioredis', () => jest.requireActual('ioredis-mock'));

const redis = new RedisMock({
  port: 1234, // Replace with the actual port value
  host: 'example.com', // Replace with the actual host value
  data: {
    'Key:1': [JSON.stringify({ state: 'INITIAL', recordingError: null })],
    'Key:2': [JSON.stringify({ JSONVersionId: '1.0', agentTack: '11ebd1d4' })],
  },
});
