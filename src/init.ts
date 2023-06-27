import { format } from 'logform';
import otel, { SpanStatusCode } from '@opentelemetry/api';
import { init as initConfig, Config } from './config';
const { errors } = format;
const errorsFormat = errors({stack: true});
const transformError = errorsFormat.transform;

let config:Config;

const winston = require('winston');

let c = {
    host:'localhost',
    port:'8006',
    timeout: 3.0,
    requireAckResponse: true
};
const fluentTransport = require('fluent-logger').support.winstonTransport();

let fluent = new fluentTransport('default-project', c);

let logger = winston.createLogger({
    transports: [fluent, new (winston.transports.Console)({ level: 'debug' })]
});

logger.on('flush', () => {})


logger.on('finish', () => {
    fluent.sender.end("end", {}, () => {})
});

export const track = (newConfig: Partial<Config> = {}) => {
    config = initConfig(newConfig);
    let c = {
        host:config.host,
        port:config.port.fluent,
        timeout: 3.0,
        requireAckResponse: true
    };

    fluent = new fluentTransport(config.projectName, c);
    logger = winston.createLogger({
        transports: [fluent, new (winston.transports.Console)({ level: 'debug' })]
    });

};


export const errorRecord = (e: Error) => {
    const span = otel.trace.getSpan(otel.context.active());
    if (span) {
        span.recordException(e);
        span.setStatus({ code: SpanStatusCode.ERROR, message: String(e) });
    }
};

export const setAttribute = (name: string, value: string) => {
    const span = otel.trace.getSpan(otel.context.active());
    if (span) {
        span.setAttribute(name, value);
    }
};

export const error = (error: Error) => {
    const stack = transformError({message:error,level:"error"}, { stack: true });
    let message = typeof stack =="string" ? stack : error.message
    logger.error({message , stack, "project.name":config.projectName, "service.name":config.serviceName});
};

export const info = (message: string) => {
    logger.info({
        message,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};

export const warn = (message: string) => {
    logger.warn({
        message,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};

export const debug = (message: string) => {
    logger.debug({
        message,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
};

export default class init {}
