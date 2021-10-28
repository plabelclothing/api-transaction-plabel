"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const express_1 = require("express");
/* Locale modules */
const check_1 = require("../../controllers/check");
const router = express_1.Router();
router.get('/ping', check_1.ping);
router.get('/stats', check_1.stats);
router.get('/telemetry', check_1.telemetry);
exports.default = router;
