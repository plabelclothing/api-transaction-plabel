"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const nodemailer_1 = require("nodemailer");
const handlebars_1 = __importDefault(require("handlebars"));
const currency_formatter_1 = __importDefault(require("currency-formatter"));
const uuid_1 = require("uuid");
/** Core modules **/
const path_1 = require("path");
const fs_1 = require("fs");
/*Locale modules */
const config_1 = __importDefault(require("../bin/config"));
const enums_1 = require("../enums");
const services_1 = require("../services");
/**
 * Send mail util
 * @param data
 */
const mailerUtil = async (data) => {
    const { mailTo, mailUuid, type, userUuid, additionalData, bcc, isSupport, } = data;
    const currentLanguage = ['ru', 'en'];
    const lang = data.lang ? data.lang.toLocaleLowerCase() : 'en';
    const mailLanguage = currentLanguage.includes(lang) ? lang : 'en';
    try {
        let subject;
        try {
            subject = enums_1.MailSubject[type].translate[mailLanguage];
        }
        catch (_a) {
            subject = enums_1.MailSubject[type].translate['en'];
        }
        const mailOption = {
            from: isSupport ? config_1.default.mailer.fromSupport : config_1.default.mailer.from,
            to: mailTo,
            bcc: bcc,
            subject,
            html: createTpl(type, lang, additionalData, enums_1.MailSubject[type].layout),
        };
        await services_1.MySqlStorage.insertEmail(mailUuid, userUuid, mailTo, type, enums_1.MailStatus.NEW, JSON.stringify(mailOption));
        const transporter = nodemailer_1.createTransport({
            host: config_1.default.mailer.host,
            port: config_1.default.mailer.port,
            secure: config_1.default.mailer.secure,
            auth: {
                user: isSupport ? config_1.default.mailer.supportAuth.user : config_1.default.mailer.auth.user,
                pass: isSupport ? config_1.default.mailer.supportAuth.pass : config_1.default.mailer.auth.pass,
            },
        });
        await transporter.sendMail(mailOption);
        await services_1.MySqlStorage.updateEmail(mailUuid, enums_1.MailStatus.SENT);
    }
    catch (error) {
        await services_1.MySqlStorage.updateEmail(mailUuid, enums_1.MailStatus.ERROR);
        throw error;
    }
};
exports.mailerUtil = mailerUtil;
/**
 * Create mail
 * @param type
 * @param lang
 * @param additionalData
 * @param layoutType
 */
const createTpl = (type, lang = 'en', additionalData = {}, layoutType) => {
    try {
        const layout = fs_1.readFileSync(path_1.resolve('assets', 'private', 'layouts', `${layoutType}.hbs`), 'utf8');
        let typeDefault = fs_1.readFileSync(path_1.resolve('assets', 'private', 'templates', `${type}.hbs`), 'utf8');
        let textLang;
        try {
            textLang = require(path_1.resolve('assets', 'private', 'messages', `${lang}.js`));
        }
        catch (_a) {
            textLang = require(path_1.resolve('assets', 'private', 'messages', 'en.js'));
        }
        const mailData = Object.assign(Object.assign({}, textLang[type]), additionalData);
        const typeCompile = handlebars_1.default.compile(typeDefault, { noEscape: true });
        let filledTemplate = {
            mail: ''
        };
        filledTemplate.mail = typeCompile(mailData);
        filledTemplate = Object.assign(filledTemplate, textLang.default);
        const layoutCompile = handlebars_1.default.compile(layout, { noEscape: true });
        return layoutCompile(filledTemplate);
    }
    catch (err) {
        throw err;
    }
};
const sendPaymentEmail = async (transactionStatus, transactionUuid) => {
    try {
        const resultOfGetOrderData = await services_1.MySqlStorage.getEmailData(transactionUuid);
        let textLang;
        try {
            textLang = require(path_1.resolve('assets', 'private', 'messages', `${resultOfGetOrderData[0].transaction_customer__locale}.js`));
        }
        catch (e) {
            textLang = require(path_1.resolve('assets', 'private', 'messages', `en.js`));
        }
        const parsedAddress = JSON.parse(resultOfGetOrderData[0].user_order__address);
        const transactionAmount = currency_formatter_1.default.format(resultOfGetOrderData[0].transaction__amount, { code: resultOfGetOrderData[0].dict_currency__iso4217 });
        /** Send mail with transaction status **/
        const mailDataTransactionStatus = {
            USER_ORDER_ID: resultOfGetOrderData[0].user_order__external_id,
            TRANSACTION_STATUS: textLang.transactionStatus[resultOfGetOrderData[0].transaction__status],
            PAYMENT_METHOD: resultOfGetOrderData[0].payment_method__name,
            TRANSACTION_AMOUNT: transactionAmount,
        };
        await mailerUtil({
            mailTo: parsedAddress.address.email,
            mailUuid: uuid_1.v4(),
            type: enums_1.MailTemplate.PAYMENT_STATUS,
            userUuid: resultOfGetOrderData[0].user__uuid || null,
            lang: resultOfGetOrderData[0].transaction_customer__locale,
            additionalData: mailDataTransactionStatus,
        });
        if (transactionStatus !== enums_1.TransactionStatus.SETTLED) {
            return true;
        }
        /** Send mail with invoice if transaction is settled **/
        const invoiceDate = new Date(resultOfGetOrderData[0].user_order__created * 1000);
        const strAddress = `
            <br>${parsedAddress.name.full_name}<br>
            ${parsedAddress.address.admin_area_1} ${parsedAddress.address.admin_area_2}<br>
            ${parsedAddress.address.address_line_1} ${parsedAddress.address.address_line_2}<br>
            ${parsedAddress.address.country_code}`;
        let orders = [];
        resultOfGetOrderData.forEach(val => {
            const imagesParsed = JSON.parse(val.list_product__images);
            const order = {
                IMG: imagesParsed.general,
                ORDER_NAME: val.list_product__name,
                COLOR: textLang.colors[val.dict_color__code],
                SIZE: val.dict_size__name,
                NUMBER: val.products__count,
                PRICE: currency_formatter_1.default.format(val.user_cart_items__amount, { code: val.dict_currency__iso4217 })
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
            mailUuid: uuid_1.v4(),
            type: enums_1.MailTemplate.ORDER_INVOICE,
            userUuid: resultOfGetOrderData[0].user__uuid || null,
            lang: resultOfGetOrderData[0].transaction_customer__locale,
            additionalData: mailDataInvoice,
        });
    }
    catch (e) {
        throw e;
    }
};
exports.sendPaymentEmail = sendPaymentEmail;
