import { Context } from '@azure/functions';
import Err from './Err';

interface Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  body: Array<any> | string;
  status: number;
  headers?: {
    'Content-Type'?: string;
  };
}

export const createErrorResponse = (error: Err, context: Context): Response => {
  context.log.error(error?.toString());

  if (error?.status) {
    return { body: error?.message, status: error?.status };
  }
  return { status: 500, body: error?.message };
};

export const createResponse = (body: string): Response => {
  const response: Response = {
    body,
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return response;
};
