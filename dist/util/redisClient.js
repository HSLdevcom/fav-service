"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const helpers_1 = require("./helpers");
const ioredis_1 = require("ioredis");
let client;
function getClient() {
    if (!client) {
        const settings = {};
        settings.redisHost = helpers_1.getRedisHost();
        settings.redisPort = helpers_1.getRedisPort();
        settings.redisPass = helpers_1.getRedisPass();
        const redisOptions = settings.redisPass
            ? {
                password: settings.redisPass,
                tls: { servername: settings.redisHost },
            }
            : {};
        const MAX_RETRIES = 10;
        const MAX_DELAY_MS = 5000;
        client = new ioredis_1.default(Object.assign({ port: settings.redisPort, host: settings.redisHost, connectTimeout: 5000, retryStrategy: times => {
                if (times > MAX_RETRIES) {
                    return null;
                }
                return Math.min(times * 100, MAX_DELAY_MS);
            } }, redisOptions));
    }
    return client;
}
exports.default = getClient;
