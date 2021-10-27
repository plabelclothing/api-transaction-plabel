import {logger, loggerMessage} from './logger';
import {Logger} from '../types';
import {LogCode, LoggerLevel, StatusHttp, LogCodeId} from '../enums';

class ResponseThrowError extends Error {
    public readonly statusCode: number | undefined;

    public readonly responseObject: object | undefined;

    public readonly logger: LoggerLevel | undefined;

    public readonly additionalData: any | undefined;

    // eslint-disable-next-line complexity
    constructor(data: Logger.FormLogger) {
        super();

        this.name = data.name || this.name;
        this.message = data.message || '';
        this.statusCode = data?.statusCode || 500;

        if (data.logger) {
            logger.log(data.logger, loggerMessage(data));
        }

        this.logger = data.logger || undefined;
        this.additionalData = data.additionalData || undefined;

        Object.setPrototypeOf(this, new.target.prototype); // restore prototype chain
        Error.captureStackTrace(this);

        switch (this.statusCode) {
            case 400:
                this.responseObject = data.response || {
                    status: StatusHttp.FAIL,
                    message: 'Bad request',
                    data: {
                        errorCode: LogCode.GEN_001_ERR,
                        errorId: LogCodeId.GEN_001_ERR
                    }
                };
                break;
            case 401:
                this.responseObject = data.response || {
                    status: StatusHttp.FAIL,
                    message: 'Unauthorized',
                    data: {
                        errorCode: LogCode.GEN_002_ERR,
                        errorId: LogCodeId.GEN_002_ERR
                    }
                };
                break;
            case 404:
                this.responseObject = data.response || {
                    status: StatusHttp.FAIL,
                    message: 'Not found',
                    data: {
                        errorCode: LogCode.GEN_003_ERR,
                        errorId: LogCodeId.GEN_003_ERR
                    }
                };
                break;
            case 409:
                this.responseObject = data.response || {
                    status: StatusHttp.FAIL,
                    message: 'Conflict',
                    data: {
                        errorCode: LogCode.GEN_004_ERR,
                        errorId: LogCodeId.GEN_004_ERR
                    }
                };
                break;
            default:
                this.responseObject = data.response || {
                    status: StatusHttp.FAIL,
                    message: 'Internal Server Error',
                    data: {
                        errorCode: LogCode.GEN_005_ERR,
                        errorId: LogCodeId.GEN_005_ERR
                    }
                };
        }
    }
}

export {
    ResponseThrowError,
};
