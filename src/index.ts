import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { context as otelContext, propagation } from '@opentelemetry/api';
import { app } from '@azure/functions';
import { Resource } from '@opentelemetry/resources';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.WEBSITE_SITE_NAME,
});
const tracerProvider = new NodeTracerProvider({ resource });
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter()));
tracerProvider.register();

registerInstrumentations({
    tracerProvider,
    instrumentations: [getNodeAutoInstrumentations()],
});

app.hook.preInvocation((context) => {
    context.functionHandler = otelContext.bind(
        propagation.extract(otelContext.active(), {
            traceparent: context.invocationContext.traceContext.traceParent,
            tracestate: context.invocationContext.traceContext.traceState,
        }),
        context.functionHandler
    );
});
