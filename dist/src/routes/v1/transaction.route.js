"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const express_1 = require("express");
/* Locale modules */
const transation_1 = require("../../controllers/transation");
const router = express_1.Router();
// Transaction init
router.post('/sale', transation_1.init);
exports.default = router;
