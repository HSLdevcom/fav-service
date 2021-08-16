import Err from './Err';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';

const ajv = new Ajv({ allErrors: true });

addFormats(ajv);

// eslint-disable-next-line @typescript-eslint/ban-types
export default function validate(schema: Object, data: Object): void {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new Err(400, ajv.errorsText(validate.errors));
  }
}
