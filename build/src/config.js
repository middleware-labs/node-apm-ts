"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = exports.configDefault = void 0;
const api_1 = require("@opentelemetry/api");
const tracer_collector_1 = require("./tracer-collector");
// @ts-ignore
const process_1 = require("process");
exports.configDefault = {
    DEBUG: api_1.DiagLogLevel.NONE,
    host: 'localhost',
    projectName: `Project-${process_1.process.pid}`,
    serviceName: `Service-${process_1.process.pid}`,
    port: {
        grpc: 9319,
        fluent: 8006,
    },
    hostUrl: 'http://localhost:9319',
    collectMetrics: false,
};
const init = (config = {}) => {
    Object.keys(exports.configDefault).forEach((key) => {
        // @ts-ignore
        exports.configDefault[key] = config[key] ? config[key] : exports.configDefault[key];
    });
    const isHostExist = process_1.process.env.MW_AGENT_SERVICE && process_1.process.env.MW_AGENT_SERVICE !== '';
    if (isHostExist) {
        exports.configDefault.host = process_1.process.env.MW_AGENT_SERVICE;
        exports.configDefault.hostUrl = `${process_1.process.env.MW_AGENT_SERVICE}:${exports.configDefault.port.grpc}`;
    }
    api_1.diag.setLogger(new api_1.DiagConsoleLogger(), exports.configDefault.DEBUG ? api_1.DiagLogLevel.DEBUG : api_1.DiagLogLevel.NONE);
    (0, tracer_collector_1.init)(exports.configDefault);
    return exports.configDefault;
};
exports.init = init;
