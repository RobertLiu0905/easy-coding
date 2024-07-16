var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import readline from "readline";
import { agentEventNames } from "./Agent";
import { logger } from "./logger";
import { isCanceledError } from "./utils";
/**
 * Every request and response should be single line JSON string and end with a newline.
 */
export class JsonLineServer {
    constructor() {
        this.process = process;
        this.inStream = process.stdin;
        this.outStream = process.stdout;
        this.logger = logger("JsonLineServer");
        this.abortControllers = {};
    }
    handleLine(line) {
        return __awaiter(this, void 0, void 0, function* () {
            let request;
            try {
                request = JSON.parse(line);
            }
            catch (error) {
                this.logger.error({ error }, `Failed to parse request: ${line}`);
                return;
            }
            this.logger.debug({ request }, "Received request");
            const response = yield this.handleRequest(request);
            this.sendResponse(response);
            this.logger.debug({ response }, "Sent response");
        });
    }
    handleRequest(request) {
        return __awaiter(this, void 0, void 0, function* () {
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
                    response[1] = yield func.apply(this.agent, args);
                }
            }
            catch (error) {
                if (isCanceledError(error)) {
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
        });
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
        for (const eventName of agentEventNames) {
            this.agent.on(eventName, (event) => {
                this.sendResponse([0, event]);
            });
        }
    }
    listen() {
        readline.createInterface({ input: this.inStream }).on("line", (line) => {
            this.handleLine(line);
        });
        ["SIGTERM", "SIGINT"].forEach((sig) => {
            this.process.on(sig, () => __awaiter(this, void 0, void 0, function* () {
                if (this.agent && this.agent.getStatus() !== "finalized") {
                    yield this.agent.finalize();
                }
                this.process.exit(0);
            }));
        });
    }
}
//# sourceMappingURL=JsonLineServer.js.map