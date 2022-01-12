export enum TransactionStatus {
    NEW = 'new',
    PENDING = 'pending',
    SETTLED = 'settled',
    CANCELED = 'canceled',
    ERROR = 'error',
}

export const enum ReturnUrl {
    SUCCESS = 'https://plabelclothing.com/paywall-callback?status=done',
    ERROR = 'https://plabelclothing.com/paywall-callback?status=error'
}

export enum TransactionType {
    REFUND = 'refund',
    SALE = 'sale',
}