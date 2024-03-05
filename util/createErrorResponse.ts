import { Context } from '@azure/functions';
import Err from './Err';

interface ErrorResponse {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: Array<any> | string;
  status: number;
  headers?: {
    'Content-Type'?: string;
  };
}

const createErrorResponse = (error: Err, context: Context): ErrorResponse => {
  context.log(error);

  if (
    error?.message === 'User has no datastorage' ||
    error?.message === 'Could not get datastorage'
  ) {
    const response: ErrorResponse = {
      body: JSON.stringify([]),
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    };
    return response;
  }

  if (error?.status) {
    return { body: error?.message, status: error?.status };
  }
  return { status: 500, body: error?.message };
};

export default createErrorResponse;
