/** External modules **/
import {Request, Response} from 'express';

/** Locale modules **/
import {logger, loggerMessage, ResponseThrowError, schemaValidator} from '../utils';
import {LogCode, LogCodeId, LoggerLevel, StatusHttp, PaymentMethodCode} from '../enums';
import {transactionInitSchema} from '../models';
import {MySqlStorage} from '../services';
import {Payment} from '../types/payment';

/** Payment **/
import {PayPal} from '../payment/pay-pal';

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

export {
    init,
}
