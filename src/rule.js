const fs = require('fs');
const { loadPyodide } = require("pyodide");


class RuleOptions {
    #req = null;
    #res = null;
    constructor(req, res) {
        this.#req = req;
        this.#res = res;
    }
    pathname() {
        return this.#req.originalUrl;
    }
    resource() {
        return this.pathname().split('/').filter(part => part.length > 0)[0];
    }
    id() {
        return this.pathname().split('/').filter(part => part.length > 0)[1];
    }
    method() {
        return this.#req.method;
    }
    payload(name) {
        return this.#req.body[name];
    }
    header(name) {
        return this.#req.get(name);
    }
    response() {
        return this.#res.response;
    }
}

class Rule {
    #current    = null;
    #rulesPath  = null;
    #script     = null;
    #pyodide    = null;
    #invalid = false;
    static async createFromFile(rulesPath) {
        let pyodide = await loadPyodide();
        let rule = new Rule(pyodide);
        try {
            rule.#rulesPath = rulesPath;
            rule.#script = fs.readFileSync(rulesPath, 'utf8');
            rule.#pyodide.runPython(rule.#script);
        } catch (error) {
            rule.#invalid = true;
        }
        return rule;
    }
    static async createFromScript(script) {
        let pyodide = await loadPyodide();
        let rule = new Rule(pyodide);
        try {
            rule.#script = script;
            rule.#pyodide.runPython(rule.#script);
        } catch (error) {
            rule.#invalid = true;
        }
        return rule;
    }
    constructor(pyodide) {
        const self = this;
        this.#pyodide = pyodide;
        this.#invalid = false;
        this.#current = null;
        {
            function id() {
                return self.#current.id();
            }
            function resource() {
                return self.#current.resource();
            }
            function pathname() {
                return self.#current.pathname();
            }
            function method() {
                return self.#current.method();
            }
            function header(name) {
                return self.#current.header(name);
            }
            function payload(name) {
                return self.#current.payload(name);
            }
            this.#pyodide.registerJsModule("request", { header: header, method: method, pathname: pathname, id: id, resource: resource, payload: payload });
        }
        {
            function status(status) {
                const statusCode = parseInt(status, 10);
                if (Number.isInteger(statusCode)) {
                    self.#current.response().status(statusCode);
                    self.#current.response().lockStatus();
                }
            }
            function send(payload) {
                try {
                    self.#current.response().send(payload);
                    self.#current.response().lockResponse();
                } catch (error) {
                }
            }
            function exit() {
                return self.#current.response().exit();
            }
            function header(name, value) {
                return self.#current.response().addHeader(name, value);
            }
            this.#pyodide.registerJsModule("response", { status: status, send: send, exit: exit, header: header });
        }
        this.#rulesPath = null;
        this.#script = null;
    }
    isInvalid() {
        return this.#invalid; 
    }
    apply(ruleOption) {
        try {
            this.#current = ruleOption;
            let handle_request = this.#pyodide.globals.get("handle_request");
            handle_request();
        } catch (error) {
            this.#current.response().status(500);
            this.#current.response().send(error.message);
            this.#current.response().exit();
        }
        return this.#current.response();
    }
};

module.exports = { Rule, RuleOptions };