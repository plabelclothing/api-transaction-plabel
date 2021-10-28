"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
/// <reference path="../types/application-config.d.ts" />
/* eslint-disable import/no-dynamic-require */
/* eslint-disable security/detect-non-literal-require */
const lodash_1 = __importDefault(require("lodash"));
const fs_1 = require("fs");
const path_1 = require("path");
const { NODE_ENV } = process.env;
const configDir = path_1.resolve('config');
const serverFileConfig = `${configDir}/server.${NODE_ENV}.js`;
if (!fs_1.existsSync(serverFileConfig)) {
    throw new Error('File config is not defined!');
}
const createSettings = lodash_1.default.merge(require('../../config/main'), require(`../../config/server.${NODE_ENV}`));
exports.default = createSettings;
