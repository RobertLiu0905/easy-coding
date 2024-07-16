"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JsonLineServer = void 0;
const readline_1 = __importDefault(require("readline"));
const Agent_1 = require("./Agent");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
/**
 * Every request and response should be single line JSON string and end with a newline.
 */
class JsonLineServer {
    constructor() {
        this.process = process;
        this.inStream = process.stdin;
        this.outStream = process.stdout;
        this.logger = (0, logger_1.logger)("JsonLineServer");
        this.abortControllers = {};
    }
    async handleLine(line) {
        let request;
        try {
            request = JSON.parse(line);
        }
        catch (error) {
            this.logger.error({ error }, `Failed to parse request: ${line}`);
            return;
        }
        this.logger.debug({ request }, "Received request");
        const response = await this.handleRequest(request);
        this.sendResponse(response);
        this.logger.debug({ response }, "Sent response");
    }
    async handleRequest(request) {
        let requestId = 0;
        const response = [0, null];
        const abortController = new AbortController();
        try {
            if (!this.agent) {
                throw new Error(`Agent not bound.\n`);
            }
            requestId = request[0];
            response[0] = requestId;
            const funcName = request[1].func;
            if (funcName === "cancelRequest") {
                response[1] = this.cancelRequest(request);
            }
            else {
                const func = this.agent[funcName];
                if (!func) {
                    throw new Error(`Unknown function: ${funcName}`);
                }
                const args = request[1].args;
                // If the last argument is an object and has `signal` property, replace it with the abort signal.
                if (args.length > 0 && typeof args[args.length - 1] === "object" && args[args.length - 1]["signal"]) {
                    this.abortControllers[requestId] = abortController;
                    args[args.length - 1]["signal"] = abortController.signal;
                }
                // @ts-expect-error TS2684: FIXME
                response[1] = await func.apply(this.agent, args);
            }
        }
        catch (error) {
            if ((0, utils_1.isCanceledError)(error)) {
                this.logger.debug({ error, request }, `Request canceled`);
            }
            else {
                this.logger.error({ error, request }, `Failed to handle request`);
            }
        }
        finally {
            if (this.abortControllers[requestId]) {
                delete this.abortControllers[requestId];
            }
        }
        return response;
    }
    cancelRequest(request) {
        const targetId = request[1].args[0];
        const controller = this.abortControllers[targetId];
        if (controller) {
            controller.abort();
            return true;
        }
        return false;
    }
    sendResponse(response) {
        this.outStream.write(JSON.stringify(response) + "\n");
    }
    bind(agent) {
        this.agent = agent;
        for (const eventName of Agent_1.agentEventNames) {
            this.agent.on(eventName, (event) => {
                this.sendResponse([0, event]);
            });
        }
    }
    listen() {
        readline_1.default.createInterface({ input: this.inStream }).on("line", (line) => {
            this.handleLine(line);
        });
        ["SIGTERM", "SIGINT"].forEach((sig) => {
            this.process.on(sig, async () => {
                if (this.agent && this.agent.getStatus() !== "finalized") {
                    await this.agent.finalize();
                }
                this.process.exit(0);
            });
        });
    }
}
exports.JsonLineServer = JsonLineServer;
//# sourceMappingURL=JsonLineServer.js.map