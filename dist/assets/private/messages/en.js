"use strict";
const categories = {
    payment_status: {
        label_title: 'Payment status',
        label_hello: 'Good afternoon,',
        label_order_id: 'Order ID:',
        label_status_order: 'Payment status:',
        label_payment_method: 'Payment method:',
        label_amount: 'Amount:',
        label_king_regards: 'Best wishes,',
        label_plabel: 'PLABEL COMPANY',
    },
    order_invoice: {
        label_invoice: 'Payment confirmation',
        label_invoice_date: 'DATE',
        label_address: 'ADDRESS',
        label_order_id: 'ORDER ID',
        label_order: 'Your order',
        label_color: 'Color:',
        label_size: 'Size:',
        label_number: 'Quantity:',
        label_subtotal: 'Subtotal:',
        label_delivery: 'Delivery:',
        label_free: 'FREE',
        label_total: 'TOTAL:',
        label_shipping: 'We will send you the tracking number after the order has been shipped.',
        label_account: 'Order details are available in the user\'s personal account',
        label_visit_account: 'Go to the user\'s personal account.',
        label_support: 'Please contact our customer service if you have questions.',
        label_visit_support: 'Go to the PLABEL COMPANY support page.',
    },
    default: {
        label_terms_use: 'Website Terms of Use',
        label_policy_shipping_delivery: 'Shipping & Delivery',
        sale_policy: 'Sale policy',
        return_policy: 'Return policy',
        year: (() => {
            return new Date().getFullYear();
        })(),
        label_get_help: 'Get help with subscriptions and purchases.',
        label_visit_support: 'Visit Plabel Support.',
    },
    colors: {
        RED: 'Red',
        GREY: 'Grey',
        BLACK: 'Black'
    },
    transactionStatus: {
        canceled: 'cancelled',
        cancelled: 'cancelled',
        error: 'error',
        new: 'new',
        pending: 'pending',
        settled: 'settled'
    },
};
module.exports = categories;
