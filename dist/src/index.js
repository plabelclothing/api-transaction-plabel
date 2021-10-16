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
const os_1 = __importDefault(require("os"));
const utils_1 = require("./utils");
// Log process PID
utils_1.logger.log("info" /* INFO */, utils_1.loggerMessage({
    message: 'Application run details.',
    additionalData: {
        applicationDetails: {
            pid: process.pid,
            runPath: process.execPath,
            argv: process.argv,
            mainModule: __filename,
            title: process.title,
            version: process.version,
            versions: process.versions,
            os: {
                hostname: os_1.default.hostname(),
                type: os_1.default.type(),
                platform: os_1.default.platform(),
                arch: os_1.default.arch(),
                release: os_1.default.release(),
                totalMemory: os_1.default.totalmem(),
                freeMemory: os_1.default.freemem()
            }
        }
    }
}));
Promise.resolve().then(() => __importStar(require('./bin/server')));
