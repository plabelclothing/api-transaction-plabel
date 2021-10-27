"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const express_1 = require("express");
/* Locale modules */
const notification_1 = require("../../controllers/notification");
const router = express_1.Router();
// Transaction init
router.post('/paypal', notification_1.payPalNotify);
exports.default = router;
