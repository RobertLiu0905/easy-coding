"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.configFile = void 0;
const events_1 = require("events");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const toml_1 = __importDefault(require("toml"));
const chokidar_1 = __importDefault(require("chokidar"));
const deep_equal_1 = __importDefault(require("deep-equal"));
const dot_prop_1 = require("dot-prop");
const env_1 = require("./env");
const logger_1 = require("./logger");
const configTomlTemplate = `## Tabby agent configuration file

## Online documentation: https://tabby.tabbyml.com/docs/extensions/configurations
## You can uncomment and edit the values below to change the default settings.
## Configurations in this file have lower priority than the IDE settings.

## Server
## You can set the server endpoint here and an optional authentication token if required.
# [server]
# endpoint = "http://localhost:8080" # http or https URL
# token = "your-token-here" # if token is set, request header Authorization = "Bearer $token" will be added automatically

## You can add custom request headers.
# [server.requestHeaders]
# Header1 = "Value1" # list your custom headers here
# Header2 = "Value2" # values can be strings, numbers or booleans

## Logs
## You can set the log level here. The log file is located at ~/.tabby-client/agent/logs/.
# [logs]
# level = "silent" # "silent" or "error" or "debug"

## Anonymous usage tracking
## Tabby collects anonymous usage data and sends it to the Tabby team to help improve our products.
## Your code, generated completions, or any sensitive information is never tracked or sent.
## For more details on data collection, see https://tabby.tabbyml.com/docs/extensions/configurations#usage-collection
## Your contribution is greatly appreciated. However, if you prefer not to participate, you can disable anonymous usage tracking here.
# [anonymousUsageTracking]
# disable = false # set to true to disable

`;
const typeCheckSchema = {
    server: "object",
    "server.endpoint": "string",
    "server.token": "string",
    "server.requestHeaders": "object",
    "server.requestTimeout": "number",
    completion: "object",
    "completion.prompt": "object",
    "completion.prompt.experimentalStripAutoClosingCharacters": "boolean",
    "completion.prompt.maxPrefixLines": "number",
    "completion.prompt.maxSuffixLines": "number",
    "completion.prompt.clipboard": "object",
    "completion.prompt.clipboard.minChars": "number",
    "completion.prompt.clipboard.maxChars": "number",
    "completion.debounce": "object",
    "completion.debounce.mode": "string",
    "completion.debounce.interval": "number",
    postprocess: "object",
    "postprocess.limitScopeByIndentation": "object",
    "postprocess.limitScopeByIndentation.experimentalKeepBlockScopeWhenCompletingLine": "boolean",
    logs: "object",
    "logs.level": "string",
    tls: "object",
    "tls.caCerts": "string",
    anonymousUsageTracking: "object",
    "anonymousUsageTracking.disable": "boolean",
};
function validateConfig(config) {
    for (const [key, type] of Object.entries(typeCheckSchema)) {
        if (typeof (0, dot_prop_1.getProperty)(config, key) !== type) {
            (0, dot_prop_1.deleteProperty)(config, key);
        }
    }
    return config;
}
class ConfigFile extends events_1.EventEmitter {
    constructor(filepath) {
        super();
        this.filepath = filepath;
        this.data = {};
        this.logger = (0, logger_1.logger)("ConfigFile");
    }
    get config() {
        return this.data;
    }
    async load() {
        try {
            const fileContent = await fs_extra_1.default.readFile(this.filepath, "utf8");
            const data = toml_1.default.parse(fileContent);
            // If the config file contains no value, overwrite it with the new template.
            if (Object.keys(data).length === 0 && fileContent.trim() !== configTomlTemplate.trim()) {
                await this.createTemplate();
                return;
            }
            this.data = validateConfig(data);
        }
        catch (error) {
            if (error instanceof Error && "code" in error && error.code === "ENOENT") {
                await this.createTemplate();
            }
            else {
                this.logger.error({ error }, "Failed to load config file");
            }
        }
    }
    watch() {
        this.watcher = chokidar_1.default.watch(this.filepath, {
            interval: 1000,
        });
        const onChanged = async () => {
            const oldData = this.data;
            await this.load();
            if (!(0, deep_equal_1.default)(oldData, this.data)) {
                super.emit("updated", this.data);
            }
        };
        this.watcher.on("add", onChanged);
        this.watcher.on("change", onChanged);
    }
    async createTemplate() {
        try {
            await fs_extra_1.default.outputFile(this.filepath, configTomlTemplate);
        }
        catch (error) {
            this.logger.error({ error }, "Failed to create config template file");
        }
    }
}
const configFilePath = path_1.default.join(os_1.default.homedir(), ".tabby-client", "agent", "config.toml");
exports.configFile = env_1.isBrowser ? undefined : new ConfigFile(configFilePath);
//# sourceMappingURL=configFile.js.map