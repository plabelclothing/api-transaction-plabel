"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MailStatus;
(function (MailStatus) {
    MailStatus["NEW"] = "new";
    MailStatus["ERROR"] = "error";
    MailStatus["PENDING"] = "pending";
    MailStatus["SENT"] = "sent";
})(MailStatus = exports.MailStatus || (exports.MailStatus = {}));
var MailTemplate;
(function (MailTemplate) {
    MailTemplate["ORDER_INVOICE"] = "order_invoice";
    MailTemplate["PAYMENT_STATUS"] = "payment_status";
})(MailTemplate = exports.MailTemplate || (exports.MailTemplate = {}));
var SupportMail;
(function (SupportMail) {
    SupportMail["SUPPORT"] = "support@plabelclothing.com";
})(SupportMail = exports.SupportMail || (exports.SupportMail = {}));
exports.MailSubject = {
    payment_status: {
        translate: {
            en: 'Payment status | PLABEL COMPANY',
            ru: 'Статус платежа | PLABEL COMPANY',
        },
        layout: 'layout_default',
        version: '1.0.0',
    },
    order_invoice: {
        translate: {
            en: 'Receipt | PLABEL COMPANY',
            ru: 'Подтверждение оплаты | PLABEL COMPANY',
        },
        layout: 'layout_payment',
        version: '1.0.0',
    },
};
