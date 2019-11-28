// @flow
import Err from './Err'
import Ajv from 'ajv'
const ajv = new Ajv({allErrors: true})

export default function validate(schema: Object, data: Object): void {

  const validate = ajv.compile(schema)
  const valid = validate(data)

  if (!valid) {
    throw new Err(400, ajv.errorsText(validate.errors))
  }
}
