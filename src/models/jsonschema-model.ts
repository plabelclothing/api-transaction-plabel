import {PaymentMethodCodeValidation} from '../enums';

const uuid = {
    type: 'string',
    format: '^[a-fA-F0-9]{8}-[a-fA-F0-9]{4}-[4][a-fA-F0-9]{3}-[89abAB][a-fA-F0-9]{3}-[a-fA-F0-9]{12}$'
};

const userEmail = {
    type: 'string',
    minLength: 5,
    format: 'email',
};

const transactionInitSchema = {
    type: 'object',
    properties: {
        userOrderUuid: uuid,
        paymentMethodCode: {
            type: 'string',
            enum: PaymentMethodCodeValidation,
        },
        countryIso: {
            type: 'string',
            maxLength: 2,
            minLength: 2,
        },
        language: {
            type: 'string',
            maxLength: 2,
            minLength: 2,
        },
        amount: {
            type: 'number'
        },
        dictCurrencyIso4217: {
            type: 'string',
        },
        shipping: {
            type: 'object',
            properties: {
                address: {
                    type: 'object',
                    properties: {
                        postal_code: {
                            type: 'string'
                        },
                        admin_area_1: {
                            type: 'string'
                        },
                        admin_area_2: {
                            type: 'string'
                        },
                        country_code: {
                            type: 'string',
                            maxLength: 2
                        },
                        address_line_1: {
                            type: 'string'
                        },
                        address_line_2: {
                            type: 'string'
                        },
                        email: userEmail,
                        phone: {
                            type: ['string']
                        }
                    },
                    required: ['postal_code', 'admin_area_1', 'admin_area_2', 'country_code', 'address_line_1', 'address_line_2', 'email', 'phone'],
                    additionalProperties: false
                },
                name: {
                    properties: {
                        full_name: {
                            type: 'string'
                        }
                    },
                    required: ['full_name'],
                    additionalProperties: false
                }
            }
        },
    },
    required: ['userOrderUuid', 'paymentMethodCode', 'countryIso', 'language', 'amount', 'dictCurrencyIso4217', 'shipping'],
    additionalProperties: false
};

export {
    transactionInitSchema,
}
