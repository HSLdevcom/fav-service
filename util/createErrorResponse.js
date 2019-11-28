"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = createErrorResponse;

var _Err = _interopRequireDefault(require("./Err"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function createErrorResponse(error, log) {
  log(error);

  if (error instanceof _Err.default) {
    return {
      body: error.message,
      status: error.status
    };
  }

  return {
    status: 500,
    body: error.message
  };
}