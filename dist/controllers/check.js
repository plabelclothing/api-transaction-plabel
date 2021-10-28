"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* Locale modules */
const utils_1 = require("../utils");
const services_1 = require("../services");
const ping = async (req, res) => {
    res.status(200).send('pong');
};
exports.ping = ping;
const telemetry = async (req, res) => {
    try {
        let telemetry = {
            httpCode: 200,
            status: "SUCCESS" /* SUCCESS */,
            data: {
                mysql: '',
            },
        };
        try {
            await services_1.MySqlStorage.testQuery();
            telemetry.data.mysql = 'ok';
        }
        catch (e) {
            telemetry.data.mysql = 'error';
            telemetry.status = "FAIL" /* FAIL */;
            telemetry.httpCode = 500;
        }
        res.status(telemetry.httpCode).send({
            status: telemetry.status,
            data: Object.assign({}, telemetry.data)
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.telemetry = telemetry;
const stats = async (req, res) => {
    try {
        const stats = utils_1.statisticUtil.getTimeRequest();
        res.status(200).send({
            status: "SUCCESS" /* SUCCESS */,
            data: Object.assign({}, stats)
        });
    }
    catch (error) {
        res.status(error.statusCode || 500).json(error.responseObject);
        utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
            error,
            additionalData: error.additionalData,
        }));
    }
};
exports.stats = stats;
