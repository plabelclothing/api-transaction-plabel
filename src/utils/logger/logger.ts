import {ConsoleTransportInstance, FileTransportInstance} from 'winston/lib/winston/transports';
import {createLogger, format, transports} from 'winston';
import SentryTransport from 'winston-transport-sentry-node/dist/transport';
import {TransformableInfo} from 'logform';

import {Logger as LoggerType} from '../../types';
import config from '../../bin/config';

// Local variables
const {printf, combine, label, timestamp} = format;
const enabledTransports: Array<ConsoleTransportInstance | FileTransportInstance | SentryTransport> = [];

/**
 * Custom error messages formatter.
 */
const customFormat = printf((data: TransformableInfo) => {
	if (data.source === 'express') { // That's express log format
		return `[${data.timestamp}] [${data.label}] [exp] [${data.level}] ${data.message}`;
	} else {
		// If error is instance of Error then 'unpack' data. Otherwise error will not be converted into string correclty.
		if (data.error !== null && data.error instanceof Error) {
			data.error = {
				message: data.error.message,
				stack: data.error.stack,
				status: data.errror?.status
			};
		}
		return `[${data.timestamp}] [${data.label}] [app] [${data.level}] [${data.requestId || ''}] [${JSON.stringify(data)}]`;
	}
});

/**
 * Ignore logging if log messages contains {private: true} field.
 */
const ignorePrivate = format((data) => {
	if (data.private) {
		return false;
	}
	return data;
});

if (config.winston.transports.console.enabled) {
	enabledTransports.push(new transports.Console(config.winston.console));
}

if (config.winston.transports.file.enabled) {
	enabledTransports.push(new transports.File(config.winston.file));
}

if (config.winston.transports.sentry.enabled) {
	enabledTransports.push(new SentryTransport({
		sentry: {
			dsn: config.winston.sentry.dsn
		},
		level:  config.winston.sentry.level
	}));
}

/**
 * Create and configure logger with transports
 */
const logger: LoggerType.Log = createLogger({
	format: combine(
		label({label: config.application}),
		timestamp(),
		format.splat(),
		ignorePrivate(),
		customFormat
	),
	transports: enabledTransports,
	exitOnError: config.winston.exitOnError
});

/**
 * Express logger stream.
 */
logger.expressStream = {
	write: (message: string) => {
		logger.log({
			level: 'info',
			source: 'express',
			message: message.substring(0, message.lastIndexOf('\n'))
		});
	}
};

export {
	logger
};
