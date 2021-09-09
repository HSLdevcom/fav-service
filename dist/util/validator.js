"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const Err_1 = require("./Err");
const ajv_1 = require("ajv");
const ajv_formats_1 = require("ajv-formats");
const ajv = new ajv_1.default({ allErrors: true });
ajv_formats_1.default(ajv);
// eslint-disable-next-line @typescript-eslint/ban-types
function validate(schema, data) {
    const validate = ajv.compile(schema);
    const valid = validate(data);
    if (!valid) {
        throw new Err_1.default(400, ajv.errorsText(validate.errors));
    }
}
exports.default = validate;
//# sourceMappingURL=validator.js.map