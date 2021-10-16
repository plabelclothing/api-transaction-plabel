"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (Object.hasOwnProperty.call(mod, k)) result[k] = mod[k];
    result["default"] = mod;
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const body_parser_1 = require("body-parser");
const morgan_1 = __importDefault(require("morgan"));
const middleware_1 = require("../middleware");
const config_1 = __importDefault(require("./config"));
const utils_1 = require("../utils");
const routes_1 = __importDefault(require("../routes"));
// Created server
const app = express_1.default();
// Disable headers
app.disable('x-powered-by');
app.disable('etag');
// Trust proxy headers
app.enable('trust proxy');
app.use(morgan_1.default('[:res[X-Request-Id]] :remote-addr - :remote-user ":method :url HTTP/:http-version" :status :res[content-length] ":referrer" ":user-agent"', {
    stream: utils_1.logger.expressStream,
    skip: (req) => req.originalUrl === '/v1/check/ping'
}));
app.use(middleware_1.secureHeaders);
app.use(body_parser_1.urlencoded({ extended: true }));
app.use(body_parser_1.json({ limit: '20mb' }));
app.use(middleware_1.checkAuth);
// Default routes
app.use(routes_1.default);
// Handle not available requests
app.all('*', (req, res) => {
    let err = new Error();
    err.message = 'Not found';
    res.status(404).send({
        status: "FAIL" /* FAIL */,
        message: 'Not found',
        data: {
            errorCode: "GEN_003_ERROR" /* GEN_003_ERR */,
            errorId: 10000003 /* GEN_003_ERR */
        }
    });
});
try {
    app.listen(config_1.default.expressApi.port, config_1.default.expressApi.bind);
    utils_1.logger.log("info" /* INFO */, utils_1.loggerMessage({
        message: `API endpoint started at ${config_1.default.expressApi.bind}:${config_1.default.expressApi.port}`
    }));
    Promise.resolve().then(() => __importStar(require('../bin/services')));
}
catch (e) {
    utils_1.logger.log("error" /* ERROR */, utils_1.loggerMessage({
        message: 'Error starting API!',
        error: e
    }));
}
