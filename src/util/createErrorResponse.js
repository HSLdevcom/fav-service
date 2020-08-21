// @flow 
import Err from './Err'

export default function createErrorResponse(error: Error, log: Function) {

  log(error)

  if (error instanceof Err) {
    if (error.message === 'DataStorage not found') {
      log('no datastorage found, returning empty array')
      return {body: [], status: 200}
    }
    return {body: error.message, status: error.status}
  }

  return {status: 500, body: error.message}
}
