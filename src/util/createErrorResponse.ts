import { Context } from '@azure/functions';
import Err from './Err';

interface ErrorResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: Array<any> | string;
  status: number;
}

const createErrorResponse = (error: Err, context: Context): ErrorResponse => {
  context.log(error);

  if (error instanceof Err) {
    if (error.message === 'DataStorage not found') {
      context.log('no datastorage found, returning empty array');
      const response: ErrorResponse = { body: [], status: 200 };
      return response;
    }
  }
  if (error?.status) {
    return { body: error.message, status: error.status };
  }
  return { status: 500, body: error.message };
};

export default createErrorResponse;
