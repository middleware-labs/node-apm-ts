const opentelemetry = require('@opentelemetry/sdk-node');
const {getNodeAutoInstrumentations} = require('@opentelemetry/auto-instrumentations-node');
const {OTLPTraceExporter} = require('@opentelemetry/exporter-trace-otlp-grpc');
const { GrpcInstrumentation } = require('@opentelemetry/instrumentation-grpc');
const {Resource} = require("@opentelemetry/resources");
const {SemanticResourceAttributes} = require("@opentelemetry/semantic-conventions");
const api = require('@opentelemetry/api');
const { CompositePropagator } = require('@opentelemetry/core');
const { B3Propagator, B3InjectEncoding } = require('@opentelemetry/propagator-b3');
import {Config} from './config';

// Set the global propagator
api.propagation.setGlobalPropagator(
    new CompositePropagator({
        propagators: [
            new B3Propagator(),
            new B3Propagator({ injectEncoding: B3InjectEncoding.MULTI_HEADER }),
        ],
    })
);
export const init = (config: Config) => {
    const apm_pause_traces = config.pauseTraces === true;

    if (!apm_pause_traces) {
        const sdk = new opentelemetry.NodeSDK({
            traceExporter: new OTLPTraceExporter({
                url: config.target,

            }),
            instrumentations: [
                getNodeAutoInstrumentations({}),
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
                ['mw.account_key']: config.accessToken,
            })
        );

        sdk.start();
    }
};
