import Err from './Err';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });

addFormats(ajv);

export default function validate(schema: object, data: object): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Err(400, ajv.errorsText(validate.errors));
  }
}
