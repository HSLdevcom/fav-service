"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisPass = exports.getRedisPort = exports.getRedisHost = exports.getManagementClientId = exports.getManagementClientCredentials = exports.getHslIdUrl = void 0;
const Err_1 = require("./Err");
const validateEnv = (variable) => {
    if (typeof variable === 'undefined') {
        throw new Err_1.default(500, 'Environment variable not set');
    }
};
const getHslIdUrl = () => {
    const hslIdUrl = process.env.hslIdUrl;
    validateEnv(hslIdUrl);
    return hslIdUrl || '';
};
exports.getHslIdUrl = getHslIdUrl;
const getManagementClientCredentials = () => {
    const clientCredentials = process.env.clientCredentials;
    validateEnv(clientCredentials);
    return clientCredentials;
};
exports.getManagementClientCredentials = getManagementClientCredentials;
const getManagementClientId = () => {
    const managementClientId = process.env.clientId;
    validateEnv(managementClientId);
    return managementClientId;
};
exports.getManagementClientId = getManagementClientId;
const getRedisHost = () => {
    const redisHost = process.env.redisHost;
    validateEnv(redisHost);
    return redisHost;
};
exports.getRedisHost = getRedisHost;
const getRedisPort = () => {
    const redisPort = process.env.redisPort;
    validateEnv(redisPort);
    return Number(redisPort);
};
exports.getRedisPort = getRedisPort;
const getRedisPass = () => {
    const redisPass = process.env.redisPass;
    return redisPass;
};
exports.getRedisPass = getRedisPass;
