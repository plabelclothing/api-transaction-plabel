import {Validator} from 'jsonschema';
import {ResponseThrowError} from '../utils';
import {LogCode, LogCodeId, StatusHttp} from '../enums';

const schemaValidator = (schema: any, data: any) => {
    const validator = new Validator();
    const checkSchema = validator.validate(data, schema);
    const checkError = checkSchema.errors;

    let validatorErrors: any[] = [];

    if (checkError.length) {
        checkError.forEach((val) => {
            validatorErrors.push({
                property: val.property,
                message: val.message
            })
        })
    }

    if (!checkSchema.valid) {
        throw new ResponseThrowError({
            statusCode: 400,
            response: {
                status: StatusHttp.FAIL,
                message: 'Unprocessable entity',
                data: {
                    errorCode: LogCode.VALIDATION_UTIL__ERR,
                    errorId: LogCodeId.VALIDATION_UTIL__ERR,
                    validatorErrors: validatorErrors
                }
            }
        });
    }
};

export {
    schemaValidator,
};
