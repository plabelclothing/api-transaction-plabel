"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const logger_1 = require("./logger");
class ResponseThrowError extends Error {
    // eslint-disable-next-line complexity
    constructor(data) {
        var _a;
        super();
        this.name = data.name || this.name;
        this.message = data.message || '';
        this.statusCode = ((_a = data) === null || _a === void 0 ? void 0 : _a.statusCode) || 500;
        if (data.logger) {
            logger_1.logger.log(data.logger, logger_1.loggerMessage(data));
        }
        this.logger = data.logger || undefined;
        this.additionalData = data.additionalData || undefined;
        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        Error.captureStackTrace(this);
        switch (this.statusCode) {
            case 400:
                this.responseObject = data.response || {
                    status: "FAIL" /* FAIL */,
                    message: 'Bad request',
                    data: {
                        errorCode: "GEN_001_ERROR" /* GEN_001_ERR */,
                        errorId: 10000001 /* GEN_001_ERR */
                    }
                };
                break;
            case 401:
                this.responseObject = data.response || {
                    status: "FAIL" /* FAIL */,
                    message: 'Unauthorized',
                    data: {
                        errorCode: "GEN_002_ERROR" /* GEN_002_ERR */,
                        errorId: 10000002 /* GEN_002_ERR */
                    }
                };
                break;
            case 404:
                this.responseObject = data.response || {
                    status: "FAIL" /* FAIL */,
                    message: 'Not found',
                    data: {
                        errorCode: "GEN_003_ERROR" /* GEN_003_ERR */,
                        errorId: 10000003 /* GEN_003_ERR */
                    }
                };
                break;
            case 409:
                this.responseObject = data.response || {
                    status: "FAIL" /* FAIL */,
                    message: 'Conflict',
                    data: {
                        errorCode: "GEN_004_ERROR" /* GEN_004_ERR */,
                        errorId: 10000004 /* GEN_004_ERR */
                    }
                };
                break;
            default:
                this.responseObject = data.response || {
                    status: "FAIL" /* FAIL */,
                    message: 'Internal Server Error',
                    data: {
                        errorCode: "GEN_005_ERROR" /* GEN_005_ERR */,
                        errorId: 10000005 /* GEN_005_ERR */
                    }
                };
        }
    }
}
exports.ResponseThrowError = ResponseThrowError;
