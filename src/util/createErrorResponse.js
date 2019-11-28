// @flow 
import Err from './Err'

export default function createErrorResponse(error: Error, log: Function) {

  log(error)

  if (error instanceof Err) {
    return {body: error.message, status: error.status}
  }

  return {status: 500, body: error.message}
}
