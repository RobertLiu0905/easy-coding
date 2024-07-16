"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.logger = exports.extraLogger = exports.allBasicLoggers = void 0;
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const pino_1 = __importDefault(require("pino"));
const FileStreamRotator = __importStar(require("file-stream-rotator"));
const env_1 = require("./env");
class LogFileStream {
    constructor() {
        this.streamOptions = {
            // Rotating file locate at `~/.tabby-client/agent/logs/`.
            filename: path_1.default.join(os_1.default.homedir(), ".tabby-client", "agent", "logs", "%DATE%"),
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
const logFileStream = env_1.isBrowser || env_1.isTest ? undefined : new LogFileStream();
const pinoOptions = { serializers: { error: pino_1.default.stdSerializers.err } };
const rootBasicLogger = logFileStream ? (0, pino_1.default)(pinoOptions, logFileStream) : (0, pino_1.default)(pinoOptions);
if (env_1.isTest && env_1.testLogDebug) {
    rootBasicLogger.level = "debug";
}
else {
    rootBasicLogger.level = "silent";
}
exports.allBasicLoggers = [rootBasicLogger];
rootBasicLogger.onChild = (child) => {
    exports.allBasicLoggers.push(child);
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
        logFn(`[${component}] ${msg ?? ""}`, ...args);
    };
}
exports.extraLogger = {
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
function logger(component) {
    const basic = rootBasicLogger.child({ component });
    const extra = exports.extraLogger.child(component);
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
exports.logger = logger;
//# sourceMappingURL=logger.js.map