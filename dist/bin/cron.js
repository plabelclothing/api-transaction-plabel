"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/** External modules **/
const cron_1 = require("cron");
/** Locale modules **/
const config_1 = __importDefault(require("./config"));
const utils_1 = require("../utils");
const pay_pal_1 = require("../payment/pay-pal");
/** Check pending refunds PayPal **/
const checkPayPalPendingRefund = new cron_1.CronJob(config_1.default.cron.payPalPendingRefund, async () => {
    try {
        const paypal = new pay_pal_1.PayPal();
        await paypal.checkStatusRefund();
        utils_1.logger.log("warn" /* WARN */, utils_1.loggerMessage({
            message: 'PayPal pending refund transactions are checked',
        }));
    }
    catch (error) {
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            message: 'PayPal pending refund transactions aren\'t checked',
            error,
        }));
    }
}, null, true, config_1.default.luxon.timezone);
/** Start crons **/
checkPayPalPendingRefund.start();
