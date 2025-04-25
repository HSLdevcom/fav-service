import { InvocationContext, HttpRequest } from '@azure/functions';
import nock from 'nock';
import { getFavouritesTrigger } from '../../src/functions/getFavouritesFunction';
import mockResponse from '../../get_mock.json';

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

describe('getFavourites', () => {
  let context: InvocationContext;

  beforeEach(() => {
    context = new InvocationContext({
      functionName: 'testGetFavourites',
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

  it('Should thow an error if datastorage connection fails', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(404, dataStorageNotFoundResponse);

    const request = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    });
    const res = await getFavouritesTrigger(request, context);
    expect(res?.status).toEqual(404);
  });

  it('should return favourites with existing hslid', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockResponse);

    const request = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    });
    const res = await getFavouritesTrigger(request, context);
    expect(res?.jsonBody).toEqual(Object.values(mockResponse));
  });
  it(`should fail when param 'id' is not defined`, async () => {
    const request = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/favorites/foobar',
      query: {
        store: 'fav',
      },
    });
    const res = await getFavouritesTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
  it(`should fail when query 'store' is not defined`, async () => {
    const request = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
    });
    const res = await getFavouritesTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
  it('should return only favourites by defined type in query', async () => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockResponse);

    const request = new HttpRequest({
      method: 'GET',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
        type: 'route',
      },
    });

    const res = await getFavouritesTrigger(request, context);

    const expected = Object.values(mockResponse)[0];
    const body = res?.jsonBody;
    expect(res?.status).toEqual(200);
    expect(body).toEqual([expected]);
  });
});
