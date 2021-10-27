"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/* External modules */
const express_1 = require("express");
/* Locale modules */
const v1_1 = __importDefault(require("./v1"));
const router = express_1.Router();
router.use('/v1', v1_1.default);
exports.default = router;
