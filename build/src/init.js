"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setAttribute = exports.errorRecord = exports.debug = exports.warn = exports.info = exports.error = exports.track = void 0;
const logform_1 = require("logform");
const api_1 = __importStar(require("@opentelemetry/api"));
const config_1 = require("./config");
const winston_1 = __importDefault(require("winston"));
const fluent_logger_1 = __importDefault(require("fluent-logger"));
const { errors } = logform_1.format;
const errorsFormat = errors({ stack: true });
const transformError = errorsFormat.transform;
const fluent = fluent_logger_1.default.support.winstonTransport();
const logger = winston_1.default.createLogger({
    transports: [
        fluent,
        new winston_1.default.transports.Console({ level: 'debug' })
    ]
});
// @ts-ignore
logger.on('flush', () => { });
// @ts-ignore
logger.on('finish', () => {
    fluent.sender.end('end', {}, () => { });
});
let config;
const track = (newConfig = {}) => {
    config = (0, config_1.init)(newConfig);
};
exports.track = track;
const error = (message) => {
    const stack = transformError({ message, level: "error" }, { stack: true });
    logger.error({
        message,
        stack,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};
exports.error = error;
const info = (message) => {
    logger.info({
        message,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};
exports.info = info;
const warn = (message) => {
    logger.warn({
        message,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};
exports.warn = warn;
const debug = (message) => {
    logger.debug({
        message,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};
exports.debug = debug;
const errorRecord = (e) => {
    const span = api_1.default.trace.getSpan(api_1.default.context.active());
    if (span) {
        span.recordException(e);
        span.setStatus({ code: api_1.SpanStatusCode.ERROR, message: String(e) });
    }
};
exports.errorRecord = errorRecord;
const setAttribute = (name, value) => {
    const span = api_1.default.trace.getSpan(api_1.default.context.active());
    if (span) {
        span.setAttribute(name, value);
    }
};
exports.setAttribute = setAttribute;
class init {
}
exports.default = init;
