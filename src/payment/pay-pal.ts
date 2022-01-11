/** External modules **/
import {v4} from 'uuid';
import axios from 'axios';

/** Core modules **/
import qs from 'qs';

/** Locale modules **/
import {TransactionStatus, ReturnUrl, PayPalStatus, LuxonTimezone, LoggerLevel} from '../enums';
import {MySqlStorage} from '../services';
import {Payment} from '../types/payment';
import {DateTime} from "luxon";
import {logger, loggerMessage, sendPaymentEmail} from '../utils';

class PayPal {

    /**
     * Create transaction
     * @param data
     * @param authData
     */
    async sale(data: Payment.Data, authData: Payment.AuthData) {
        const transactionUuid = v4();
        try {
            await MySqlStorage.insertTransaction(
                transactionUuid,
                data.userOrderUuid,
                data.paymentMethodCode,
                data.dictCurrencyIso4217,
                data.amount,
                TransactionStatus.NEW,
                data.language,
                data.countryIso,
            );

            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const dataToken = qs.stringify({
                grant_type: 'client_credentials'
            });

            const resultOfTokenGet = await axios({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: dataToken,
            });

            await MySqlStorage.insertTransactionLog(transactionUuid, JSON.stringify(resultOfTokenGet.data));

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
                    return_url: `${ReturnUrl.SUCCESS}&paymentMethod=${data.paymentMethodCode}&transactionId=${transactionUuid}`,
                    cancel_url: `${ReturnUrl.ERROR}&paymentMethod=${data.paymentMethodCode}&transactionId=${transactionUuid}`
                }
            };

            const resultOfCreateOrder = await axios({
                method: 'POST',
                url: authData.urls.createOrder,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                data: dataOrder
            });

            await MySqlStorage.insertTransactionLog(transactionUuid, JSON.stringify(resultOfCreateOrder.data));
            await MySqlStorage.updateTransaction(transactionUuid, resultOfCreateOrder.data.id, TransactionStatus.PENDING, null, null);

            const links = resultOfCreateOrder.data.links;
            let url;
            for (const property in links) {
                if (links[property].rel === 'approve') {
                    url = links[property].href;
                    break;
                }
            }

            return url;
        } catch (e) {
            await (async () => {
                await MySqlStorage.updateTransaction(transactionUuid, null, TransactionStatus.ERROR, null, null);
            })();
            throw e;
        }
    };

    /**
     * Check sale notify
     * @param data
     * @param authData
     */
    async checkNotify(data: Payment.CheckNotifyPayPal, authData: Payment.AuthData) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const dataReq = qs.stringify({
                grant_type: 'client_credentials'
            });

            const resultOfTokenGet = await axios({
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

            const resultOfCheckNotify = await axios({
                method: 'POST',
                url: authData.urls.checkNotify,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                data: dataReqCheckNotify
            });

            return resultOfCheckNotify.data.verification_status;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Transaction capture
     * @param transactionExternalId
     * @param transactionUuid
     * @param authData
     */
    async capture(transactionExternalId: string, transactionUuid: string, authData: Payment.AuthData) {
        try {
            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const data = qs.stringify({
                grant_type: 'client_credentials'
            });

            const resultOfTokenGet = await axios({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            });

            const resultOfCaptureTransaction = await axios({
                method: 'POST',
                url: `${authData.urls.createOrder}/${transactionExternalId}/capture`,
                headers: {
                    Authorization: `${resultOfTokenGet.data.token_type} ${resultOfTokenGet.data.access_token}`,
                    'Content-Type': 'application/json'
                },
                data: {}
            });

            await MySqlStorage.updateTransaction(transactionUuid, null, null, null, resultOfCaptureTransaction.data.purchase_units[0].payments.captures[0].id);
            await MySqlStorage.insertTransactionLog(transactionUuid, JSON.stringify(resultOfCaptureTransaction.data));

            return resultOfCaptureTransaction.data;
        } catch (e) {
            throw e;
        }
    }

    /**
     * Create refund
     * @param refundData
     * @param authData
     */
    async refund(refundData: Payment.RefundData, authData: Payment.AuthData) {
        try {
            const resultOfInsertRefund = await MySqlStorage.insertRefund(
                refundData.userUuid,
                refundData.userCartUuid,
                refundData.userCartItems,
                refundData.orderUuid,
                refundData.orderUuidSale,
                refundData.refundTransactionUuid,
                refundData.transactionUuid,
            );

            if (!resultOfInsertRefund.length) {
                throw new Error('Refund is not created');
            }

            const authHeader = 'Basic ' + Buffer.from(`${authData.username}:${authData.password}`).toString('base64');
            const data = qs.stringify({
                grant_type: 'client_credentials'
            });

            const resultOfTokenGet = await axios({
                method: 'POST',
                url: authData.urls.token,
                headers: {
                    Authorization: authHeader,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
                data: data
            });

            await MySqlStorage.insertTransactionLog(refundData.refundTransactionUuid, JSON.stringify(resultOfTokenGet.data));

            const resultOfRefundTransaction = await axios({
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

            await MySqlStorage.insertTransactionLog(refundData.refundTransactionUuid, JSON.stringify(resultOfRefundTransaction.data));

            if (resultOfRefundTransaction.data.status.toUpperCase() === PayPalStatus.COMPLETED) {
                /** Prepare mail data **/
                try {
                    await sendPaymentEmail(TransactionStatus.SETTLED, refundData.refundTransactionUuid, true);
                } catch (e) {
                    logger.log(LoggerLevel.ERROR, loggerMessage({
                        error: e,
                        message: 'Error with prepare mail content',
                        additionalData: e.additionalData,
                    }));
                }
                return MySqlStorage.updateTransaction(refundData.refundTransactionUuid, resultOfRefundTransaction.data.id, TransactionStatus.SETTLED, parseInt(DateTime.local().setZone(LuxonTimezone.TZ).toFormat(LuxonTimezone.UNIX_TIMESTAMP_FORMAT)), null);
            } else if (resultOfRefundTransaction.data.status.toUpperCase() === PayPalStatus.PENDING) {
                return MySqlStorage.updateTransaction(refundData.refundTransactionUuid, resultOfRefundTransaction.data.id, TransactionStatus.PENDING, null, null);
            }

            return MySqlStorage.updateTransaction(refundData.refundTransactionUuid, resultOfRefundTransaction.data.id, TransactionStatus.CANCELED, null, null);
        } catch (e) {
            await (async () => {
                await MySqlStorage.updateTransaction(refundData.refundTransactionUuid, null, TransactionStatus.ERROR, null, null);
            })();
            throw e;
        }
    }
}

export {
    PayPal,
}