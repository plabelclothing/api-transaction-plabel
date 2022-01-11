"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** External modules **/
const uuid_1 = require("uuid");
const axios_1 = __importDefault(require("axios"));
/** Core modules **/
const qs_1 = __importDefault(require("qs"));
/** Locale modules **/
const enums_1 = require("../enums");
const services_1 = require("../services");
const luxon_1 = require("luxon");
const utils_1 = require("../utils");
class PayPal {
    /**
     * Create transaction
     * @param data
     * @param authData
     */
    async sale(data, authData) {
        const transactionUuid = uuid_1.v4();
        try {
            await services_1.MySqlStorage.insertTransaction(transactionUuid, data.userOrderUuid, data.paymentMethodCode, data.dictCurrencyIso4217, data.amount, enums_1.TransactionStatus.NEW, data.language, data.countryIso);
            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const dataToken = qs_1.default.stringify({
                grant_type: 'client_credentials'
            });
            const resultOfTokenGet = await axios_1.default({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: dataToken,
            });
            await services_1.MySqlStorage.insertTransactionLog(transactionUuid, JSON.stringify(resultOfTokenGet.data));
            const dataOrder = {
                intent: 'CAPTURE',
                purchase_units: [{
                        reference_id: transactionUuid,
                        shipping: {
                            name: {
                                full_name: data.shipping.name.full_name
                            },
                            address: {
                                address_line_1: data.shipping.address.address_line_1,
                                address_line_2: data.shipping.address.address_line_2,
                                admin_area_2: data.shipping.address.admin_area_2,
                                admin_area_1: data.shipping.address.admin_area_1,
                                postal_code: data.shipping.address.postal_code,
                                country_code: data.shipping.address.country_code
                            }
                        },
                        amount: {
                            currency_code: data.dictCurrencyIso4217,
                            value: data.amount,
                        }
                    }],
                application_context: {
                    return_url: `${"https://plabelclothing.com/paywall-callback?status=done" /* SUCCESS */}&paymentMethod=${data.paymentMethodCode}&transactionId=${transactionUuid}`,
                    cancel_url: `${"https://plabelclothing.com/paywall-callback?status=error" /* ERROR */}&paymentMethod=${data.paymentMethodCode}&transactionId=${transactionUuid}`
                }
            };
            const resultOfCreateOrder = await axios_1.default({
                method: 'POST',
                url: authData.urls.createOrder,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                data: dataOrder
            });
            await services_1.MySqlStorage.insertTransactionLog(transactionUuid, JSON.stringify(resultOfCreateOrder.data));
            await services_1.MySqlStorage.updateTransaction(transactionUuid, resultOfCreateOrder.data.id, enums_1.TransactionStatus.PENDING, null, null);
            const links = resultOfCreateOrder.data.links;
            let url;
            for (const property in links) {
                if (links[property].rel === 'approve') {
                    url = links[property].href;
                    break;
                }
            }
            return url;
        }
        catch (e) {
            await (async () => {
                await services_1.MySqlStorage.updateTransaction(transactionUuid, null, enums_1.TransactionStatus.ERROR, null, null);
            })();
            throw e;
        }
    }
    ;
    /**
     * Check sale notify
     * @param data
     * @param authData
     */
    async checkNotify(data, authData) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const dataReq = qs_1.default.stringify({
                grant_type: 'client_credentials'
            });
            const resultOfTokenGet = await axios_1.default({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: dataReq
            });
            const dataReqCheckNotify = {
                transmission_id: data.transmissionId,
                transmission_time: data.transmissionTime,
                cert_url: data.certUrl,
                auth_algo: data.alg,
                transmission_sig: data.transmissionSig,
                webhook_id: authData.webHookIds.checkOrderApprove,
                webhook_event: data.body
            };
            const resultOfCheckNotify = await axios_1.default({
                method: 'POST',
                url: authData.urls.checkNotify,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                data: dataReqCheckNotify
            });
            return resultOfCheckNotify.data.verification_status;
        }
        catch (e) {
            throw e;
        }
    }
    /**
     * Transaction capture
     * @param transactionExternalId
     * @param transactionUuid
     * @param authData
     */
    async capture(transactionExternalId, transactionUuid, authData) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const data = qs_1.default.stringify({
                grant_type: 'client_credentials'
            });
            const resultOfTokenGet = await axios_1.default({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            });
            const resultOfCaptureTransaction = await axios_1.default({
                method: 'POST',
                url: `${authData.urls.createOrder}/${transactionExternalId}/capture`,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                data: {}
            });
            await services_1.MySqlStorage.updateTransaction(transactionUuid, null, null, null, resultOfCaptureTransaction.data.purchase_units[0].payments.captures[0].id);
            await services_1.MySqlStorage.insertTransactionLog(transactionUuid, JSON.stringify(resultOfCaptureTransaction.data));
            return resultOfCaptureTransaction.data;
        }
        catch (e) {
            throw e;
        }
    }
    /**
     * Create refund
     * @param refundData
     * @param authData
     */
    async refund(refundData, authData) {
        try {
            const resultOfInsertRefund = await services_1.MySqlStorage.insertRefund(refundData.userUuid, refundData.userCartUuid, refundData.userCartItems, refundData.orderUuid, refundData.orderUuidSale, refundData.refundTransactionUuid, refundData.transactionUuid);
            if (!resultOfInsertRefund.length) {
                throw new Error('Refund is not created');
            }
            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const data = qs_1.default.stringify({
                grant_type: 'client_credentials'
            });
            const resultOfTokenGet = await axios_1.default({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            });
            await services_1.MySqlStorage.insertTransactionLog(refundData.refundTransactionUuid, JSON.stringify(resultOfTokenGet.data));
            const resultOfRefundTransaction = await axios_1.default({
                method: 'POST',
                url: `${authData.urls.refund}/${refundData.captureId}/refund`,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json',
                    'PayPal-Request-Id': refundData.refundTransactionUuid,
                },
                data: {
                    amount: {
                        value: resultOfInsertRefund[0].amount,
                        currency_code: refundData.dictCurrencyIso4217
                    },
                    note_to_payer: refundData.title,
                }
            });
            await services_1.MySqlStorage.insertTransactionLog(refundData.refundTransactionUuid, JSON.stringify(resultOfRefundTransaction.data));
            if (resultOfRefundTransaction.data.status.toUpperCase() === "COMPLETED" /* COMPLETED */) {
                /** Prepare mail data **/
                try {
                    await utils_1.sendPaymentEmail(enums_1.TransactionStatus.SETTLED, refundData.refundTransactionUuid, true);
                }
                catch (e) {
                    utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
                        error: e,
                        message: 'Error with prepare mail content',
                        additionalData: e.additionalData,
                    }));
                }
                return services_1.MySqlStorage.updateTransaction(refundData.refundTransactionUuid, resultOfRefundTransaction.data.id, enums_1.TransactionStatus.SETTLED, parseInt(luxon_1.DateTime.local().setZone(enums_1.LuxonTimezone.TZ).toFormat(enums_1.LuxonTimezone.UNIX_TIMESTAMP_FORMAT)), null);
            }
            else if (resultOfRefundTransaction.data.status.toUpperCase() === "PENDING" /* PENDING */) {
                return services_1.MySqlStorage.updateTransaction(refundData.refundTransactionUuid, resultOfRefundTransaction.data.id, enums_1.TransactionStatus.PENDING, null, null);
            }
            return services_1.MySqlStorage.updateTransaction(refundData.refundTransactionUuid, resultOfRefundTransaction.data.id, enums_1.TransactionStatus.CANCELED, null, null);
        }
        catch (e) {
            await (async () => {
                await services_1.MySqlStorage.updateTransaction(refundData.refundTransactionUuid, null, enums_1.TransactionStatus.ERROR, null, null);
            })();
            throw e;
        }
    }
}
exports.PayPal = PayPal;
