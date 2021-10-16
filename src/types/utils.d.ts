export declare module Utils {
    export interface MailerData {
        mailTo: string,
        mailUuid: string,
        type: string
        userUuid: string | null
        lang?: string
        bcc?: string,
        additionalData?: any,
        isSupport?: boolean,
    }

    export interface MailSubject {
        [key: string]: {
            translate: { [key: string]: string },
            layout: string,
            version: string,
        }
    }
}