"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
/** Locale modules **/
const utils_1 = require("../utils");
const enums_1 = require("../enums");
const models_1 = require("../models");
const services_1 = require("../services");
/** Payment **/
const pay_pal_1 = require("../payment/pay-pal");
/**
 * Init transaction
 * @param req
 * @param res
 */
const init = async (req, res) => {
    try {
        const { body, } = req;
        await utils_1.schemaValidator(models_1.transactionInitSchema, body);
        const resultOfGetPaymentMethodAuthData = await services_1.MySqlStorage.getPaymentMethodAuthData(body.paymentMethodCode);
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
        let url = '';
        switch (body.paymentMethodCode) {
            case enums_1.PaymentMethodCode.PAY_PAL:
                const paypal = new pay_pal_1.PayPal();
                url = await paypal.sale(body, authData);
                break;
            default:
                break;
        }
        if (url === '') {
            throw new utils_1.ResponseThrowError({
                statusCode: 500,
                message: `Link is not created`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "TRANSACTION_URL_IS_NOT_EXIST__ERROR" /* TRANSACTION_URL_IS_NOT_EXIST__ERROR */,
                        errorId: 10000010 /* TRANSACTION_URL_IS_NOT_EXIST__ERROR */,
                    }
                }
            });
        }
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
            data: {
                url,
            },
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.init = init;
/**
 * Init refund
 * @param req
 * @param res
 */
const refund = async (req, res) => {
    try {
        const { body, } = req;
        await utils_1.schemaValidator(models_1.transactionRefundSchema, body);
        const resultOfCheckRefund = await services_1.MySqlStorage.checkRefund(JSON.stringify(body.userCartItems));
        if (resultOfCheckRefund.length) {
            throw new utils_1.ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create, because it is exist`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "REFUND_IS_EXIST__ERROR" /* REFUND_IS_EXIST */,
                        errorId: 10000012 /* REFUND_IS_EXIST */,
                    }
                }
            });
        }
        const resultOfGetRefundData = await services_1.MySqlStorage.getRefundData(JSON.stringify(body.userCartItems));
        if (resultOfGetRefundData.length !== 1) {
            throw new utils_1.ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "REFUND_IS_NOT_CREATE__ERROR" /* REFUND_IS_NOT_CREATED */,
                        errorId: 10000013 /* REFUND_IS_NOT_CREATED */,
                    }
                }
            });
        }
        if (resultOfGetRefundData[0].transaction__status !== enums_1.TransactionStatus.SETTLED) {
            throw new utils_1.ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create, because transaction is not settled`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "REFUND_IS_NOT_CREATE__ERROR" /* REFUND_IS_NOT_CREATED */,
                        errorId: 10000013 /* REFUND_IS_NOT_CREATED */,
                    }
                }
            });
        }
        if (!resultOfGetRefundData[0].transaction__capture_id && resultOfGetRefundData[0].payment_method__code === enums_1.PaymentMethodCode.PAY_PAL) {
            throw new utils_1.ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create, because capture id is null`,
                response: {
                    status: "FAIL" /* FAIL */,
                    data: {
                        errorCode: "REFUND_IS_NOT_CREATE__ERROR" /* REFUND_IS_NOT_CREATED */,
                        errorId: 10000013 /* REFUND_IS_NOT_CREATED */,
                    }
                }
            });
        }
        const resultOfGetPaymentMethodAuthData = await services_1.MySqlStorage.getPaymentMethodAuthData(resultOfGetRefundData[0].payment_method__code);
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
        const refundData = {
            dictCurrencyIso4217: resultOfGetRefundData[0].dict_currency__iso4217,
            orderUuid: uuid_1.v4(),
            orderUuidSale: resultOfGetRefundData[0].user_order__uuid,
            refundTransactionUuid: uuid_1.v4(),
            saleExternalId: resultOfGetRefundData[0].transaction__external_id,
            title: `Refund ${resultOfGetRefundData[0].user_order__external_id}`,
            transactionUuid: resultOfGetRefundData[0].transaction__uuid,
            userCartItems: JSON.stringify(body.userCartItems),
            userCartUuid: uuid_1.v4(),
            userUuid: resultOfGetRefundData[0].user__uuid,
            captureId: resultOfGetRefundData[0].transaction__capture_id,
        };
        switch (resultOfGetRefundData[0].payment_method__code) {
            case enums_1.PaymentMethodCode.PAY_PAL:
                const paypal = new pay_pal_1.PayPal();
                await paypal.refund(refundData, authData);
                break;
            default:
                break;
        }
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.refund = refund;
