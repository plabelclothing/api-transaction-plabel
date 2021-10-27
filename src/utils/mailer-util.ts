/* External modules */
import {createTransport} from 'nodemailer';
import handlebars from 'handlebars';
import currencyFormatter from 'currency-formatter';
import {v4} from 'uuid';

/** Core modules **/
import {resolve} from 'path';
import {readFileSync} from 'fs';

/*Locale modules */
import config from '../bin/config';
import {MailStatus, MailSubject, MailTemplate, TransactionStatus} from '../enums';
import {MySqlStorage} from '../services';
import {Utils} from '../types/utils';

/**
 * Send mail util
 * @param data
 */
const mailerUtil = async (data: Utils.MailerData) => {
    const {
        mailTo,
        mailUuid,
        type,
        userUuid,
        additionalData,
        bcc,
        isSupport,
    } = data;

    const currentLanguage = ['ru', 'en'];
    const lang = data.lang ? data.lang.toLocaleLowerCase() : 'en';
    const mailLanguage = currentLanguage.includes(lang) ? lang : 'en';

    try {
        let subject: string;
        try {
            subject = MailSubject[type].translate[mailLanguage];
        } catch {
            subject = MailSubject[type].translate['en'];
        }

        const mailOption = {
            from: isSupport ? config.mailer.fromSupport : config.mailer.from,
            to: mailTo,
            bcc: bcc,
            subject,
            html: createTpl(type, lang, additionalData, MailSubject[type].layout),
        };
        await MySqlStorage.insertEmail(mailUuid, userUuid, mailTo, type, MailStatus.NEW, JSON.stringify(mailOption));

        const transporter = createTransport({
            host: config.mailer.host,
            port: config.mailer.port,
            secure: config.mailer.secure,
            auth: {
                user: isSupport ? config.mailer.supportAuth.user : config.mailer.auth.user,
                pass: isSupport ? config.mailer.supportAuth.pass : config.mailer.auth.pass,
            },
        });

        await transporter.sendMail(mailOption);

        await MySqlStorage.updateEmail(mailUuid, MailStatus.SENT);
    } catch (error) {
        await MySqlStorage.updateEmail(mailUuid, MailStatus.ERROR);
        throw error;
    }
};

/**
 * Create mail
 * @param type
 * @param lang
 * @param additionalData
 * @param layoutType
 */
const createTpl = (type: string, lang: string = 'en', additionalData: Utils.MailerData['additionalData'] = {}, layoutType: string) => {
    try {
        const layout = readFileSync(resolve('assets', 'private', 'layouts', `${layoutType}.hbs`), 'utf8');
        let typeDefault = readFileSync(resolve('assets', 'private', 'templates', `${type}.hbs`), 'utf8');
        let textLang: any;

        try {
            textLang = require(resolve('assets', 'private', 'messages', `${lang}.js`));
        } catch {
            textLang = require(resolve('assets', 'private', 'messages', 'en.js'));
        }

        const mailData = {...textLang[type], ...additionalData};
        const typeCompile = handlebars.compile(typeDefault, {noEscape: true});

        let filledTemplate = {
            mail: ''
        };

        filledTemplate.mail = typeCompile(mailData);

        filledTemplate = Object.assign(filledTemplate, textLang.default);

        const layoutCompile = handlebars.compile(layout, {noEscape: true});

        return layoutCompile(filledTemplate);
    } catch (err) {
        throw err;
    }
};

const sendPaymentEmail = async (transactionStatus: string, transactionUuid: string) => {
    try {
        const resultOfGetOrderData = await MySqlStorage.getEmailData(transactionUuid);

        let textLang: { [key: string]: any };
        try {
            textLang = require(resolve('assets', 'private', 'messages', `${resultOfGetOrderData[0].transaction_customer__locale}.js`));
        } catch (e) {
            textLang = require(resolve('assets', 'private', 'messages', `en.js`));
        }
        const parsedAddress = JSON.parse(resultOfGetOrderData[0].user_order__address);
        const transactionAmount = currencyFormatter.format(resultOfGetOrderData[0].transaction__amount, {code: resultOfGetOrderData[0].dict_currency__iso4217});

        /** Send mail with transaction status **/
        const mailDataTransactionStatus = {
            USER_ORDER_ID: resultOfGetOrderData[0].user_order__external_id,
            TRANSACTION_STATUS: textLang.transactionStatus[resultOfGetOrderData[0].transaction__status],
            PAYMENT_METHOD: resultOfGetOrderData[0].payment_method__name,
            TRANSACTION_AMOUNT: transactionAmount,
        };

        await mailerUtil({
            mailTo: parsedAddress.address.email,
            mailUuid: v4(),
            type: MailTemplate.PAYMENT_STATUS,
            userUuid: resultOfGetOrderData[0].user__uuid || null,
            lang: resultOfGetOrderData[0].transaction_customer__locale,
            additionalData: mailDataTransactionStatus,
        });

        if (transactionStatus !== TransactionStatus.SETTLED) {
            return true;
        }

        /** Send mail with invoice if transaction is settled **/
        const invoiceDate = new Date(resultOfGetOrderData[0].user_order__created * 1000);

        const strAddress = `
            <br>${parsedAddress.name.full_name}<br>
            ${parsedAddress.address.admin_area_1} ${parsedAddress.address.admin_area_2}<br>
            ${parsedAddress.address.address_line_1} ${parsedAddress.address.address_line_2}<br>
            ${parsedAddress.address.country_code}`;

        let orders: { [key: string]: any }[] = [];

        resultOfGetOrderData.forEach(val => {
            const imagesParsed = JSON.parse(val.list_product__images);
            const order = {
                IMG: imagesParsed.general,
                ORDER_NAME: val.list_product__name,
                COLOR: textLang.colors[val.dict_color__code],
                SIZE: val.dict_size__name,
                NUMBER: val.products__count,
                PRICE: currencyFormatter.format(val.user_cart_items__amount, {code: val.dict_currency__iso4217})
            };
            orders.push(order);
        });

        const mailDataInvoice = {
            INVOICE_DATE: `${invoiceDate.getFullYear()}/${invoiceDate.getMonth() + 1}/${invoiceDate.getDate()}`,
            ADDRESS: strAddress,
            ORDER_ID: resultOfGetOrderData[0].user_order__external_id,
            ORDERS: orders,
            ORDER_AMOUNT: transactionAmount,
        };

        await mailerUtil({
            mailTo: parsedAddress.address.email,
            mailUuid: v4(),
            type: MailTemplate.ORDER_INVOICE,
            userUuid: resultOfGetOrderData[0].user__uuid || null,
            lang: resultOfGetOrderData[0].transaction_customer__locale,
            additionalData: mailDataInvoice,
        });
    } catch (e) {
        throw e;
    }
};

export {
    mailerUtil,
    sendPaymentEmail,
}
