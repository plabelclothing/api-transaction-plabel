/* eslint-disable init-declarations */
/**
 * @module storage/mysql
 */
import debSql from 'debug';
import mysql from 'mysql';

/* Local modules */
import config from '../bin/config';
import {logger, loggerMessage, ResponseThrowError} from '../utils';
import {LoggerLevel, LogCode, StatusHttp, LogCodeId} from '../enums';
import {DbQuery} from '../types/db-query';
/* Variables */
const debug = debSql('mysql');
let mysqlPool: mysql.PoolCluster | null;

/**
 * Creates instance of MySQL prototype.
 */
const MySqlStorage = (isError?: boolean) => {
    if (mysqlPool && !isError) {
        return;
    }

    if (config && config.mysqlRead && config.mysqlWrite
        && config.mysqlRead.connection && config.mysqlRead.connection) {
        mysqlPool = mysql.createPoolCluster();
        mysqlPool.add(config.mysqlRead.id, config.mysqlRead.connection);
        mysqlPool.add(config.mysqlWrite.id, config.mysqlWrite.connection);

        // @ts-ignore - only for dev mode
        // eslint-disable-next-line guard-for-in,no-restricted-syntax
        for (const mysqlPoolNode in mysqlPool._node) {
            // noinspection JSUnfilteredForInLoop
            // @ts-ignore - only for dev mode
            const pool = mysqlPool._nodes[mysqlPoolNode].pool;
            pool.on('enqueue', () => {
                debug('Waiting for available connection slot.');
            });
            pool.on('acquire', (connection: { threadId: any; }) => {
                debug(`Connection %d acquired. ${connection.threadId}`);
            });
            pool.on('connection', () => {
                debug('A new connection has been made with pool.');
            });
            pool.on('release', (connection: { threadId: any; }) => {
                debug(`Connection %d released. ${connection.threadId}`);
            });
        }
    } else {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'Config has no mysql property defined. Check configuration file.',
            error: new Error('Config has no mysql property defined. Check configuration file.')
        }));
    }
};

MySqlStorage.connect = async <T>(isError: boolean, callback: (arg: boolean) => T) => {
    MySqlStorage(isError);
    mysqlPool!.getConnection((error, connection) => {
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
            await mysqlPool!.getConnection(config.mysqlRead.id, (error, connection) => {
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
            await mysqlPool!.getConnection(config.mysqlWrite.id, (error, connection) => {
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
const executeQuery = async <T>(query: string, params: any[], isWrite: boolean = false): Promise<T> => {
    try {
        await MySqlStorage.checkPool();
    } catch (e) {
        mysqlPool = null;
    }
    MySqlStorage();
    return new Promise((resolve, reject) => {
        if (mysqlPool === null) {
            let error = new Error('MySQL pool has a null value. Pool has not been created.');
            return reject(error);
        }
        const conType = isWrite ? config.mysqlWrite.id : config.mysqlRead.id;
        mysqlPool.getConnection(conType, (error, connection) => {
            if (error) {
                if (connection) {
                    connection.release();
                }
                return reject(error);
            }
            query = mysql.format(query, params);
            logger.log(LoggerLevel.DEBUG, loggerMessage({
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
MySqlStorage.insertNotify = (transactionUuid: string | null, data: string) => executeQuery<[][]>('CALL app_transaction__notification_ipn__insert(?,?)', [
    transactionUuid,
    data,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing insertNotify function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Get payment method auth data
 * @param paymentMethodCode
 */
MySqlStorage.getPaymentMethodAuthData = (paymentMethodCode: string) => executeQuery<DbQuery.GetPaymentMethodAuthData[][]>('CALL app_transaction__payment_method_auth__get(?)', [
    paymentMethodCode,
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing getPaymentMethodAuthData function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Get transaction by external id
 * @param transactionExternalId
 */
MySqlStorage.getTransactionByExternalId = (transactionExternalId: string) => executeQuery<DbQuery.GetTransactionByExternalId[][]>('CALL app_transaction__transaction__get_by_external_id(?)', [
    transactionExternalId,
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing getTransactionByExternalId function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
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
MySqlStorage.insertTransaction = (transactionUuid: string, userOrderUuid: string, paymentMethodCode: string, dictCurrencyIso4217: string, transactionAmount: number, transactionStatus: string, transactionCustomerLocale: string, dictCountryIso: string) => executeQuery<[][]>('CALL app_transaction__transaction__insert(?,?,?,?,?,?,?,?)', [
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
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing insertTransaction function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
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
 * @param captureId
 */
MySqlStorage.updateTransaction = (transactionUuid: string, transactionExternalId: string | null, transactionStatus: string | null, transactionSettledAt: number | null, captureId: string | null) => executeQuery<[][]>('CALL app_transaction__transaction__update(?,?,?,?,?)', [
    transactionUuid,
    transactionExternalId,
    transactionStatus,
    transactionSettledAt,
    captureId,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing updateTransaction function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
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
MySqlStorage.insertTransactionLog = (transactionUuid: string, transactionLogData: string) => executeQuery<[][]>('CALL app_transaction__transaction_log__insert(?,?)', [
    transactionUuid,
    transactionLogData,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing insertTransactionLog function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Get email data
 * @param transactionUuid
 */
MySqlStorage.getEmailData = (transactionUuid: string) => executeQuery<DbQuery.GetEmailData[][]>('CALL app_transaction__user_order__get_email_send(?)', [
    transactionUuid,
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing getEmailData function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
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
MySqlStorage.updateUserOrderData = (transactionUuid: string, userOrderAddress: string | null, status: string | null, orderStatus: string | null) => executeQuery<[][]>('CALL app_transaction__user_order__update(?,?,?,?)', [
    transactionUuid,
    userOrderAddress,
    status,
    orderStatus,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing updateUserOrderData function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
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
MySqlStorage.updateEmail = (emailUuid: string, status: string) => executeQuery<[][]>('CALL app_transaction__notification_email__update(?,?)', [
    emailUuid,
    status,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing updateEmail function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
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
MySqlStorage.insertEmail = (emailUuid: string, userUuid: string | null, to: string, template: string, status: string, body: string) => executeQuery<[][]>('CALL app_transaction__notification_email__insert(?,?,?,?,?,?)', [
    emailUuid,
    userUuid,
    to,
    template,
    status,
    body,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing insertEmail function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Check exist refund
 * @param userCartItems
 */
MySqlStorage.checkRefund = (userCartItems: string) => executeQuery<DbQuery.CheckRefund[][]>('CALL app_transaction__transaction__refund__check(?)', [
    userCartItems
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing checkRefund function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Insert refund
 * @param userUuid
 * @param userCartUuid
 * @param userCartItems
 * @param userOrderUuid
 * @param userOrderUuidSale
 * @param transactionUuid
 * @param transactionUuidSale
 */
MySqlStorage.insertRefund = (userUuid: string, userCartUuid: string, userCartItems: string, userOrderUuid: string, userOrderUuidSale: string, transactionUuid: string, transactionUuidSale: string) => executeQuery<DbQuery.InsertRefund[][]>('CALL app_transaction__transaction__refund__insert(?,?,?,?,?,?,?)', [
    userUuid,
    userCartUuid,
    userCartItems,
    userOrderUuid,
    userOrderUuidSale,
    transactionUuid,
    transactionUuidSale,
], true)
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing insertRefund function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Get refund data
 * @param userCartItems
 */
MySqlStorage.getRefundData = (userCartItems: string) => executeQuery<DbQuery.GetRefundData[][]>('CALL app_transaction__transaction__refund__get_data(?)', [
    userCartItems
])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing getRefundData function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });

/**
 * Test query
 *
 */
MySqlStorage.testQuery = () => executeQuery<[][]>('SELECT 1', [])
    .then((rows) => (Promise.resolve(rows[0])))
    .catch((e) => {
        const error = new ResponseThrowError({
            statusCode: 500,
            message: `Failed while executing testQuery function. \nCaused by:\n ${e.stack}`,
            response: {
                status: StatusHttp.FAIL,
                message: 'Internal server error',
                data: {
                    errorCode: LogCode.MYSQL_SERVICE__QUERY_ERR,
                    errorId: LogCodeId.MYSQL_SERVICE__QUERY_ERR,
                }
            }
        });
        return Promise.reject(error);
    });


/** end region of procedures **/

export {
    MySqlStorage
};
