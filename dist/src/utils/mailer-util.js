"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const nodemailer_1 = require("nodemailer");
const handlebars_1 = __importDefault(require("handlebars"));
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
const mailerUtil = (data) => __awaiter(void 0, void 0, void 0, function* () {
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
        yield services_1.MySqlStorage.insertEmail(mailUuid, userUuid, mailTo, type, enums_1.MailStatus.NEW, JSON.stringify(mailOption));
        const transporter = nodemailer_1.createTransport({
            host: config_1.default.mailer.host,
            port: config_1.default.mailer.port,
            secure: config_1.default.mailer.secure,
            auth: {
                user: isSupport ? config_1.default.mailer.supportAuth.user : config_1.default.mailer.auth.user,
                pass: isSupport ? config_1.default.mailer.supportAuth.pass : config_1.default.mailer.auth.pass,
            },
        });
        yield transporter.sendMail(mailOption);
        yield services_1.MySqlStorage.updateEmail(mailUuid, enums_1.MailStatus.SENT);
    }
    catch (error) {
        yield services_1.MySqlStorage.updateEmail(mailUuid, enums_1.MailStatus.ERROR);
        throw error;
    }
});
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
