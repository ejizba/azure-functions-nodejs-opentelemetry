const { app } = require('@azure/functions');
const { fetch } = require('undici');

app.http('httpTrigger1', {
    methods: ['GET', 'POST'],
    authLevel: 'anonymous',
    handler: async (request, context) => {
        context.log(`Http function processed request for url "${request.url}"`);

        const url = 'https://httpbin.org/get';
        const response = await fetch(url, { method: 'GET' });
        context.log(`Result ${response.status} from request to url "${url}"`);

        const name = request.query.get('name') || (await request.text()) || 'world';
        return { body: `Hello, ${name}!` };
    },
});
