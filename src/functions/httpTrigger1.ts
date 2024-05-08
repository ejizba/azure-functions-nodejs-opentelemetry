import { app, HttpRequest, HttpResponseInit, InvocationContext } from '@azure/functions';
import { fetch } from 'undici';

export async function httpTrigger1(request: HttpRequest, context: InvocationContext): Promise<HttpResponseInit> {
    context.log(`Http function processed request for url "${request.url}"`);

    const url = 'https://httpbin.org/get';
    const response = await fetch(url, { method: 'GET' });
    context.log(`Result ${response.status} from request to url "${url}"`);

    const name = request.query.get('name') || (await request.text()) || 'world';
    return { body: `Hello, ${name}!` };
}

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: httpTrigger1,
});
