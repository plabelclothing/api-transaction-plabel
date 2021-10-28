"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const uuid_1 = require("uuid");
const secureHeaders = (req, res, next) => {
    req.api = {
        requestId: uuid_1.v4()
    };
    res.header('X-Frame-Options', 'SAMEORIGIN; SAMEORIGIN');
    res.header('X-Xss-Protection', '1; mode=block');
    res.header('X-Content-Type-Options', 'nosniff');
    res.header('X-Request-Id', req.api.requestId);
    res.header('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
    // Close connection
    res.set('Connection', 'close');
    next();
};
exports.secureHeaders = secureHeaders;
