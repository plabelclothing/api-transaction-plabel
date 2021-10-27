"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/** Locale modules **/
const utils_1 = require("../utils");
const enums_1 = require("../enums");
const models_1 = require("../models");
const services_1 = require("../services");
/** Payment **/
const pay_pal_1 = require("../payment/pay-pal");
const init = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { body, } = req;
        yield utils_1.schemaValidator(models_1.transactionInitSchema, body);
        const resultOfGetPaymentMethodAuthData = yield services_1.MySqlStorage.getPaymentMethodAuthData(body.paymentMethodCode);
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
                url = yield paypal.sale(body, authData);
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
});
exports.init = init;
