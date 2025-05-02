import functions from '@azure/functions';
import nock from 'nock';
import { putFavouritesTrigger } from '../../src/functions/putFavouritesFunction.ts';
import mockResponse from '../../get_mock.json';
import { Favourite } from '../../src/util/types.js';

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
  method: 'PUT',
  url: 'http://localhost/favorites/foobar',
  params: {
    id: 'foobar',
  },
  query: {
    store: 'fav',
  },
};

describe('putFavourites', () => {
  let context: functions.InvocationContext;

  beforeEach(() => {
    context = new functions.InvocationContext({
      functionName: 'testPutFavourites',
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

  it('should create datastorage if it cannot be found', async () => {
    const favourite = {
      type: 'route',
      gtfsId: 'HSL:3002U',
      lastUpdated: 1629812636,
      favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
    };
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageNotFoundResponse);

    nock('http://localhost')
      .post('/api/rest/v1/datastorage')
      .reply(200, dataStorageCreateResponse);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, []);

    const request = new functions.HttpRequest({
      ...baseRequest,
      body: { string: JSON.stringify([favourite]) },
    });

    const res = await putFavouritesTrigger(request, context);
    const body = res?.jsonBody;

    expect(res?.status).toEqual(200);
    expect(body).toEqual([favourite]);
  });

  it('should not insert favourite without type', async () => {
    const favourite = {
      gtfsId: 'HSL:3002U',
      lastUpdated: 1629812636,
      favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
    };
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockResponse);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});

    const request = new functions.HttpRequest({
      ...baseRequest,
      body: { string: JSON.stringify([favourite]) },
    });

    const res = await putFavouritesTrigger(request, context);

    expect(res?.status).toEqual(400);
  });

  it(`should fail when param 'id' is not defined`, async () => {
    const request = new functions.HttpRequest({
      method: 'PUT',
      url: 'http://localhost/favorites/foobar',
      query: {
        store: 'fav',
      },
      body: { string: '["9ae46b13-c8ad-480d-8d6d-e0274f3e8b42"]' },
    });
    const res = await putFavouritesTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
  it(`should fail when query 'store' is not defined`, async () => {
    const request = new functions.HttpRequest({
      method: 'PUT',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      body: { string: '["9ae46b13-c8ad-480d-8d6d-e0274f3e8b42"]' },
    });
    const res = await putFavouritesTrigger(request, context);
    expect(res?.status).toEqual(400);
  });
  it(`should fail when request 'body' is not defined`, async () => {
    const request = new functions.HttpRequest({
      method: 'PUT',
      url: 'http://localhost/favorites/foobar',
      params: {
        id: 'foobar',
      },
      query: {
        store: 'fav',
      },
    });
    const res = await putFavouritesTrigger(request, context);
    expect(res?.status).toEqual(400);
  });

  describe('update existing favourite', () => {
    it(`should update existing favourite if new favourite has larger 'lastUpdated value'`, async () => {
      const favourite = {
        address: 'Pasila 0071, Helsinki',
        lat: 60.19941,
        name: 'TEST',
        lon: 24.93212,
        selectedIconId: 'icon-icon_place',
        favouriteId: 'e2853d81-56a9-4024-bab0-dd7f59870560',
        gid: 'gtfshsl:stop:GTFS:HSL:1174502#0071',
        gtfsId: 'HSL:1174502',
        code: '0071',
        layer: 'stop',
        type: 'stop',
        lastUpdated: 1585548729,
      };
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(204, {});

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const updated = res?.jsonBody.find(
        (elem: Favourite) =>
          elem?.favouriteId === 'e2853d81-56a9-4024-bab0-dd7f59870560',
      );
      expect(res?.status).toEqual(200);
      expect(updated).toEqual(favourite);
    });
    it(`should not update existing favourite if new favourite has smaller 'lastUpdated value'`, async () => {
      const favourite = {
        address: 'Pasila 0071, Helsinki',
        lat: 60.19941,
        name: 'TEST',
        lon: 24.93212,
        selectedIconId: 'icon-icon_place',
        favouriteId: 'e2853d81-56a9-4024-bab0-dd7f59870560',
        gid: 'gtfshsl:stop:GTFS:HSL:1174502#0071',
        gtfsId: 'HSL:1174502',
        code: '0071',
        layer: 'stop',
        type: 'stop',
        lastUpdated: 1,
      };
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(204, {});

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const updated = res?.jsonBody.find(
        (elem: Favourite) =>
          elem?.favouriteId === 'e2853d81-56a9-4024-bab0-dd7f59870560',
      );
      expect(res?.status).toEqual(200);
      expect(updated.name).toEqual('Pasila');
    });
  });
  describe('put favourite with type route', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });

    afterEach(() => nock.cleanAll());

    it('should insert favourite succesfully with correct data format', async () => {
      const favourite = {
        type: 'route',
        lastUpdated: 1629812636,
        gtfsId: 'HSL:3002U',
        favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      const expected = [...Object.values(mockResponse), favourite];
      expect(res?.status).toEqual(200);
      expect(body).toEqual(expected);
    });

    it(`should not insert favourite without 'gtfsId'`, async () => {
      const favourite = {
        type: 'route',
        lastUpdated: 1629812636,
        favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'gtfsId', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lastUpdated'`, async () => {
      const favourite = {
        type: 'route',
        gtfsId: 'HSL:3002U',
        favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
      );
    });
  });
  describe('put favourite with type stop', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });

    it('should insert favourite succesfully with correct data format', async () => {
      const favourite = {
        address: 'Kaisaniemenkatu H0304, Kluuvi, Helsinki',
        gtfsId: 'HSL:1020458',
        code: 'H0304',
        gid: 'gtfshsl:stop:GTFS:HSL:1020458#H0304',
        lat: 60.17165,
        lon: 24.94751,
        type: 'stop',
        lastUpdated: 1629813334,
        favouriteId: '85500469-de49-4726-b27d-cd09dbbc1b17',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      const expected = [...Object.values(mockResponse), favourite];
      expect(res?.status).toEqual(200);
      expect(body).toEqual(expected);
    });

    it(`should not insert favourite without 'gtfsId'`, async () => {
      const favourite = {
        address: 'Kaisaniemenkatu H0304, Kluuvi, Helsinki',
        code: 'H0304',
        gid: 'gtfshsl:stop:GTFS:HSL:1020458#H0304',
        lat: 60.17165,
        lon: 24.94751,
        type: 'stop',
        lastUpdated: 1629813334,
        favouriteId: '85500469-de49-4726-b27d-cd09dbbc1b17',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'gtfsId', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lastUpdated'`, async () => {
      const favourite = {
        address: 'Kaisaniemenkatu H0304, Kluuvi, Helsinki',
        gtfsId: 'HSL:1020458',
        code: 'H0304',
        gid: 'gtfshsl:stop:GTFS:HSL:1020458#H0304',
        lat: 60.17165,
        lon: 24.94751,
        type: 'stop',
        favouriteId: '85500469-de49-4726-b27d-cd09dbbc1b17',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
      );
    });
  });
  describe('putFavourites with type station', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });

    it('should insert favourite succesfully with correct data format', async () => {
      const favourite = {
        address: 'Pasilan asema, Keski-Pasila, Helsinki',
        code: null,
        gid: 'gtfshsl:station:GTFS:HSL:1000202',
        gtfsId: 'HSL:1000202',
        lat: 60.199228,
        lon: 24.933114,
        type: 'station',
        lastUpdated: 1629813638,
        favouriteId: 'd629133f-5153-486e-86d8-80362fc2d4cb',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      const expected = [...Object.values(mockResponse), favourite];
      expect(res?.status).toEqual(200);
      expect(body).toEqual(expected);
    });

    it(`should not insert favourite without 'gtfsId'`, async () => {
      const favourite = {
        address: 'Pasilan asema, Keski-Pasila, Helsinki',
        code: null,
        gid: 'gtfshsl:station:GTFS:HSL:1000202',
        lat: 60.199228,
        lon: 24.933114,
        type: 'station',
        lastUpdated: 1629813638,
        favouriteId: 'd629133f-5153-486e-86d8-80362fc2d4cb',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'gtfsId', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lastUpdated'`, async () => {
      const favourite = {
        address: 'Pasilan asema, Keski-Pasila, Helsinki',
        code: null,
        gid: 'gtfshsl:station:GTFS:HSL:1000202',
        gtfsId: 'HSL:1000202',
        lat: 60.199228,
        lon: 24.933114,
        type: 'station',
        favouriteId: 'd629133f-5153-486e-86d8-80362fc2d4cb',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
      );
    });
  });
  describe('putFavourites with type place', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });

    it('should insert favourite succesfully with correct data format', async () => {
      const favourite = {
        name: 'HSL',
        selectedIconId: 'icon-icon_work',
        address: 'HSL, Opastinsilta 6A, Helsinki',
        lat: 60.199102,
        lon: 24.940497,
        gid: 'openstreetmap:venue:node:2136579378',
        type: 'place',
        lastUpdated: 1623999617,
        favouriteId: 'a66d4946-def6-4434-b738-3945da9fd74d',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      const expected = [...Object.values(mockResponse), favourite];
      expect(res?.status).toEqual(200);
      expect(body).toEqual(expected);
    });

    it(`should not insert favourite without 'address'`, async () => {
      const favourite = {
        name: 'HSL',
        selectedIconId: 'icon-icon_work',
        lat: 60.199102,
        lon: 24.940497,
        gid: 'openstreetmap:venue:node:2136579378',
        type: 'place',
        lastUpdated: 1623999617,
        favouriteId: 'a66d4946-def6-4434-b738-3945da9fd74d',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'address', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lat'`, async () => {
      const favourite = {
        name: 'HSL',
        selectedIconId: 'icon-icon_work',
        address: 'HSL, Opastinsilta 6A, Helsinki',
        lon: 24.940497,
        gid: 'openstreetmap:venue:node:2136579378',
        type: 'place',
        lastUpdated: 1623999617,
        favouriteId: 'a66d4946-def6-4434-b738-3945da9fd74d',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lat', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lon'`, async () => {
      const favourite = {
        name: 'HSL',
        selectedIconId: 'icon-icon_work',
        address: 'HSL, Opastinsilta 6A, Helsinki',
        lat: 60.199102,
        gid: 'openstreetmap:venue:node:2136579378',
        type: 'place',
        lastUpdated: 1623999617,
        favouriteId: 'a66d4946-def6-4434-b738-3945da9fd74d',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lon', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lastUpdated'`, async () => {
      const favourite = {
        name: 'HSL',
        selectedIconId: 'icon-icon_work',
        address: 'HSL, Opastinsilta 6A, Helsinki',
        lat: 60.199102,
        lon: 24.940497,
        gid: 'openstreetmap:venue:node:2136579378',
        type: 'place',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
      );
    });
  });
  describe('putFavourites with type bikeStation', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });

    it('should insert favourite succesfully with correct data format', async () => {
      const favourite = {
        networks: ['smoove'],
        name: 'Juhana Herttuan tie',
        stationId: '148',
        type: 'bikeStation',
        lastUpdated: 1621240217,
        favouriteId: '6ae991cd-f45d-4711-b853-7344a6961da6',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      const expected = [...Object.values(mockResponse), favourite];
      expect(res?.status).toEqual(200);
      expect(body).toEqual(expected);
    });

    it(`should not insert favourite without 'stationId'`, async () => {
      const favourite = {
        networks: ['smoove'],
        name: 'Juhana Herttuan tie',
        type: 'bikeStation',
        lastUpdated: 1621240217,
        favouriteId: '6ae991cd-f45d-4711-b853-7344a6961da6',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'stationId', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lastUpdated'`, async () => {
      const favourite = {
        networks: ['smoove'],
        name: 'Juhana Herttuan tie',
        stationId: '148',
        type: 'bikeStation',
        favouriteId: '6ae991cd-f45d-4711-b853-7344a6961da6',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
      );
    });
  });
  describe('putFavourites with type note', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
      nock('http://localhost')
        .delete(
          `/api/rest/v1/datastorage/fafa/data/fav-6ae991cd-f45d-4711-b853-7344a6961da7`,
        )
        .reply(204, {});
    });
    it('should insert note with correct data format', async () => {
      const note = {
        type: 'note',
        expires: 9999999999,
        favouriteId: '6ae991cd-f45d-4711-b853-7344a6961da7',
        noteId: '123',
      };
      const request = new functions.HttpRequest({
        ...baseRequest,
        query: {
          ...baseRequest.query,
          type: 'note',
        },
        body: { string: JSON.stringify([note]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      expect(res?.status).toEqual(200);
      expect(body).toEqual([note]);
    });
    it(`should not insert note without 'noteId'`, async () => {
      const note = {
        type: 'note',
        expires: 9999999999,
      };
      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([note]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'noteId', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert note without 'expires'`, async () => {
      const note = {
        type: 'note',
        noteId: '123',
      };
      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([note]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'expires', data/body/0 must match "then" schema`,
      );
    });
    it(`should delete expired notes`, async () => {
      const note = {
        type: 'note',
        expires: 0,
        noteId: '123',
      };
      const request = new functions.HttpRequest({
        ...baseRequest,
        query: {
          ...baseRequest.query,
          type: 'note',
        },
        body: { string: JSON.stringify([note]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      expect(res?.status).toEqual(200);
      expect(body).toEqual([]);
    });
  });
  describe('put favourite with type postalCode', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);

      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });

    it('should insert favourite succesfully with correct data format', async () => {
      const favourite = {
        postalCode: '00100',
        type: 'postalCode',
        lastUpdated: 1620732626,
        favouriteId: 'df8170a2-6c20-4267-a1df-05f89d6926bd',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        query: {
          ...baseRequest.query,
          type: 'postalCode',
        },
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;
      const expected = [favourite];
      expect(res?.status).toEqual(200);
      expect(body).toEqual(expected);
    });

    it(`should not insert favourite without 'postalCode'`, async () => {
      const favourite = {
        type: 'postalCode',
        lastUpdated: 1620732626,
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'postalCode', data/body/0 must match "then" schema`,
      );
    });
    it(`should not insert favourite without 'lastUpdated'`, async () => {
      const favourite = {
        postalCode: '00100',
        type: 'postalCode',
      };

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify([favourite]) },
      });

      const res = await putFavouritesTrigger(request, context);

      expect(res?.status).toEqual(400);
      expect(res?.body?.toString()).toEqual(
        `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
      );
    });
  });
  describe('put favourites with new order of favourites', () => {
    beforeEach(() => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage')
        .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
        .reply(200, dataStorageFoundResponse);
      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(200, {});
    });
    it('should reorder favourites', async () => {
      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, mockResponse);
      const favourites = Object.values(mockResponse);
      const newOrder = [...favourites.slice(1), favourites[0]];

      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify(newOrder) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;

      expect(res?.status).toEqual(200);
      expect(body.slice(-1)[0]).toEqual(favourites[0]);
    });
    it('should reorder favourites when there are also non default typed favourite saved', async () => {
      const postalCodeFav = {
        'fav-df8170a2-6c20-4267-a1df-05f89d6926bd': {
          postalCode: '00100',
          type: 'postalCode',
          lastUpdated: 1620732626,
          favouriteId: 'df8170a2-6c20-4267-a1df-05f89d6926bd',
        },
      };
      nock('http://localhost')
        .get('/api/rest/v1/datastorage/fafa/data')
        .reply(200, { ...mockResponse, ...postalCodeFav });
      const favourites = Object.values(mockResponse);
      const newOrder = [...favourites.slice(1), favourites[0]];
      const request = new functions.HttpRequest({
        ...baseRequest,
        body: { string: JSON.stringify(newOrder) },
      });

      const res = await putFavouritesTrigger(request, context);

      const body = res?.jsonBody;

      expect(res?.status).toEqual(200);
      expect(body.slice(-1)[0]).toEqual(favourites[0]);
    });
  });
});
