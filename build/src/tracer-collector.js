"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.init = void 0;
const exporter_trace_otlp_grpc_1 = require("@opentelemetry/exporter-trace-otlp-grpc");
const sdk_node_1 = require("@opentelemetry/sdk-node");
const auto_instrumentations_node_1 = require("@opentelemetry/auto-instrumentations-node");
const semantic_conventions_1 = require("@opentelemetry/semantic-conventions");
const resources_1 = require("@opentelemetry/resources");
const instrumentation_grpc_1 = require("@opentelemetry/instrumentation-grpc");
const init = (config) => {
    const apm_pause_traces = config.pauseTraces && config.pauseTraces === 1 ? true : false;
    if (!apm_pause_traces) {
        const sdk = new sdk_node_1.NodeSDK({
            traceExporter: new exporter_trace_otlp_grpc_1.OTLPTraceExporter({
                url: config.hostUrl,
            }),
            instrumentations: [
                (0, auto_instrumentations_node_1.getNodeAutoInstrumentations)(),
                new instrumentation_grpc_1.GrpcInstrumentation({
                    ignoreGrpcMethods: ['Export'],
                }),
            ]
        });
        sdk.addResource(new resources_1.Resource({
            [semantic_conventions_1.SemanticResourceAttributes.SERVICE_NAME]: config.serviceName,
            ['mw_agent']: true,
            ['project.name']: config.projectName,
        }));
        sdk
            .start();
    }
};
exports.init = init;
