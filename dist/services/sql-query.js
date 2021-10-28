"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable init-declarations */
/**
 * @module storage/mysql
 */
const debug_1 = __importDefault(require("debug"));
const mysql_1 = __importDefault(require("mysql"));
/* Local modules */
const config_1 = __importDefault(require("../bin/config"));
const utils_1 = require("../utils");
/* Variables */
const debug = debug_1.default('mysql');
let mysqlPool;
/**
 * Creates instance of MySQL prototype.
 */
const MySqlStorage = (isError) => {
    if (mysqlPool && !isError) {
        return;
    }
    if (config_1.default && config_1.default.mysqlRead && config_1.default.mysqlWrite
        && config_1.default.mysqlRead.connection && config_1.default.mysqlRead.connection) {
        mysqlPool = mysql_1.default.createPoolCluster();
        mysqlPool.add(config_1.default.mysqlRead.id, config_1.default.mysqlRead.connection);
        mysqlPool.add(config_1.default.mysqlWrite.id, config_1.default.mysqlWrite.connection);
        // @ts-ignore - only for dev mode
        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (const mysqlPoolNode in mysqlPool._node) {
            // noinspection JSUnfilteredForInLoop
            // @ts-ignore - only for dev mode
            const pool = mysqlPool._nodes[mysqlPoolNode].pool;
            pool.on('enqueue', () => {
                debug('Waiting for available connection slot.');
            });
            pool.on('acquire', (connection) => {
                debug(`Connection %d acquired. ${connection.threadId}`);
            });
            pool.on('connection', () => {
                debug('A new connection has been made with pool.');
            });
            pool.on('release', (connection) => {
                debug(`Connection %d released. ${connection.threadId}`);
            });
        }
    }
    else {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'Config has no mysql property defined. Check configuration file.',
            error: new Error('Config has no mysql property defined. Check configuration file.')
        }));
    }
};
exports.MySqlStorage = MySqlStorage;
MySqlStorage.connect = async (isError, callback) => {
    MySqlStorage(isError);
    mysqlPool.getConnection((error, connection) => {
        if (error) {
            if (connection) {
                connection.release();
            }
            return callback(false);
        }
        connection.release();
        return callback(true);
    });
};
/**
 * Check available pool
 * @returns {Promise<boolean>}
 */
MySqlStorage.checkPool = () => {
    return Promise.all([
        new Promise(async (resolve, reject) => {
            await mysqlPool.getConnection(config_1.default.mysqlRead.id, (error, connection) => {
                if (error) {
                    if (connection) {
                        connection.release();
                    }
                    return reject(error);
                }
                if (connection) {
                    connection.release();
                }
                return resolve(true);
            });
        }),
        new Promise(async (resolve, reject) => {
            await mysqlPool.getConnection(config_1.default.mysqlWrite.id, (error, connection) => {
                if (error) {
                    if (connection) {
                        connection.release();
                    }
                    return reject(error);
                }
                if (connection) {
                    connection.release();
                }
                return resolve(true);
            });
        }),
    ]);
};
/**
 * Execute given query.
 */
const executeQuery = async (query, params, isWrite = false) => {
    try {
        await MySqlStorage.checkPool();
    }
    catch (e) {
        mysqlPool = null;
    }
    MySqlStorage();
    return new Promise((resolve, reject) => {
        if (mysqlPool === null) {
            let error = new Error('MySQL pool has a null value. Pool has not been created.');
            return reject(error);
        }
        const conType = isWrite ? config_1.default.mysqlWrite.id : config_1.default.mysqlRead.id;
        mysqlPool.getConnection(conType, (error, connection) => {
            if (error) {
                if (connection) {
                    connection.release();
                }
                return reject(error);
            }
            query = mysql_1.default.format(query, params);
            utils_1.logger.log("debug" /* DEBUG */, utils_1.loggerMessage({
                message: `Call procedure MySql: ${query}`,
            }));
            debug(query);
            connection.query(query, (queryError, rows) => {
                connection.release();
                if (queryError) {
                    return reject(queryError);
                }
                return resolve(rows);
            });
        });
    });
};
/** start region of procedures **/
/**
 * Insert notify
 * @param transactionUuid
 * @param data
 */
MySqlStorage.insertNotify = (transactionUuid, data) => executeQuery('CALL app_transaction__notification_ipn__insert(?,?)', [
    transactionUuid,
    data,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing insertNotify function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Get payment method auth data
 * @param paymentMethodCode
 */
MySqlStorage.getPaymentMethodAuthData = (paymentMethodCode) => executeQuery('CALL app_transaction__payment_method_auth__get(?)', [
    paymentMethodCode,
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing getPaymentMethodAuthData function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Get transaction by external id
 * @param transactionExternalId
 */
MySqlStorage.getTransactionByExternalId = (transactionExternalId) => executeQuery('CALL app_transaction__transaction__get_by_external_id(?)', [
    transactionExternalId,
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing getTransactionByExternalId function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Transaction insert
 * @param transactionUuid
 * @param userOrderUuid
 * @param paymentMethodCode
 * @param dictCurrencyIso4217
 * @param transactionAmount
 * @param transactionStatus
 * @param transactionCustomerLocale
 * @param dictCountryIso
 */
MySqlStorage.insertTransaction = (transactionUuid, userOrderUuid, paymentMethodCode, dictCurrencyIso4217, transactionAmount, transactionStatus, transactionCustomerLocale, dictCountryIso) => executeQuery('CALL app_transaction__transaction__insert(?,?,?,?,?,?,?,?)', [
    transactionUuid,
    userOrderUuid,
    paymentMethodCode,
    dictCurrencyIso4217,
    transactionAmount,
    transactionStatus,
    transactionCustomerLocale,
    dictCountryIso,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing insertTransaction function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Update transaction
 * @param transactionUuid
 * @param transactionExternalId
 * @param transactionStatus
 * @param transactionSettledAt
 */
MySqlStorage.updateTransaction = (transactionUuid, transactionExternalId, transactionStatus, transactionSettledAt) => executeQuery('CALL app_transaction__transaction__update(?,?,?,?)', [
    transactionUuid,
    transactionExternalId,
    transactionStatus,
    transactionSettledAt,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing updateTransaction function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Insert transaction log
 * @param transactionUuid
 * @param transactionLogData
 */
MySqlStorage.insertTransactionLog = (transactionUuid, transactionLogData) => executeQuery('CALL app_transaction__transaction_log__insert(?,?)', [
    transactionUuid,
    transactionLogData,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing insertTransactionLog function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Get email data
 * @param transactionUuid
 */
MySqlStorage.getEmailData = (transactionUuid) => executeQuery('CALL app_transaction__user_order__get_email_send(?)', [
    transactionUuid,
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing getEmailData function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Update user order
 * @param transactionUuid
 * @param userOrderAddress
 * @param status
 * @param orderStatus
 */
MySqlStorage.updateUserOrderData = (transactionUuid, userOrderAddress, status, orderStatus) => executeQuery('CALL app_transaction__user_order__update(?,?,?,?)', [
    transactionUuid,
    userOrderAddress,
    status,
    orderStatus,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing updateUserOrderData function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Update email
 * @param emailUuid
 * @param status
 */
MySqlStorage.updateEmail = (emailUuid, status) => executeQuery('CALL app_transaction__notification_email__update(?,?)', [
    emailUuid,
    status,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing updateEmail function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Insert email
 * @param emailUuid
 * @param userUuid
 * @param to
 * @param template
 * @param status
 * @param body
 */
MySqlStorage.insertEmail = (emailUuid, userUuid, to, template, status, body) => executeQuery('CALL app_transaction__notification_email__insert(?,?,?,?,?,?)', [
    emailUuid,
    userUuid,
    to,
    template,
    status,
    body,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing insertEmail function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
/**
 * Test query
 *
 */
MySqlStorage.testQuery = () => executeQuery('SELECT 1', [])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
    const error = new utils_1.ResponseThrowError({
        statusCode: 500,
        message: `Failed while executing testQuery function. \nCaused by:\n ${e.stack}`,
        response: {
            status: "FAIL" /* FAIL */,
            message: 'Internal server error',
            data: {
                errorCode: "MYSQL__ERROR" /* MYSQL_SERVICE__QUERY_ERR */,
                errorId: 10000006 /* MYSQL_SERVICE__QUERY_ERR */,
            }
        }
    });
    return Promise.reject(error);
});
