import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { init as initTracer } from './tracer-collector';

// @ts-ignore
import { process } from 'process';

export interface Config {
    DEBUG: DiagLogLevel;
    host: string;
    projectName: string;
    serviceName: string;
    port: {
        grpc: number;
        fluent: number;
    };
    hostUrl: string;
    collectMetrics: boolean;
}

export const configDefault: Config = {
    DEBUG: DiagLogLevel.NONE,
    host: 'localhost',
    projectName: `Project-${process.pid}`,
    serviceName: `Service-${process.pid}`,
    port: {
        grpc: 9319,
        fluent: 8006,
    },
    hostUrl: 'http://localhost:9319',
    collectMetrics: false,
};

export const init = (config: Partial<Config> = {}): Config => {
    Object.keys(configDefault).forEach((key) => {
        // @ts-ignore
        configDefault[key] = config[key] ? config[key] : configDefault[key];
    });

    const isHostExist = process.env.MW_AGENT_SERVICE && process.env.MW_AGENT_SERVICE !== '';
    if (isHostExist) {
        configDefault.host = process.env.MW_AGENT_SERVICE;
        configDefault.hostUrl = `${process.env.MW_AGENT_SERVICE}:${configDefault.port.grpc}`;
    }

    diag.setLogger(new DiagConsoleLogger(), configDefault.DEBUG ? DiagLogLevel.DEBUG : DiagLogLevel.NONE);

    initTracer(configDefault);

    return configDefault;
};
