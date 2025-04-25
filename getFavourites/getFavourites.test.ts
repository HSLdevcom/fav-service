import { Context } from '@azure/functions';
import nock from 'nock';
import getFavourites from '.';
import mockResponse from '../get_mock.json';

const dataStorageNotFoundResponse = {
  message: 'User has no datastorage',
};

const dataStorageFoundResponse = {
  resources: [
    {
      id: 'fafa',
    },
  ],
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const mockContext: any = { log: jest.fn() };
mockContext.log.error = jest.fn();

describe('getFavourites', () => {
  let context: Context;

  beforeEach(() => {
    context = mockContext as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
  });

  afterEach(() => nock.cleanAll());

  it('Should thow an error if datastorage connection fails', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(404, dataStorageNotFoundResponse);

    const request = {
      method: 'GET',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    };
    await getFavourites(context, request);
    expect(context?.res?.status).toEqual(404);
  });

  it('should return favourites with existing hslid', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockResponse);

    const request = {
      method: 'GET',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    };
    await getFavourites(context, request);
    expect(JSON.parse(context?.res?.body)).toEqual(Object.values(mockResponse));
  });
  it(`should fail when param 'id' is not defined`, async () => {
    const request = {
      method: 'GET',
      query: {
        store: 'fav',
      },
      body: ['9ae46b13-c8ad-480d-8d6d-e0274f3e8b42'],
    };
    await getFavourites(context, request);
    expect(context?.res?.status).toEqual(400);
  });
  it(`should fail when query 'store' is not defined`, async () => {
    const request = {
      method: 'GET',
      params: {
        id: 'foobar',
      },
      body: ['9ae46b13-c8ad-480d-8d6d-e0274f3e8b42'],
    };
    await getFavourites(context, request);
    expect(context?.res?.status).toEqual(400);
  });
  it('should return only favourites by defined type in query', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockResponse);

    const request = {
      method: 'GET',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
        type: 'route',
      },
    };

    await getFavourites(context, request);

    const expected = Object.values(mockResponse)[0];
    const body = JSON.parse(context?.res?.body);
    expect(context?.res?.status).toEqual(200);
    expect(body).toEqual([expected]);
  });
});
