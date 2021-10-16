import {Logger as LoggerWinston} from 'winston';
import {LoggerLevel} from '../enums';

declare module Logger {

    export interface Log extends LoggerWinston {
        expressStream?: {
            write: (message: string) => void;
        }
    }

    export interface LoggerMessage {
        name?: string
        message?: string
        statusCode?: number // Response status
        requestId?: string // X-Request-Id
        additionalData?: object | string // Object with any additional data that cen help identify problem
        error?: any // Error object or message
        errorCode?: string
    }

    export interface FormLogger extends LoggerMessage {
        response?: object
        logger?: LoggerLevel
        privateMessage?: any
        message?: string
    }
}
