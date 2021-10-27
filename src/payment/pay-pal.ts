/** External modules **/
import {v4} from 'uuid';
import axios from 'axios';

/** Core modules **/
import qs from 'qs';

/** Locale modules **/
import {TransactionStatus, ReturnUrl} from '../enums';
import {MySqlStorage} from '../services';
import {Payment} from '../types/payment';

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
            await MySqlStorage.updateTransaction(transactionUuid, resultOfCreateOrder.data.id, TransactionStatus.PENDING, null);

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
                await MySqlStorage.updateTransaction(transactionUuid, null, TransactionStatus.ERROR, null);
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
     * @param authData
     */
    async capture(transactionExternalId: string, authData: Payment.AuthData) {
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

            return resultOfCaptureTransaction.data;
        } catch (e) {
            throw e;
        }
    }
}

export {
    PayPal,
}