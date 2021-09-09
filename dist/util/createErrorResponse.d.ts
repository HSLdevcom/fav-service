import { Context } from '@azure/functions';
import Err from './Err';
interface ErrorResponse {
    body: Array<any> | string;
    status: number;
    headers?: {
        'Content-Type'?: string;
    };
}
declare const createErrorResponse: (error: Err, context: Context) => ErrorResponse;
export default createErrorResponse;
