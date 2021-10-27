/** External modules **/
import {Request, Response} from 'express';
import {DateTime} from 'luxon';

/** Locale modules **/
import {logger, loggerMessage, sendPaymentEmail, ResponseThrowError, schemaValidator} from '../utils';
import {
    LogCode,
    LogCodeId,
    LoggerLevel,
    LuxonTimezone,
    OrderStatus,
    PaymentMethodCode,
    PayPalStatus,
    StatusHttp,
    TransactionStatus
} from '../enums';
import {notifyPayPalBody, notifyPayPalHeaders} from '../models';
import {MySqlStorage} from '../services';
import {Payment} from '../types/payment';

/** Payment **/
import {PayPal} from '../payment/pay-pal';

const payPalNotify = async (req: Request, res: Response) => {
    const {
        body,
        headers
    } = req;

    const notifyObj = {
        headers,
        body
    };

    try {
        schemaValidator(notifyPayPalHeaders, headers);
        schemaValidator(notifyPayPalBody, body);

        const resultOfGetTransactionUuid = await MySqlStorage.getTransactionByExternalId(body.resource.id);

        if (!resultOfGetTransactionUuid.length) {
            throw new ResponseThrowError({
                statusCode: 404,
                message: `Transaction is not exist`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.DATA_NOT_FOUND,
                        errorId: LogCodeId.DATA_NOT_FOUND,
                    }
                }
            });
        }

        const transactionUuid = resultOfGetTransactionUuid[0].transaction__uuid;

        await MySqlStorage.insertNotify(transactionUuid, JSON.stringify(notifyObj));

        const resultOfGetPaymentMethodAuthData = await MySqlStorage.getPaymentMethodAuthData(PaymentMethodCode.PAY_PAL);

        if (!resultOfGetPaymentMethodAuthData.length) {
            throw new ResponseThrowError({
                statusCode: 404,
                message: `Payment method auth data is not exist`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.AUTH_DATA_IS_NOT_EXIST__ERROR,
                        errorId: LogCodeId.AUTH_DATA_IS_NOT_EXIST__ERROR,
                    }
                }
            });
        }

        const authData: Payment.AuthData = JSON.parse(resultOfGetPaymentMethodAuthData[0].payment_method_auth__data);

        const paypal = new PayPal();
        const resultOfCheckStatusPayPal = await paypal.checkNotify({
            transmissionId: headers['paypal-transmission-id'],
            transmissionTime: headers['paypal-transmission-time'],
            certUrl: headers['paypal-cert-url'],
            alg: headers['paypal-auth-algo'],
            transmissionSig: headers['paypal-transmission-sig'],
            body: body
        }, authData);

        if (resultOfCheckStatusPayPal !== PayPalStatus.SUCCESS) {
            throw new ResponseThrowError({
                statusCode: 409,
                message: `Notification is not correct`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.NOTIFY_IS_NOT_CORRECT,
                        errorId: LogCodeId.NOTIFY_IS_NOT_CORRECT,
                    }
                }
            });
        }

        let orderStatus = OrderStatus.APPROVED;
        let transactionStatus = TransactionStatus.SETTLED;

        if (body.resource.status !== PayPalStatus.APPROVED) {
            orderStatus = OrderStatus.CANCELED;
        }

        if (body.resource.status === PayPalStatus.APPROVED) {
            const resultOfCaptureTrx = await paypal.capture(body.resource.id, authData);

            await MySqlStorage.insertNotify(body.transactionUuid, JSON.stringify(resultOfCaptureTrx));

            let transactionSettledAt: number | null = parseInt(DateTime.local().setZone(LuxonTimezone.TZ).toFormat(LuxonTimezone.UNIX_TIMESTAMP_FORMAT));

            if (resultOfCaptureTrx.status !== PayPalStatus.COMPLETED) {
                transactionStatus = TransactionStatus.CANCELED;
                orderStatus = OrderStatus.NEW;
                transactionSettledAt = null;
            }
            await MySqlStorage.updateTransaction(transactionUuid, null, transactionStatus, transactionSettledAt);
        }

        await MySqlStorage.updateUserOrderData(transactionUuid, JSON.stringify(body.resource.purchase_units[0].shipping), orderStatus, orderStatus === OrderStatus.CANCELED ? OrderStatus.NEW : OrderStatus.PENDING);

        res.status(200).send({
            status: StatusHttp.SUCCESS,
        });

        /** Prepare mail data **/
        try {
            await sendPaymentEmail(transactionStatus, transactionUuid);
        } catch (e) {
            logger.log(LoggerLevel.ERROR, loggerMessage({
                error: e,
                message: 'Error with prepare mail content',
                additionalData: e.additionalData,
            }));
        }
    } catch (error) {
        await (async () => {
            await MySqlStorage.insertNotify(null, JSON.stringify(notifyObj));
        })();
        res.status(error.statusCode || 500).json(error.responseObject);
        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};

export {
    payPalNotify,
}