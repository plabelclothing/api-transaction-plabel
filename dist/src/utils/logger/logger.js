"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const winston_1 = require("winston");
const transport_1 = __importDefault(require("winston-transport-sentry-node/dist/transport"));
const config_1 = __importDefault(require("../../bin/config"));
// Local variables
const { printf, combine, label, timestamp } = winston_1.format;
const enabledTransports = [];
/**
 * Custom error messages formatter.
 */
const customFormat = printf((data) => {
    var _a;
    if (data.source === 'express') { // That's express log format
        return `[${data.timestamp}] [${data.label}] [exp] [${data.level}] ${data.message}`;
    }
    else {
        // If error is instance of Error then 'unpack' data. Otherwise error will not be converted into string correclty.
        if (data.error !== null && data.error instanceof Error) {
            data.error = {
                message: data.error.message,
                stack: data.error.stack,
                status: (_a = data.errror) === null || _a === void 0 ? void 0 : _a.status
            };
        }
        return `[${data.timestamp}] [${data.label}] [app] [${data.level}] [${data.requestId || ''}] [${JSON.stringify(data)}]`;
    }
});
/**
 * Ignore logging if log messages contains {private: true} field.
 */
const ignorePrivate = winston_1.format((data) => {
    if (data.private) {
        return false;
    }
    return data;
});
if (config_1.default.winston.transports.console.enabled) {
    enabledTransports.push(new winston_1.transports.Console(config_1.default.winston.console));
}
if (config_1.default.winston.transports.file.enabled) {
    enabledTransports.push(new winston_1.transports.File(config_1.default.winston.file));
}
if (config_1.default.winston.transports.sentry.enabled) {
    enabledTransports.push(new transport_1.default({
        sentry: {
            dsn: config_1.default.winston.sentry.dsn
        },
        level: config_1.default.winston.sentry.level
    }));
}
/**
 * Create and configure logger with transports
 */
const logger = winston_1.createLogger({
    format: combine(label({ label: config_1.default.application }), timestamp(), winston_1.format.splat(), ignorePrivate(), customFormat),
    transports: enabledTransports,
    exitOnError: config_1.default.winston.exitOnError
});
exports.logger = logger;
/**
 * Express logger stream.
 */
logger.expressStream = {
    write: (message) => {
        logger.log({
            level: 'info',
            source: 'express',
            message: message.substring(0, message.lastIndexOf('\n'))
        });
    }
};
