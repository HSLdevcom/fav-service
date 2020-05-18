// @flow
import test from 'ava'
import nock from 'nock'
import get from '../get'
import put from '../put'
import remove from '../remove'
import mockGetResponse from './get_mock.json'

const dataStorageNotFoundResponse = {
}

const dataStorageFoundResponse = {
  resources: [{
    id: 'fafa',
  }],
}
const dataStorageCreateResponse = {
  id: '5c75387aa6734c425e86b092',
  name: 'string',
  description: 'string',
  ownerId: 'undefined',
  adminAccess: [
    '999',
  ],
  readAccess: [
    '999',
  ],
  writeAccess: [
    '999',
  ],
}
const mockDeleteResponse = [
  {'key':'asd','status':204,'statusText':'No Content'},
  {'key':'fafs','status':204,'statusText':'No Content'},
]

process.env.hslIdUrl = 'http://localhost'
process.env.clientId = '999'
process.env.clientCredentials = 'Basic asdasd'
process.env.redisHost = 'redis'
process.env.redisPass = ''
process.env.redisPort = '6379'
let context: Object

test.serial.beforeEach(() => {
  context = {
    log: console.log,
    done: () => {},
    res: undefined,
  }
})

test.serial.afterEach(() => {
  nock.cleanAll()
})

test.serial('get without id', async(t) => {
  const request = {
    method: 'GET',
  }
  await get(context, request)
  t.is(context.res.status, 400)
})

test.serial('put without id', async(t) => {
  const request = {
    method: 'PUT',
  }
  await put(context, request)
  t.is(context.res.status, 400)
})

test.serial('put without body', async(t) => {
  const request = {
    method: 'PUT',
    params: {
      id: 'foobar',
    },
  }
  await put(context, request)
  t.is(context.res.status, 400)
})

test.serial('delete without id', async(t) => {
  const request = {
    method: 'DELETE',
  }
  await remove(context, request)
  t.is(context.res.status, 400)
})

test.serial('get favorites with non-existing hslid', async(t) => {
  nock('http://localhost/api/rest/v1/datastorage')
    .get(() => true)
    .reply(200, dataStorageNotFoundResponse)
  const request = {
    params: {
      id: 'asdfadsf',
    },
    query: {
      store: 'test',
    },
    method: 'GET',
  }
  await get(context, request)
  t.is(context.res.status, 500)
})

test.serial('put favorites for existing hslid', async(t) => {
  nock('http://localhost/api/rest/v1/datastorage')
    .get(() => true)
    .reply(200, dataStorageNotFoundResponse)
  nock('http://localhost/api/rest/v1/datastorage')
    .post(() => true)
    .reply(200, dataStorageCreateResponse)
  nock('http://localhost/api/rest/v1/datastorage/5c75387aa6734c425e86b092/data')
    .put(() => true)
    .reply(200, '')
  const request = {
    params: {
      id: 'foobar',
    },
    query: {
      store: 'test',
    },
    method: 'PUT',
    body: [{
      favouriteId: '3b6971c2-af93-4274-acfa-90f63f6a4154',
      type: 'stop',
      address: 'Foobar',
      lastUpdated: 1585548728,
    }],
  }
  await put(context, request)
  t.is(context.res.status, 200)
})

test.serial('put favorites for existing hslid non-existing dataStorage', async(t) => {
  nock('http://localhost/api/rest/v1/datastorage')
    .get(() => true)
    .reply(200, dataStorageFoundResponse)
  nock('http://localhost/api/rest/v1/datastorage')
    .post(() => true)
    .reply(200, dataStorageCreateResponse)
  nock('http://localhost/api/rest/v1/datastorage/5c75387aa6734c425e86b092/data')
    .put(() => true)
    .reply(200, '')
  const request = {
    params: {
      id: 'foobar',
    },
    method: 'PUT',
    query: {
      store: 'test',
    },
    body: [{
      favouriteId: '3b6971c2-af93-4274-acfa-90f63f6a4154',
      type: 'stop',
      address: 'Foobar',
      lastUpdated: 1585548728,
    }],
  }
  await put(context, request)
  t.is(context.res.status, 200)
})

test.serial('get favorites for existing hslid', async(t) => {
  nock('http://localhost/api/rest/v1/datastorage')
    .get(() => true)
    .reply(200, dataStorageFoundResponse)
  nock('http://localhost/api/rest/v1/datastorage/fafa/data')
    .get(() => true)
    .reply(200, mockGetResponse)
  const request = {
    params: {
      id: 'barbar',
    },
    query: {
      store: 'test',
    },
    method: 'GET',
  }
  await get(context, request)
  console.log(context)
  t.is(context.res.status, 200)
  t.is(JSON.stringify(context.res.body), JSON.stringify(mockGetResponse))
})

test.serial('delete with id', async(t) => {
  nock('http://localhost/api/rest/v1/datastorage')
    .get(() => true)
    .reply(200, dataStorageFoundResponse)
  nock('http://localhost/api/rest/v1/datastorage/fafa/data')
    .delete(() => true)
    .reply(200, mockDeleteResponse)
  const request = {
    method: 'DELETE',
    params: {
      id: 'fafa',
    },
    query: {
      store: 'test',
    },
    body: ['asd', 'fafs'],
  }
  await remove(context, request)
  t.is(context.res.status, 200)
})

test.serial('delete with non-existing hslid', async(t) => {
  nock('http://localhost/api/rest/v1/datastorage')
    .get(() => true)
    .reply(200, dataStorageNotFoundResponse)
  const request = {
    method: 'DELETE',
    params: {
      id: 'fafa',
    },
    query: {
      store: 'test',
    },
    body: ['asd', 'fafs'],
  }
  await remove(context, request)
  t.is(context.res.status, 404)
})
