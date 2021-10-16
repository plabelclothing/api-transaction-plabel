export declare module Payment {
    export interface Data {
        userOrderUuid: string,
        paymentMethodCode: string,
        countryIso: string,
        language: string,
        amount: number,
        dictCurrencyIso4217: string,
        shipping: {
            address: {
                postal_code: string,
                admin_area_1: string,
                admin_area_2: string,
                country_code: string,
                address_line_1: string,
                address_line_2: string,
                email: string,
                phone: string,
            },
            name: {
                full_name: string,
            }
        },
    }

    export interface AuthData {
        username: string,
        password: string,
        urls: {
            token: string,
            createOrder: string,
            checkNotify: string,
        },
        webHookIds: {
            checkOrderApprove: string,
        }
    }
}