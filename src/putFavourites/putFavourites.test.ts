import { Context } from '@azure/functions';
import * as nock from 'nock';
import putFavourites from '.';
import * as mockData from '../get_mock.json';
import { Favourite } from '../util/types';

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
  params: {
    id: 'foobar',
  },
  query: {
    store: 'fav',
  },
};

describe('putFavourites', () => {
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
      .reply(404, dataStorageNotFoundResponse);

    nock('http://localhost')
      .post('/api/rest/v1/datastorage')
      .reply(200, dataStorageCreateResponse);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, []);

    const request = {
      ...baseRequest,
      body: [favourite],
    };
    await putFavourites(context, request);

    const body = JSON.parse(context?.res?.body);

    expect(context?.res?.status).toEqual(200);
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
      .reply(200, mockData);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
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
        .reply(200, mockData);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(204, {});

      const request = {
        ...baseRequest,
        body: [favourite],
      };

      await putFavourites(context, request);

      const updated = JSON.parse(context?.res?.body).find(
        (elem: Favourite) =>
          elem?.favouriteId === 'e2853d81-56a9-4024-bab0-dd7f59870560',
      );
      expect(context?.res?.status).toEqual(200);
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
        .reply(200, mockData);

      nock('http://localhost')
        .put('/api/rest/v1/datastorage/fafa/data')
        .reply(204, {});

      const request = {
        ...baseRequest,
        body: [favourite],
      };

      await putFavourites(context, request);

      const updated = JSON.parse(context?.res?.body).find(
        (elem: Favourite) =>
          elem?.favouriteId === 'e2853d81-56a9-4024-bab0-dd7f59870560',
      );
      expect(context?.res?.status).toEqual(200);
      expect(updated.name).toEqual('Pasila');
    });
  });
});

describe('putFavourites with type route', () => {
  let context: Context;

  beforeEach(() => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockData);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});
    context = { log: jest.fn() } as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
  });

  afterEach(() => nock.cleanAll());

  it('should insert favourite succesfully with correct data format', async () => {
    const favourite = {
      type: 'route',
      lastUpdated: 1629812636,
      gtfsId: 'HSL:3002U',
      favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
    };

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    const body = JSON.parse(context?.res?.body);
    const expected = [...Object.values(mockData), favourite];
    expect(context?.res?.status).toEqual(200);
    expect(body).toEqual(expected);
  });

  it(`should not insert favourite without 'gtfsId'`, async () => {
    const favourite = {
      type: 'route',
      lastUpdated: 1629812636,
      favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
    };

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'gtfsId', data/body/0 must match "then" schema`,
    );
  });
  it(`should not insert favourite without 'lastUpdated'`, async () => {
    const favourite = {
      type: 'route',
      gtfsId: 'HSL:3002U',
      favouriteId: '9ae46b13-c8ad-480d-8d6d-e0274f3e8b42',
    };

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
    );
  });
});

describe('putFavourites with type stop', () => {
  let context: Context;

  beforeEach(() => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockData);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});
    context = { log: jest.fn() } as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    const body = JSON.parse(context?.res?.body);
    const expected = [...Object.values(mockData), favourite];
    expect(context?.res?.status).toEqual(200);
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
    );
  });
});

describe('putFavourites with type station', () => {
  let context: Context;

  beforeEach(() => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockData);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});
    context = { log: jest.fn() } as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    const body = JSON.parse(context?.res?.body);
    const expected = [...Object.values(mockData), favourite];
    expect(context?.res?.status).toEqual(200);
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
    );
  });
});

describe('putFavourites with type place', () => {
  let context: Context;

  beforeEach(() => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockData);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});
    context = { log: jest.fn() } as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    const body = JSON.parse(context?.res?.body);
    const expected = [...Object.values(mockData), favourite];
    expect(context?.res?.status).toEqual(200);
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'address', data/body/0 must match "then" schema`,
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
    );
  });
});

describe('putFavourites with type bikeStation', () => {
  let context: Context;

  beforeEach(() => {
    nock('http://localhost')
      .get('/api/rest/v1/datastorage')
      .query({ dsfilter: `ownerId eq "foobar" and name eq "favorites-999"` })
      .reply(200, dataStorageFoundResponse);

    nock('http://localhost')
      .get('/api/rest/v1/datastorage/fafa/data')
      .reply(200, mockData);

    nock('http://localhost')
      .put('/api/rest/v1/datastorage/fafa/data')
      .reply(200, {});
    context = { log: jest.fn() } as unknown as Context;
    process.env.hslIdUrl = 'http://localhost';
    process.env.clientId = '999';
    process.env.clientCredentials = 'Basic asdasd';
    process.env.redisHost = 'redis';
    process.env.redisPass = '';
    process.env.redisPort = '6379';
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    const body = JSON.parse(context?.res?.body);
    const expected = [...Object.values(mockData), favourite];
    expect(context?.res?.status).toEqual(200);
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
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

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'lastUpdated', data/body/0 must match "then" schema`,
    );
  });
  it(`should not insert favourite without 'networks'`, async () => {
    const favourite = {
      name: 'Juhana Herttuan tie',
      stationId: '148',
      type: 'bikeStation',
      lastUpdated: 1621240217,
      favouriteId: '6ae991cd-f45d-4711-b853-7344a6961da6',
    };

    const request = {
      ...baseRequest,
      body: [favourite],
    };

    await putFavourites(context, request);

    expect(context?.res?.status).toEqual(400);
    expect(context?.res?.body).toEqual(
      `data/body/0 must have required property 'networks', data/body/0 must match "then" schema`,
    );
  });
});
