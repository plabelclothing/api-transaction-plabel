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
Object.defineProperty(exports, "__esModule", { value: true });
/* Locale modules */
const utils_1 = require("../utils");
const services_1 = require("../services");
const ping = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    res.status(200).send('pong');
});
exports.ping = ping;
const telemetry = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let telemetry = {
            httpCode: 200,
            status: "SUCCESS" /* SUCCESS */,
            data: {
                mysql: '',
            },
        };
        try {
            yield services_1.MySqlStorage.testQuery();
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
});
exports.telemetry = telemetry;
const stats = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
});
exports.stats = stats;
