# Azure Functions Node.js Open Telemetry Sample

This repo has a sample app that demonstrates using Open Telemetry with Azure Functions on Node.js. It has an HTTP trigger that also has an outbound request to httpbin.org to demonstrate a span within your function invocation. The code to setup open telemetry is in the `src/index.ts` or `src/index.js` file. There are several branches depending on your preferred configuration:

- main: TypeScript example sending data to an OTLP endpoint.
- main-js: JavaScript example sending data to an OTLP endpoint.
- appinsights: TypeScript example sending data to an Azure App Insights endpoint.
- appinsights-js: JavaScript example sending data to an Azure App Insights endpoint.

NOTE: You must be using Azure Functions Host v4.34+.

## Run the app

1. Create a free [New Relic](https://newrelic.com/) account (or any other product that supports Open Telemetry) to export your data to.
2. Add a `local.settings.json` file. Assuming you're using New Relic, it will look like this:

    ```json
    {
        "IsEncrypted": false,
        "Values": {
            "AzureWebJobsStorage": "",
            "FUNCTIONS_WORKER_RUNTIME": "node",
            "OTEL_EXPORTER_OTLP_ENDPOINT": "https://otlp.nr-data.net",
            "OTEL_EXPORTER_OTLP_HEADERS": "<api key information>"
        }
    }
    ```

3. Run `npm install`.
4. Run `npm start`
5. Execute your http trigger
6. Go to the New Relic dashboard to see all your data!
