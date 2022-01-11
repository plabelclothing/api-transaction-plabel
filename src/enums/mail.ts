import {Utils} from '../types/utils';

export enum MailStatus {
    NEW = 'new',
    ERROR = 'error',
    PENDING = 'pending',
    SENT = 'sent',
}

export enum MailTemplate {
    ORDER_INVOICE = 'order_invoice',
    PAYMENT_STATUS = 'payment_status',
    REFUND_INVOICE = 'refund_invoice',
}

export enum SupportMail {
    SUPPORT = 'support@plabelclothing.com'
}

export const MailSubject: Utils.MailSubject = {
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
    refund_invoice: {
        translate: {
            en: 'Refund confirmation | PLABEL COMPANY',
            ru: 'Подтверждение возврата | PLABEL COMPANY',
        },
        layout: 'layout_payment',
        version: '1.0.0',
    },
};