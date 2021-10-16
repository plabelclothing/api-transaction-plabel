'use strict';

/* Local modules */
import config from './config';
import {logger, loggerMessage} from '../utils';
import {LoggerLevel, LogCode} from '../enums';
import {MySqlStorage} from '../services';

/**
 * Check connection to MySQL server.
 */
const startMySQL = (isError: boolean) => {
    MySqlStorage.connect(isError, (isConnectionAvailable) => {
        if (isConnectionAvailable) {
            return logger.log(LoggerLevel.WARN, loggerMessage({message: 'Connection to MySQL server succeed.'}));
        }
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Cannot connect to MySQL server. Trying to reconnect.',
            errorCode: LogCode.MYSQL_SERVICE__CONN_ERR,
        }));
        setTimeout(() => startMySQL(true), config.mysqlRead.reconnectPeriod);
    })
};

startMySQL(false);

