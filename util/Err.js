"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.default = void 0;

class Err extends Error {
  constructor(status, message, ...args) {
    super([message, ...args]);
    this.status = status;
  }

}

exports.default = Err;