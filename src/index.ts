import { LogLevel, app } from '@azure/functions';
import { context as otelContext, propagation } from '@opentelemetry/api';
import { SeverityNumber } from '@opentelemetry/api-logs';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-http';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { registerInstrumentations } from '@opentelemetry/instrumentation';
import { Resource } from '@opentelemetry/resources';
import { LoggerProvider, SimpleLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeTracerProvider, SimpleSpanProcessor } from '@opentelemetry/sdk-trace-node';
import { SEMRESATTRS_SERVICE_NAME } from '@opentelemetry/semantic-conventions';

const resource = new Resource({
    [SEMRESATTRS_SERVICE_NAME]: process.env.WEBSITE_SITE_NAME,
});

const tracerProvider = new NodeTracerProvider({ resource });
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new OTLPTraceExporter()));
tracerProvider.register();

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new OTLPLogExporter()));
const logger = loggerProvider.getLogger('default');

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

app.setup({
    capabilities: {
        WorkerOpenTelemetryEnabled: true,
    },
});

app.hook.log((context) => {
    logger.emit({
        body: context.message,
        severityNumber: toOtelSeverityNumber(context.level),
        severityText: context.level,
    });
});

function toOtelSeverityNumber(level: LogLevel): SeverityNumber {
    switch (level) {
        case 'information':
            return SeverityNumber.INFO;
        case 'debug':
            return SeverityNumber.DEBUG;
        case 'error':
            return SeverityNumber.ERROR;
        case 'trace':
            return SeverityNumber.TRACE;
        case 'warning':
            return SeverityNumber.WARN;
        case 'critical':
            return SeverityNumber.FATAL;
        default:
            return SeverityNumber.UNSPECIFIED;
    }
}