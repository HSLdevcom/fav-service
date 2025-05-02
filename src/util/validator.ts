import Err from './Err.js';
import { Ajv } from 'ajv';
import _addFormats from 'ajv-formats';
const addFormats = _addFormats as unknown as typeof _addFormats.default;

const ajv = new Ajv({ allErrors: true });

addFormats(ajv);

export default function validate(schema: object, data: object): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Err(400, ajv.errorsText(validate.errors));
  }
}
