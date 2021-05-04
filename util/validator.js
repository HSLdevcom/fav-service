"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = validate;

var _Err = _interopRequireDefault(require("./Err"));

var _ajv = _interopRequireDefault(require("ajv"));

var _ajvFormats = _interopRequireDefault(require("ajv-formats"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

const ajv = new _ajv.default({
  allErrors: true
});
(0, _ajvFormats.default)(ajv);

function validate(schema, data) {
  const validate = ajv.compile(schema);
  const valid = validate(data);

  if (!valid) {
    throw new _Err.default(400, ajv.errorsText(validate.errors));
  }
}