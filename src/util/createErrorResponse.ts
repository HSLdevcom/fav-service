import Err from './Err';

interface ErrorResponse {
  body: Array<any | undefined> | string;
  status: number;
}

const createErrorResponse = (error: Err, log: Function) => {

  log('asd', error);

  // const err: Err = error;
  if (error instanceof Err) {
    if (error.message === 'DataStorage not found') {
      log('no datastorage found, returning empty array');
      const response: ErrorResponse = { body: [], status: 200};
      return response;
    }
  }
  if (error?.status) {
    return {body: error.message, status: error.status};
  }
  return {status: 500, body: error.message};
};

export default createErrorResponse;
