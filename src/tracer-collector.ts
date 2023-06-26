import { GrpcInstrumentation } from '@opentelemetry/instrumentation-grpc';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-grpc';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';

const process = require('process');

export interface Config {
    pauseTraces?: number;
    hostUrl: string;
    serviceName: string;
    projectName: string;
}

export const init = (config: Config) => {
    const apm_pause_traces = config.pauseTraces && config.pauseTraces === 1 ? true : false;

    if (!apm_pause_traces) {
        // @ts-ignore
        const sdk = new NodeSDK({
            traceExporter: new OTLPTraceExporter({
                url: config.hostUrl,
            }),
            instrumentations: [
                // @ts-ignore
                getNodeAutoInstrumentations(),
                new GrpcInstrumentation({
                    ignoreGrpcMethods: ['Export'],
                }),
            ],
        });

        sdk.addResource(
            new Resource({
                [SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
                ['mw_agent']: true,
                ['project.name']: config.projectName,
            })
        );

        sdk.start()
            .then(() => {})
            .catch((error: Error) => console.log('Error initializing tracing', error));

        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => {})
                .catch((error: Error) => console.log('Error terminating tracing', error))
                .finally(() => process.exit(0));
        });
    }
};
