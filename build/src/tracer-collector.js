"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const instrumentation_grpc_1 = require("@opentelemetry/instrumentation-grpc");
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const resources_1 = require("@opentelemetry/resources");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const process = require('process');
const init = (config) => {
    const apm_pause_traces = config.pauseTraces && config.pauseTraces === 1 ? true : false;
    if (!apm_pause_traces) {
        // @ts-ignore
        const sdk = new sdk_node_1.NodeSDK({
            traceExporter: new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
                url: config.hostUrl,
            }),
            instrumentations: [
                // @ts-ignore
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)(),
                new instrumentation_grpc_1.GrpcInstrumentation({
                    ignoreGrpcMethods: ['Export'],
                }),
            ],
        });
        sdk.addResource(new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
            ['mw_agent']: true,
            ['project.name']: config.projectName,
        }));
        sdk.start()
            .then(() => { })
            .catch((error) => console.log('Error initializing tracing', error));
        process.on('SIGTERM', () => {
            sdk.shutdown()
                .then(() => { })
                .catch((error) => console.log('Error terminating tracing', error))
                .finally(() => process.exit(0));
        });
    }
};
exports.init = init;
