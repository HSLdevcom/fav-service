import { Context } from '@azure/functions';
import * as nock from 'nock';
import deleteFavourites from '.';
import * as mockData from '../get_mock.json';

const dataStorageNotFoundResponse = {
  message: 'Datastorage not found',
};

const dataStorageFoundResponse = {
  resources: [
    {
      id: 'fafa',
    },
  ],
};

const dataStorageCreateResponse = {
  id: 'fafa',
  name: 'string',
  description: 'string',
  ownerId: 'undefined',
  adminAccess: ['999'],
  readAccess: ['999'],
  writeAccess: ['999'],
};

const baseRequest = {
  method: 'DELETE',
  params: {
    id: 'foobar',
  },
  query: {
    store: 'fav',
  },
};

const mockDeleteResponse = {
  key: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
  status: 204,
  statusText: 'No Content',
};

const fav = {
  type: 'route',
  gtfsId: 'HSL:3002U',
  lastUpdated: 1629812636,
  favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
};
describe('deleteFavourites', () => {
  let context: Context;

  beforeEach(() => {
    context = { log: jest.fn() } as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
  });

  afterEach(() => nock.cleanAll());

  it('should delete favourites succesfully', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);
    nock('http://localhost')
      .delete(`/api/rest/v1/datastorage/fafa/data/fav-${fav.favouriteId}`)
      .reply(204, mockDeleteResponse);
    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});

    const request = {
      method: 'DELETE',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
      body: ['9ae46b13-c8ad-480d-8d6d-e0274f3e8b42'],
    };
    await deleteFavourites(context, request);
    expect(context?.res?.status).toEqual(200);
    expect(context?.res?.body).toEqual('[]');
  });
  it(`should fail when param 'id' is not defined`, async () => {
    const request = {
      method: 'DELETE',
      query: {
        store: 'fav',
      },
      body: ['9ae46b13-c8ad-480d-8d6d-e0274f3e8b42'],
    };
    await deleteFavourites(context, request);
    expect(context?.res?.status).toEqual(400);
  });
  it(`should fail when query 'store' is not defined`, async () => {
    const request = {
      method: 'DELETE',
      params: {
        id: 'foobar',
      },
      body: ['9ae46b13-c8ad-480d-8d6d-e0274f3e8b42'],
    };
    await deleteFavourites(context, request);
    expect(context?.res?.status).toEqual(400);
  });
  it(`should fail when request 'body' is not defined`, async () => {
    const request = {
      method: 'DELETE',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    };
    await deleteFavourites(context, request);
    expect(context?.res?.status).toEqual(400);
  });
});
