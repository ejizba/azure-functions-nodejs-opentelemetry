const { app } = require('@azure/functions');
const { AzureMonitorLogExporter, AzureMonitorTraceExporter } = require('@azure/monitor-opentelemetry-exporter');
const { context: otelContext, propagation } = require('@opentelemetry/api');
const { SeverityNumber } = require('@opentelemetry/api-logs');
const { getNodeAutoInstrumentations, getResourceDetectors } = require('@opentelemetry/auto-instrumentations-node');
const { registerInstrumentations } = require('@opentelemetry/instrumentation');
const { detectResourcesSync } = require('@opentelemetry/resources');
const { LoggerProvider, SimpleLogRecordProcessor } = require('@opentelemetry/sdk-logs');
const { NodeTracerProvider, SimpleSpanProcessor } = require('@opentelemetry/sdk-trace-node');

const resource = detectResourcesSync({ detectors: getResourceDetectors() });

const tracerProvider = new NodeTracerProvider({ resource });
tracerProvider.addSpanProcessor(new SimpleSpanProcessor(new AzureMonitorTraceExporter()));
tracerProvider.register();

const loggerProvider = new LoggerProvider({ resource });
loggerProvider.addLogRecordProcessor(new SimpleLogRecordProcessor(new AzureMonitorLogExporter()));
const logger = loggerProvider.getLogger('default');

registerInstrumentations({ tracerProvider, loggerProvider, instrumentations: [getNodeAutoInstrumentations()] });

// NOTE: The below code in this file is temporary and will eventually be
// a part of a new package `@opentelemetry/instrumentation-azure-functions`
// which will be automatically registered with `getNodeAutoInstrumentations`
app.setup({ capabilities: { WorkerOpenTelemetryEnabled: true } });

app.hook.log((context) => {
    logger.emit({
        body: context.message,
        severityNumber: toOtelSeverityNumber(context.level),
        severityText: context.level,
    });
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

function toOtelSeverityNumber(level) {
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
