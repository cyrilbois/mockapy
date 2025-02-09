const { Rule, RuleOptions } = require('./rule');
const Response = require('./response.js');

describe('Rule', () => {
    let ruleOption;

    beforeEach(() => {
        ruleOption = new RuleOptions({ 
                originalUrl: '/resource/123', 
                method: 'GET', 
                get: function (name) { if (name == 'x-unit-test') return 'test'; return null; }, 
                body: {title: "test title"} 
            }, { 
                response: new Response(),
                set: function (name, value) { if (name == 'x-unit-test') return 'test'; return null; }
            }
        );
    });

    test('sets response status code', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.status(402);');
        const response = rule.apply(ruleOption);
        expect(response.getStatus()).toBe(402);
    });

    test('sets response body with send', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.send("ok");');
        const response = rule.apply(ruleOption);
        expect(response.getResponse()).toBe("ok");
    });

    test('sets response header', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.header("x-unit-test-response", "ok");');
        const response = rule.apply(ruleOption);
        expect(response.getHeader("x-unit-test-response")).toBe("ok");
    });

    test('sets response to exit', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.exit();');
        const response = rule.apply(ruleOption);
        expect(response.shouldExit()).toBe(true);
    });

    test('returns resource name from request', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.send(request.resource());');
        const response = rule.apply(ruleOption);
        expect(response.getResponse()).toBe("resource");
    });

    test('returns request ID', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.status(request.id());');
        const response = rule.apply(ruleOption);
        expect(response.getStatus()).toBe(123);
    });

    test('returns request URL', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.send(request.pathname());');
        const response = rule.apply(ruleOption);
        expect(response.getResponse()).toBe('/resource/123');
    });

    test('returns request method', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.send(request.method());');
        const response = rule.apply(ruleOption);
        expect(response.getResponse()).toBe('GET');
    });

    test('returns request header value', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.send(request.header("x-unit-test"));');
        const response = rule.apply(ruleOption);
        expect(response.getResponse()).toBe('test');
    });

    test('returns request payload value', async () => {
        const rule = await Rule.createFromScript('import request\n\
import response\n\
\n\
def handle_request(): \n\
    response.send(request.payload("title"));');
        const response = rule.apply(ruleOption);
        expect(response.getResponse()).toBe('test title');
    });
});
