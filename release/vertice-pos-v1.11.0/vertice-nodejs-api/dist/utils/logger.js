"use strict";
var __rest = (this && this.__rest) || function (s, e) {
    var t = {};
    for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p) && e.indexOf(p) < 0)
        t[p] = s[p];
    if (s != null && typeof Object.getOwnPropertySymbols === "function")
        for (var i = 0, p = Object.getOwnPropertySymbols(s); i < p.length; i++) {
            if (e.indexOf(p[i]) < 0 && Object.prototype.propertyIsEnumerable.call(s, p[i]))
                t[p[i]] = s[p[i]];
        }
    return t;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logDebug = exports.logWarn = exports.logError = exports.logInfo = exports.logger = void 0;
const winston_1 = __importDefault(require("winston"));
const path_1 = __importDefault(require("path"));
const fs_1 = __importDefault(require("fs"));
// Ensure logs directory exists
const logsDir = path_1.default.join(__dirname, '../../logs');
if (!fs_1.default.existsSync(logsDir)) {
    fs_1.default.mkdirSync(logsDir, { recursive: true });
}
// Custom format for console output
const consoleFormat = winston_1.default.format.combine(winston_1.default.format.colorize(), winston_1.default.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), winston_1.default.format.printf((_a) => {
    var { timestamp, level, message } = _a, meta = __rest(_a, ["timestamp", "level", "message"]);
    const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
    return `${timestamp} [${level}]: ${message} ${metaStr}`;
}));
// Custom format for file output (JSON)
const fileFormat = winston_1.default.format.combine(winston_1.default.format.timestamp(), winston_1.default.format.json());
// Create the logger
exports.logger = winston_1.default.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    defaultMeta: { service: 'vertice-pos-api' },
    transports: [
        // Console transport (always active)
        new winston_1.default.transports.Console({
            format: consoleFormat,
        }),
        // Error log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'error.log'),
            level: 'error',
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
        // Combined log file
        new winston_1.default.transports.File({
            filename: path_1.default.join(logsDir, 'combined.log'),
            format: fileFormat,
            maxsize: 5242880, // 5MB
            maxFiles: 5,
        }),
    ],
});
// Export helper functions for convenience
const logInfo = (message, meta) => exports.logger.info(message, meta);
exports.logInfo = logInfo;
const logError = (message, meta) => exports.logger.error(message, meta);
exports.logError = logError;
const logWarn = (message, meta) => exports.logger.warn(message, meta);
exports.logWarn = logWarn;
const logDebug = (message, meta) => exports.logger.debug(message, meta);
exports.logDebug = logDebug;
exports.default = exports.logger;
