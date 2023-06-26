import { format } from 'logform';
import otel, { SpanStatusCode } from '@opentelemetry/api';
import { init as initConfig, Config } from './config';
import winston from 'winston';
import fluentTransport from 'fluent-logger';
const { errors } = format;
const errorsFormat = errors({ stack: true });
const transformError = errorsFormat.transform;

const fluent = fluentTransport.support.winstonTransport();
const logger = winston.createLogger({
    transports: [
        fluent,
        new winston.transports.Console({ level: 'debug' })
    ]
});
// @ts-ignore
logger.on('flush', () => {});
// @ts-ignore
logger.on('finish', () => {
    fluent.sender.end('end', {}, () => {});
});

let config:Config;

export const track = (newConfig: Partial<Config> = {}) => {
    config = initConfig(newConfig);
};

export const error = (message: string) => {
    const stack = transformError({message,level:"error"}, { stack: true });
    logger.error({
        message,
        stack,
        'project.name': config.projectName,
        'service.name': config.serviceName,
    });
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
export default class init {}
