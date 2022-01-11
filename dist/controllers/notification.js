"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const luxon_1 = require("luxon");
/** Locale modules **/
const utils_1 = require("../utils");
const enums_1 = require("../enums");
const models_1 = require("../models");
const services_1 = require("../services");
/** Payment **/
const pay_pal_1 = require("../payment/pay-pal");
const payPalNotify = async (req, res) => {
    const { body, headers } = req;
    const notifyObj = {
        headers,
        body
    };
    try {
        utils_1.schemaValidator(models_1.notifyPayPalHeaders, headers);
        utils_1.schemaValidator(models_1.notifyPayPalBody, body);
        const resultOfGetTransactionUuid = await services_1.MySqlStorage.getTransactionByExternalId(body.resource.id);
        if (!resultOfGetTransactionUuid.length) {
            throw new utils_1.ResponseThrowError({
                statusCode: 404,
                message: `Transaction is not exist`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "DATA_NOT_FOUND" /* DATA_NOT_FOUND */,
                        errorId: 10000011 /* DATA_NOT_FOUND */,
                    }
                }
            });
        }
        const transactionUuid = resultOfGetTransactionUuid[0].transaction__uuid;
        await services_1.MySqlStorage.insertNotify(transactionUuid, JSON.stringify(notifyObj));
        const resultOfGetPaymentMethodAuthData = await services_1.MySqlStorage.getPaymentMethodAuthData(enums_1.PaymentMethodCode.PAY_PAL);
        if (!resultOfGetPaymentMethodAuthData.length) {
            throw new utils_1.ResponseThrowError({
                statusCode: 404,
                message: `Payment method auth data is not exist`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "AUTH_DATA_IS_NOT_EXIST__ERROR" /* AUTH_DATA_IS_NOT_EXIST__ERROR */,
                        errorId: 10000009 /* AUTH_DATA_IS_NOT_EXIST__ERROR */,
                    }
                }
            });
        }
        const authData = JSON.parse(resultOfGetPaymentMethodAuthData[0].payment_method_auth__data);
        const paypal = new pay_pal_1.PayPal();
        const resultOfCheckStatusPayPal = await paypal.checkNotify({
            transmissionId: headers['paypal-transmission-id'],
            transmissionTime: headers['paypal-transmission-time'],
            certUrl: headers['paypal-cert-url'],
            alg: headers['paypal-auth-algo'],
            transmissionSig: headers['paypal-transmission-sig'],
            body: body
        }, authData);
        if (resultOfCheckStatusPayPal !== "SUCCESS" /* SUCCESS */) {
            throw new utils_1.ResponseThrowError({
                statusCode: 409,
                message: `Notification is not correct`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "NOTIFY_IS_NOT_CORRECT__ERROR" /* NOTIFY_IS_NOT_CORRECT */,
                        errorId: 10000011 /* NOTIFY_IS_NOT_CORRECT */,
                    }
                }
            });
        }
        let orderStatus = "approved" /* APPROVED */;
        let transactionStatus = enums_1.TransactionStatus.SETTLED;
        if (body.resource.status !== "APPROVED" /* APPROVED */) {
            orderStatus = "canceled" /* CANCELED */;
        }
        if (body.resource.status === "APPROVED" /* APPROVED */) {
            const resultOfCaptureTrx = await paypal.capture(body.resource.id, transactionUuid, authData);
            await services_1.MySqlStorage.insertNotify(body.transactionUuid, JSON.stringify(resultOfCaptureTrx));
            let transactionSettledAt = parseInt(luxon_1.DateTime.local().setZone(enums_1.LuxonTimezone.TZ).toFormat(enums_1.LuxonTimezone.UNIX_TIMESTAMP_FORMAT));
            if (resultOfCaptureTrx.status !== "COMPLETED" /* COMPLETED */) {
                transactionStatus = enums_1.TransactionStatus.CANCELED;
                orderStatus = "new" /* NEW */;
                transactionSettledAt = null;
            }
            await services_1.MySqlStorage.updateTransaction(transactionUuid, null, transactionStatus, transactionSettledAt, null);
        }
        await services_1.MySqlStorage.updateUserOrderData(transactionUuid, JSON.stringify(body.resource.purchase_units[0].shipping), orderStatus, orderStatus === "canceled" /* CANCELED */ ? "new" /* NEW */ : "pending" /* PENDING */);
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
        });
        /** Prepare mail data **/
        try {
            await utils_1.sendPaymentEmail(transactionStatus, transactionUuid, false);
        }
        catch (e) {
            utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                error: e,
                message: 'Error with prepare mail content',
                additionalData: e.additionalData,
            }));
        }
    }
    catch (error) {
        await (async () => {
            await services_1.MySqlStorage.insertNotify(null, JSON.stringify(notifyObj));
        })();
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.payPalNotify = payPalNotify;
