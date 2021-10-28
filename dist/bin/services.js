'use strict';
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* Local modules */
const config_1 = __importDefault(require("./config"));
const utils_1 = require("../utils");
const services_1 = require("../services");
/**
 * Check connection to MySQL server.
 */
const startMySQL = (isError) => {
    services_1.MySqlStorage.connect(isError, (isConnectionAvailable) => {
        if (isConnectionAvailable) {
            return utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({ message: 'Connection to MySQL server succeed.' }));
        }
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Cannot connect to MySQL server. Trying to reconnect.',
            errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__CONN_ERR */,
        }));
        setTimeout(() => startMySQL(true), config_1.default.mysqlRead.reconnectPeriod);
    });
};
startMySQL(false);
