/** External modules **/
import {Request, Response} from 'express';
import {v4} from 'uuid';

/** Locale modules **/
import {logger, loggerMessage, ResponseThrowError, schemaValidator} from '../utils';
import {LogCode, LogCodeId, LoggerLevel, StatusHttp, PaymentMethodCode, TransactionStatus} from '../enums';
import {transactionInitSchema, transactionRefundSchema} from '../models';
import {MySqlStorage} from '../services';
import {Payment} from '../types/payment';

/** Payment **/
import {PayPal} from '../payment/pay-pal';

/**
 * Init transaction
 * @param req
 * @param res
 */
const init = async (req: Request, res: Response) => {
    try {
        const {
            body,
        } = req;

        await schemaValidator(transactionInitSchema, body);

        const resultOfGetPaymentMethodAuthData = await MySqlStorage.getPaymentMethodAuthData(body.paymentMethodCode);

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

        let url = '';

        switch (body.paymentMethodCode) {
            case PaymentMethodCode.PAY_PAL:
                const paypal = new PayPal();
                url = await paypal.sale(body, authData);
                break;
            default:
                break;
        }

        if (url === '') {
            throw new ResponseThrowError({
                statusCode: 500,
                message: `Link is not created`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.TRANSACTION_URL_IS_NOT_EXIST__ERROR,
                        errorId: LogCodeId.TRANSACTION_URL_IS_NOT_EXIST__ERROR,
                    }
                }
            });
        }

        res.status(200).send({
            status: StatusHttp.SUCCESS,
            data: {
                url,
            },
        });

    } catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);

        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};

/**
 * Init refund
 * @param req
 * @param res
 */
const refund = async (req: Request, res: Response) => {
    try {
        const {
            body,
        } = req;

        await schemaValidator(transactionRefundSchema, body);

        const resultOfCheckRefund = await MySqlStorage.checkRefund(JSON.stringify(body.userCartItems));

        if (resultOfCheckRefund.length) {
            throw new ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create, because it is exist`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.REFUND_IS_EXIST,
                        errorId: LogCodeId.REFUND_IS_EXIST,
                    }
                }
            });
        }

        const resultOfGetRefundData = await MySqlStorage.getRefundData(JSON.stringify(body.userCartItems));

        if (resultOfGetRefundData.length !== 1) {
            throw new ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.REFUND_IS_NOT_CREATED,
                        errorId: LogCodeId.REFUND_IS_NOT_CREATED,
                    }
                }
            });
        }

        if (resultOfGetRefundData[0].transaction__status !== TransactionStatus.SETTLED) {
            throw new ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create, because transaction is not settled`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.REFUND_IS_NOT_CREATED,
                        errorId: LogCodeId.REFUND_IS_NOT_CREATED,
                    }
                }
            });
        }

        if (!resultOfGetRefundData[0].transaction__capture_id && resultOfGetRefundData[0].payment_method__code === PaymentMethodCode.PAY_PAL) {
            throw new ResponseThrowError({
                statusCode: 409,
                message: `Refund can't create, because capture id is null`,
                response: {
                    status: StatusHttp.FAIL,
                    data: {
                        errorCode: LogCode.REFUND_IS_NOT_CREATED,
                        errorId: LogCodeId.REFUND_IS_NOT_CREATED,
                    }
                }
            });
        }

        const resultOfGetPaymentMethodAuthData = await MySqlStorage.getPaymentMethodAuthData(resultOfGetRefundData[0].payment_method__code);

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
        const refundData: Payment.RefundData = {
            dictCurrencyIso4217: resultOfGetRefundData[0].dict_currency__iso4217,
            orderUuid: v4(),
            orderUuidSale: resultOfGetRefundData[0].user_order__uuid,
            refundTransactionUuid: v4(),
            saleExternalId: resultOfGetRefundData[0].transaction__external_id,
            title: `Refund ${resultOfGetRefundData[0].user_order__external_id}`,
            transactionUuid: resultOfGetRefundData[0].transaction__uuid,
            userCartItems: JSON.stringify(body.userCartItems),
            userCartUuid: v4(),
            userUuid: resultOfGetRefundData[0].user__uuid,
            captureId: resultOfGetRefundData[0].transaction__capture_id,
        };

        switch (resultOfGetRefundData[0].payment_method__code) {
            case PaymentMethodCode.PAY_PAL:
                const paypal = new PayPal();
                await paypal.refund(refundData, authData);
                break;
            default:
                break;
        }

        res.status(200).send({
            status: StatusHttp.SUCCESS,
        });

    } catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);

        logger.log(LoggerLevel.ERROR, loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};

export {
    init,
    refund,
}
