/** External modules **/
import {CronJob} from 'cron';

/** Locale modules **/
import config from './config';
import {LoggerLevel} from '../enums';
import {logger, loggerMessage} from '../utils';
import {PayPal} from '../payment/pay-pal';

/** Check pending refunds PayPal **/
const checkPayPalPendingRefund = new CronJob(config.cron.payPalPendingRefund, async () => {
    try {
        const paypal = new PayPal();

        await paypal.checkStatusRefund();

        logger.log(LoggerLevel.WARN, loggerMessage({
            message: 'PayPal pending refund transactions are checked',
        }));
    } catch (error) {
        logger.log(LoggerLevel.ERROR, loggerMessage({
            message: 'PayPal pending refund transactions aren\'t checked',
            error,
        }));
    }
}, null, true, config.luxon.timezone);

/** Start crons **/
checkPayPalPendingRefund.start();