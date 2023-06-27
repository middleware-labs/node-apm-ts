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
Object.defineProperty(exports, "__esModule", { value: true });
exports.debug = exports.warn = exports.info = exports.error = exports.setAttribute = exports.errorRecord = exports.track = void 0;
const logform_1 = require("logform");
const api_1 = __importStar(require("@opentelemetry/api"));
const config_1 = require("./config");
const { errors } = logform_1.format;
const errorsFormat = errors({ stack: true });
const transformError = errorsFormat.transform;
let config;
const winston = require('winston');
let c = {
    host: 'localhost',
    port: '8006',
    timeout: 3.0,
    requireAckResponse: true
};
const fluentTransport = require('fluent-logger').support.winstonTransport();
let fluent = new fluentTransport('default-project', c);
let logger = winston.createLogger({
    transports: [fluent, new (winston.transports.Console)({ level: 'debug' })]
});
logger.on('flush', () => { });
logger.on('finish', () => {
    fluent.sender.end("end", {}, () => { });
});
const track = (newConfig = {}) => {
    config = (0, config_1.init)(newConfig);
    let c = {
        host: config.host,
        port: config.port.fluent,
        timeout: 3.0,
        requireAckResponse: true
    };
    fluent = new fluentTransport(config.projectName, c);
    logger = winston.createLogger({
        transports: [fluent, new (winston.transports.Console)({ level: 'debug' })]
    });
};
exports.track = track;
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
const error = (error) => {
    const stack = transformError({ message: error, level: "error" }, { stack: true });
    let message = typeof stack == "string" ? stack : error.message;
    logger.error({ message, stack, "project.name": config.projectName, "service.name": config.serviceName });
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
class init {
}
exports.default = init;
