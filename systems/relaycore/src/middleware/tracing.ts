/**
 * OpenTelemetry tracing configuration for RelayCore
 */

import { NodeSDK } from "@opentelemetry/sdk-node";
import { getNodeAutoInstrumentations } from "@opentelemetry/auto-instrumentations-node";
import { JaegerExporter } from "@opentelemetry/exporter-jaeger";
import { Resource } from "@opentelemetry/resources";
import { SemanticResourceAttributes } from "@opentelemetry/semantic-conventions";

const jaegerExporter = new JaegerExporter({
  endpoint: process.env.JAEGER_ENDPOINT || "http://jaeger:14268/api/traces",
});

const sdk = new NodeSDK({
  resource: new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: "relaycore",
    [SemanticResourceAttributes.SERVICE_VERSION]: "1.0.0",
  }),
  traceExporter: jaegerExporter,
  instrumentations: [getNodeAutoInstrumentations()],
});

export const initializeTracing = () => {
  sdk.start();

};

export default sdk;

