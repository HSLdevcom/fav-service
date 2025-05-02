import { InvocationContext } from '@azure/functions';
import Err from './Err.js';

interface Response {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  jsonBody: Array<any> | object;
  status: number;
  headers?: {
    'Content-Type'?: string;
  };
}

interface ErrorResponse {
  body: string;
  status: number;
  headers?: {
    'Content-Type'?: string;
  };
}

export const createErrorResponse = (
  error: Err,
  context: InvocationContext,
): ErrorResponse => {
  context.error(error?.toString());

  if (error?.status) {
    return { body: error?.message, status: error?.status };
  }
  return { status: 500, body: error?.message };
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const createResponse = (body: Array<any> | object): Response => {
  const response: Response = {
    jsonBody: body,
    status: 200,
    headers: {
      'Content-Type': 'application/json',
    },
  };
  return response;
};
