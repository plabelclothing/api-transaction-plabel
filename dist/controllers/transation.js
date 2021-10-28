"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/** Locale modules **/
const utils_1 = require("../utils");
const enums_1 = require("../enums");
const models_1 = require("../models");
const services_1 = require("../services");
/** Payment **/
const pay_pal_1 = require("../payment/pay-pal");
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
