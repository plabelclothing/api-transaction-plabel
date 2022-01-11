export declare module DbQuery {
    export interface GetPaymentMethodAuthData {
        payment_method_auth__data: string,
    }

    export interface GetTransactionByExternalId {
        transaction__uuid: string,
    }

    export interface GetEmailData {
        user_order__external_id: string,
        user_order__address: string,
        user_order__created: number,
        user_order__status: string,
        user__uuid: string,

        products__count: number,

        list_product__name: string,
        list_product__images: string,

        user_cart_items__amount: number,

        dict_currency__iso4217: string,

        transaction__amount: number,
        transaction__status: string,

        dict_color__code: string,

        dict_size__name: string,

        payment_method__name: string,

        transaction_customer__locale: string
    }

    export interface CheckRefund {
        user_cart_items__uuid: string,
    }

    export interface GetRefundData {
        user__uuid: string,
        user_order__uuid: string,
        user_order__external_id: string,
        transaction__uuid: string,
        transaction__external_id: string,
        payment_method__code: string,
        dict_currency__iso4217: string,
        transaction__status: string,
        transaction__capture_id: string,
    }

    export interface InsertRefund {
        amount: number,
    }
}
