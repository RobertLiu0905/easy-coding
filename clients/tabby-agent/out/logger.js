import path from "path";
import os from "os";
import pino from "pino";
import * as FileStreamRotator from "file-stream-rotator";
import { isBrowser, isTest, testLogDebug } from "./env";
class LogFileStream {
    constructor() {
        this.streamOptions = {
            // Rotating file locate at `~/.tabby-client/agent/logs/`.
            filename: path.join(os.homedir(), ".tabby-client", "agent", "logs", "%DATE%"),
            frequency: "daily",
            size: "10M",
            max_logs: "30d",
            extension: ".log",
            create_symlink: true,
        };
    }
    write(data) {
        if (!this.stream) {
            this.stream = FileStreamRotator.getStream(this.streamOptions);
        }
        this.stream.write(data);
    }
}
// LogFileStream not available in browser, will use default browser console output instead.
const logFileStream = isBrowser || isTest ? undefined : new LogFileStream();
const pinoOptions = { serializers: { error: pino.stdSerializers.err } };
const rootBasicLogger = logFileStream ? pino(pinoOptions, logFileStream) : pino(pinoOptions);
if (isTest && testLogDebug) {
    rootBasicLogger.level = "debug";
}
else {
    rootBasicLogger.level = "silent";
}
export const allBasicLoggers = [rootBasicLogger];
rootBasicLogger.onChild = (child) => {
    allBasicLoggers.push(child);
};
function toObjLogFn(logFn) {
    return (...args) => {
        const arg0 = args.shift();
        if (typeof arg0 === "string") {
            logFn(arg0, ...args);
        }
        else {
            const arg1 = args.shift();
            if (typeof arg1 === "string") {
                logFn(arg1, ...args, arg0);
            }
            else {
                logFn(arg0, arg1, ...args);
            }
        }
    };
}
function withComponent(logFn, component) {
    return (msg, ...args) => {
        logFn(`[${component}] ${msg !== null && msg !== void 0 ? msg : ""}`, ...args);
    };
}
export const extraLogger = {
    loggers: [],
    child(component) {
        const buildLogFn = (level) => {
            const logFn = (...args) => {
                const arg0 = args.shift();
                this.loggers.forEach((logger) => logger[level](arg0, ...args));
            };
            return toObjLogFn(withComponent(logFn, component));
        };
        return {
            error: buildLogFn("error"),
            warn: buildLogFn("warn"),
            info: buildLogFn("info"),
            debug: buildLogFn("debug"),
            trace: buildLogFn("trace"),
        };
    },
};
export function logger(component) {
    const basic = rootBasicLogger.child({ component });
    const extra = extraLogger.child(component);
    const all = [basic, extra];
    const buildLogFn = (level) => {
        return (...args) => {
            const arg0 = args.shift();
            all.forEach((logger) => logger[level](arg0, ...args));
        };
    };
    return {
        error: buildLogFn("error"),
        warn: buildLogFn("warn"),
        info: buildLogFn("info"),
        debug: buildLogFn("debug"),
        trace: buildLogFn("trace"),
    };
}
//# sourceMappingURL=logger.js.map