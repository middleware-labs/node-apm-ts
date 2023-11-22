import { diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import process from 'process';
import {init as tracerInit} from './tracer-collector';

export interface Config {
    pauseMetrics: Boolean;
    pauseTraces: Boolean;
    DEBUG: Boolean;
    host: string;
    projectName: string;
    serviceName: string;
    port: {
        grpc: number;
        fluent: number;
    };
    target: string;
    collectMetrics: boolean;
    profilingServerUrl: string;
    enableProfiling: boolean;
    accessToken: string;
    tenantID: string;
    mwAuthURL: string;
    consoleLog: boolean;
    consoleError:boolean
}

const configDefault: Config = {
    DEBUG: false,
    host: 'localhost',
    projectName: 'Project-' + process.pid,
    serviceName: 'Service-' + process.pid,
    port: {
        grpc: 9319,
        fluent: 8006,
    },
    target: 'http://localhost:9319',
    collectMetrics: false,
    profilingServerUrl: 'https://profiling.middleware.io',
    enableProfiling: true,
    accessToken: '',
    tenantID: '',
    mwAuthURL: 'https://app.middleware.io/api/v1/auth',
    consoleLog: false,
    consoleError:true,
    pauseTraces:false,
    pauseMetrics:true
};

export const init = (config: Partial<Config> = {}): Config => {
    Object.keys(configDefault).forEach((key) => {
        // @ts-ignore
        configDefault[key] = config[key] ?? configDefault[key];
    });

    const isHostExist =
        process.env.MW_AGENT_SERVICE && process.env.MW_AGENT_SERVICE !== '' ? true : false;

    if (isHostExist) {
        // @ts-ignore
        configDefault.host = process.env.MW_AGENT_SERVICE;
        configDefault.target = process.env.MW_AGENT_SERVICE + ':' + configDefault.port.grpc;
    }

    diag.setLogger(new DiagConsoleLogger(), configDefault.DEBUG ? DiagLogLevel.DEBUG : DiagLogLevel.NONE);

    tracerInit(configDefault);

    return <Config>configDefault;
};
