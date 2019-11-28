// @flow
import test from 'ava'
import get from '../get'
import put from '../put'
import remove from '../remove'

let context: Object

process.env.hslIdUrl = 'http://localhost'
process.env.clientId = '999'

test.serial.beforeEach(() => {
  context = {
    log: console.log,
    done: () => {},
    res: undefined,
  }
})

test.serial('get without env', async(t) => {
  const request = {
    method: 'GET',
    params: {
      id: 'foobar',
    },
  }
  await get(context, request)
  t.is(context.res.status, 500)
})

test.serial('put without env', async(t) => {
  const request = {
    method: 'PUT',
    params: {
      id: 'foobar',
    },
    body: [{
      id: 'bar',
      type: 'stop',
      address: {
        name: 'Derp',
      },
    }],
  }
  await put(context, request)
  t.is(context.res.status, 500)
})

test.serial('delete without env', async(t) => {
  const request = {
    method: 'DELETE',
    params: {
      id: 'foobar',
    },
    body: ['asd'],
  }
  await remove(context, request)
  t.is(context.res.status, 500)
})
