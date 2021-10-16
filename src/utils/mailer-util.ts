/* External modules */
import {createTransport} from 'nodemailer';
import handlebars from 'handlebars';

/** Core modules **/
import {resolve} from 'path';
import {readFileSync} from 'fs';

/*Locale modules */
import config from '../bin/config';
import {MailStatus, MailSubject} from '../enums';
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

export {
    mailerUtil,
}
