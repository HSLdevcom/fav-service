import functions from '@azure/functions';
import nock from 'nock';
import { deleteFavouriteTrigger } from '../../src/functions/deleteFavouritesFunction.ts';

const dataStorageFoundResponse = {
  resources: [
    {
      id: 'fafa',
    },
  ],
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
  let context: functions.InvocationContext;

  beforeEach(() => {
    context = new functions.InvocationContext({
      functionName: 'testDeleteFavourites',
      invocationId: 'testInvocationId',
    });
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

    const request = new functions.HttpRequest({
      method: 'DELETE',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
      body: { string: '["9ae46b13-c8ad-480d-8d6d-e0274f3e8b42"]' },
    });
    const res = await deleteFavouriteTrigger(request, context);
    expect(res?.status).toEqual(200);
    expect(res?.jsonBody).toEqual([]);
  });
  it(`should fail when param 'id' is not defined`, async () => {
    const request = new functions.HttpRequest({
      method: 'DELETE',
      url: 'http://localhost/favorites/foobar',
      query: {
        store: 'fav',
      },
      body: { string: '["9ae46b13-c8ad-480d-8d6d-e0274f3e8b42"]' },
    });
    const res = await deleteFavouriteTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
  it(`should fail when query 'store' is not defined`, async () => {
    const request = new functions.HttpRequest({
      method: 'DELETE',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      body: { string: '["9ae46b13-c8ad-480d-8d6d-e0274f3e8b42"]' },
    });
    const res = await deleteFavouriteTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
  it(`should fail when request 'body' is not defined`, async () => {
    const request = new functions.HttpRequest({
      method: 'DELETE',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    });
    const res = await deleteFavouriteTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
});
