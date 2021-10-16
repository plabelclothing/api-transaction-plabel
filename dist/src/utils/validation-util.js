"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const jsonschema_1 = require("jsonschema");
const utils_1 = require("../utils");
const schemaValidator = (schema, data) => {
    const validator = new jsonschema_1.Validator();
    const checkSchema = validator.validate(data, schema);
    const checkError = checkSchema.errors;
    let validatorErrors = [];
    if (checkError.length) {
        checkError.forEach((val) => {
            validatorErrors.push({
                property: val.property,
                message: val.message
            });
        });
    }
    if (!checkSchema.valid) {
        throw new utils_1.ResponseThrowError({
            statusCode: 400,
            response: {
                status: "FAIL" /* FAIL */,
                message: 'Unprocessable entity',
                data: {
                    errorCode: "VALIDATION__ERROR" /* VALIDATION_UTIL__ERR */,
                    errorId: 10000008 /* VALIDATION_UTIL__ERR */,
                    validatorErrors: validatorErrors
                }
            }
        });
    }
};
exports.schemaValidator = schemaValidator;
