"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const createErrorResponse = (error, context) => {
    context.log(error);
    if ((error === null || error === void 0 ? void 0 : error.message) === 'User has no datastorage' ||
        (error === null || error === void 0 ? void 0 : error.message) === 'Could not get datastorage') {
        const response = {
            body: JSON.stringify([]),
            status: 200,
            headers: {
                'Content-Type': 'application/json',
            },
        };
        return response;
    }
    if (error === null || error === void 0 ? void 0 : error.status) {
        return { body: error === null || error === void 0 ? void 0 : error.message, status: error === null || error === void 0 ? void 0 : error.status };
    }
    return { status: 500, body: error === null || error === void 0 ? void 0 : error.message };
};
exports.default = createErrorResponse;
