"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TabbyAgent = void 0;
const events_1 = require("events");
const uuid_1 = require("uuid");
const deep_equal_1 = __importDefault(require("deep-equal"));
const deepmerge_ts_1 = require("deepmerge-ts");
const dot_prop_1 = require("dot-prop");
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
const dataStore_1 = require("./dataStore");
const utils_1 = require("./utils");
const Auth_1 = require("./Auth");
const AgentConfig_1 = require("./AgentConfig");
const configFile_1 = require("./configFile");
const CompletionCache_1 = require("./CompletionCache");
const CompletionDebounce_1 = require("./CompletionDebounce");
const CompletionContext_1 = require("./CompletionContext");
const postprocess_1 = require("./postprocess");
const logger_1 = require("./logger");
const AnonymousUsageLogger_1 = require("./AnonymousUsageLogger");
const CompletionProviderStats_1 = require("./CompletionProviderStats");
const loadCaCerts_1 = require("./loadCaCerts");
class TabbyAgent extends events_1.EventEmitter {
    constructor() {
        super();
        this.logger = (0, logger_1.logger)("TabbyAgent");
        this.anonymousUsageLogger = new AnonymousUsageLogger_1.AnonymousUsageLogger();
        this.config = AgentConfig_1.defaultAgentConfig;
        this.userConfig = {}; // config from `~/.tabby-client/agent/config.toml`
        this.clientConfig = {}; // config from `initialize` and `updateConfig` method
        this.serverProvidedConfig = {}; // config fetched from server and saved in dataStore
        this.status = "notInitialized";
        this.issues = [];
        this.completionCache = new CompletionCache_1.CompletionCache();
        this.completionDebounce = new CompletionDebounce_1.CompletionDebounce();
        this.completionProviderStats = new CompletionProviderStats_1.CompletionProviderStats();
        this.tryingConnectTimer = setInterval(async () => {
            if (this.status === "disconnected") {
                this.logger.debug("Trying to connect...");
                await this.healthCheck();
            }
        }, TabbyAgent.tryConnectInterval);
        this.submitStatsTimer = setInterval(async () => {
            await this.submitStats();
        }, TabbyAgent.submitStatsInterval);
    }
    async applyConfig() {
        const oldConfig = this.config;
        const oldStatus = this.status;
        this.config = (0, deepmerge_ts_1.deepmerge)(AgentConfig_1.defaultAgentConfig, this.userConfig, this.clientConfig, this.serverProvidedConfig);
        logger_1.allBasicLoggers.forEach((logger) => (logger.level = this.config.logs.level));
        this.anonymousUsageLogger.disabled = this.config.anonymousUsageTracking.disable;
        await (0, loadCaCerts_1.loadTlsCaCerts)(this.config.tls);
        if ((0, utils_1.isBlank)(this.config.server.token) && this.config.server.requestHeaders["Authorization"] === undefined) {
            if (this.config.server.endpoint !== this.auth?.endpoint) {
                this.auth = new Auth_1.Auth(this.config.server.endpoint);
                await this.auth.init({ dataStore: this.dataStore });
                this.auth.on("updated", () => {
                    this.setupApi();
                });
            }
        }
        else {
            // If auth token is provided, use it directly.
            this.auth = undefined;
        }
        // If server config changed, clear server related state
        if (!(0, deep_equal_1.default)(oldConfig.server, this.config.server)) {
            this.serverHealthState = undefined;
            this.completionProviderStats.resetWindowed();
            this.popIssue("slowCompletionResponseTime");
            this.popIssue("highCompletionTimeoutRate");
            this.popIssue("connectionFailed");
            this.connectionErrorMessage = undefined;
        }
        if (!this.api || !(0, deep_equal_1.default)(oldConfig.server, this.config.server)) {
            await this.setupApi();
            // schedule fetch server config later, no await
            this.fetchServerConfig();
        }
        if (!(0, deep_equal_1.default)(oldConfig.server, this.config.server)) {
            // If server config changed and status remain `unauthorized`, we want to emit `authRequired` again.
            // but `changeStatus` will not emit `authRequired` if status is not changed, so we emit it manually here.
            if (oldStatus === "unauthorized" && this.status === "unauthorized") {
                this.emitAuthRequired();
            }
        }
        const event = { event: "configUpdated", config: this.config };
        this.logger.debug({ event }, "Config updated");
        super.emit("configUpdated", event);
    }
    async setupApi() {
        const auth = !(0, utils_1.isBlank)(this.config.server.token)
            ? `Bearer ${this.config.server.token}`
            : this.auth?.token
                ? `Bearer ${this.auth.token}`
                : undefined;
        this.api = (0, openapi_fetch_1.default)({
            baseUrl: this.config.server.endpoint.replace(/\/+$/, ""), // remove trailing slash
            headers: {
                Authorization: auth,
                ...this.config.server.requestHeaders,
            },
        });
        await this.healthCheck();
    }
    changeStatus(status) {
        if (this.status != status) {
            this.status = status;
            const event = { event: "statusChanged", status };
            this.logger.debug({ event }, "Status changed");
            super.emit("statusChanged", event);
            if (this.status === "unauthorized") {
                this.emitAuthRequired();
            }
        }
    }
    issueFromName(issueName) {
        switch (issueName) {
            case "highCompletionTimeoutRate":
                return {
                    name: "highCompletionTimeoutRate",
                    completionResponseStats: this.completionProviderStats.windowed().stats,
                };
            case "slowCompletionResponseTime":
                return {
                    name: "slowCompletionResponseTime",
                    completionResponseStats: this.completionProviderStats.windowed().stats,
                };
            case "connectionFailed":
                return {
                    name: "connectionFailed",
                    message: this.connectionErrorMessage,
                };
        }
    }
    pushIssue(issue) {
        if (!this.issues.includes(issue)) {
            this.issues.push(issue);
            this.logger.debug({ issue }, "Issues Pushed");
            this.emitIssueUpdated();
        }
    }
    popIssue(issue) {
        const index = this.issues.indexOf(issue);
        if (index >= 0) {
            this.issues.splice(index, 1);
            this.logger.debug({ issue }, "Issues Popped");
            this.emitIssueUpdated();
        }
    }
    emitAuthRequired() {
        const event = { event: "authRequired", server: this.config.server };
        super.emit("authRequired", event);
    }
    emitIssueUpdated() {
        const event = { event: "issuesUpdated", issues: this.issues };
        super.emit("issuesUpdated", event);
    }
    async submitStats() {
        const stats = this.completionProviderStats.stats();
        if (stats.completion_request.count > 0) {
            await this.anonymousUsageLogger.event("AgentStats", { stats });
            this.completionProviderStats.reset();
            this.logger.debug({ stats }, "Stats submitted");
        }
    }
    createAbortSignal(options) {
        const timeout = Math.min(0x7fffffff, options?.timeout || this.config.server.requestTimeout);
        return (0, utils_1.abortSignalFromAnyOf)([AbortSignal.timeout(timeout), options?.signal]);
    }
    async healthCheck(options) {
        const requestId = (0, uuid_1.v4)();
        const requestPath = "/v1/health";
        const requestUrl = this.config.server.endpoint + requestPath;
        const requestOptions = {
            signal: this.createAbortSignal({ signal: options?.signal }),
        };
        try {
            if (!this.api) {
                throw new Error("http client not initialized");
            }
            this.logger.debug({ requestId, requestOptions, url: requestUrl }, "Health check request");
            let response;
            if (options?.method === "POST") {
                response = await this.api.POST(requestPath, requestOptions);
            }
            else {
                response = await this.api.GET(requestPath, requestOptions);
            }
            if (response.error || !response.response.ok) {
                throw new utils_1.HttpError(response.response);
            }
            this.logger.debug({ requestId, response }, "Health check response");
            this.changeStatus("ready");
            this.popIssue("connectionFailed");
            this.connectionErrorMessage = undefined;
            const healthState = response.data;
            if (typeof healthState === "object" &&
                healthState["model"] !== undefined &&
                healthState["device"] !== undefined) {
                this.serverHealthState = healthState;
                this.anonymousUsageLogger.uniqueEvent("AgentConnected", healthState);
                // schedule fetch server config later, no await
                this.fetchServerConfig();
            }
        }
        catch (error) {
            this.serverHealthState = undefined;
            if (error instanceof utils_1.HttpError && error.status == 405 && options?.method !== "POST") {
                return await this.healthCheck({ method: "POST" });
            }
            else if (error instanceof utils_1.HttpError && [401, 403].includes(error.status)) {
                this.logger.debug({ requestId, error }, "Health check error: unauthorized");
                this.changeStatus("unauthorized");
            }
            else {
                if ((0, utils_1.isTimeoutError)(error)) {
                    this.logger.debug({ requestId, error }, "Health check error: timeout");
                    this.connectionErrorMessage = `GET ${requestUrl}: Timed out.`;
                }
                else if ((0, utils_1.isCanceledError)(error)) {
                    this.logger.debug({ requestId, error }, "Health check error: canceled");
                    this.connectionErrorMessage = `GET ${requestUrl}: Canceled.`;
                }
                else {
                    this.logger.error({ requestId, error }, "Health check error: unknown error");
                    const message = error instanceof Error ? (0, utils_1.errorToString)(error) : JSON.stringify(error);
                    this.connectionErrorMessage = `GET ${requestUrl}: Request failed: \n${message}`;
                }
                this.pushIssue("connectionFailed");
                this.changeStatus("disconnected");
            }
        }
    }
    async fetchServerConfig() {
        const requestId = (0, uuid_1.v4)();
        try {
            if (!this.api) {
                throw new Error("http client not initialized");
            }
            const requestPath = "/v1beta/server_setting";
            this.logger.debug({ requestId, url: this.config.server.endpoint + requestPath }, "Fetch server config request");
            const response = await this.api.GET(requestPath);
            if (response.error || !response.response.ok) {
                throw new utils_1.HttpError(response.response);
            }
            this.logger.debug({ requestId, response }, "Fetch server config response");
            const fetchedConfig = response.data;
            const serverProvidedConfig = {};
            if (fetchedConfig.disable_client_side_telemetry) {
                serverProvidedConfig.anonymousUsageTracking = {
                    disable: true,
                };
            }
            if (!(0, deep_equal_1.default)(serverProvidedConfig, this.serverProvidedConfig)) {
                this.serverProvidedConfig = serverProvidedConfig;
                await this.applyConfig();
                if (this.dataStore) {
                    if (!this.dataStore.data.serverConfig) {
                        this.dataStore.data.serverConfig = {};
                    }
                    this.dataStore.data.serverConfig[this.config.server.endpoint] = this.serverProvidedConfig;
                    try {
                        await this.dataStore.save();
                    }
                    catch (error) {
                        this.logger.error({ error }, "Error when saving serverConfig");
                    }
                }
            }
        }
        catch (error) {
            this.logger.error({ requestId, error }, "Fetch server config error");
        }
    }
    createSegments(context) {
        // max lines in prefix and suffix configurable
        const maxPrefixLines = this.config.completion.prompt.maxPrefixLines;
        const maxSuffixLines = this.config.completion.prompt.maxSuffixLines;
        const { prefixLines, suffixLines } = context;
        const prefix = prefixLines.slice(Math.max(prefixLines.length - maxPrefixLines, 0)).join("");
        let suffix;
        if (this.config.completion.prompt.experimentalStripAutoClosingCharacters && context.mode !== "fill-in-line") {
            suffix = "\n" + suffixLines.slice(1, maxSuffixLines).join("");
        }
        else {
            suffix = suffixLines.slice(0, maxSuffixLines).join("");
        }
        let clipboard = undefined;
        const clipboardConfig = this.config.completion.prompt.clipboard;
        if (context.clipboard.length >= clipboardConfig.minChars && context.clipboard.length <= clipboardConfig.maxChars) {
            clipboard = context.clipboard;
        }
        return { prefix, suffix, clipboard };
    }
    async initialize(options) {
        if (options.loggers) {
            logger_1.extraLogger.loggers = options.loggers;
        }
        this.dataStore = options.dataStore ?? dataStore_1.dataStore;
        if (this.dataStore) {
            try {
                await this.dataStore.load();
                if ("watch" in this.dataStore && typeof this.dataStore.watch === "function") {
                    this.dataStore.watch();
                }
            }
            catch (error) {
                this.logger.debug({ error }, "No stored data loaded.");
            }
        }
        await this.anonymousUsageLogger.init({ dataStore: this.dataStore });
        if (options.clientProperties) {
            const { user: userProp, session: sessionProp } = options.clientProperties;
            logger_1.allBasicLoggers.forEach((logger) => logger.setBindings?.({ ...sessionProp }));
            if (sessionProp) {
                Object.entries(sessionProp).forEach(([key, value]) => {
                    this.anonymousUsageLogger.setSessionProperties(key, value);
                });
            }
            if (userProp) {
                Object.entries(userProp).forEach(([key, value]) => {
                    this.anonymousUsageLogger.setUserProperties(key, value);
                });
            }
        }
        if (configFile_1.configFile) {
            await configFile_1.configFile.load();
            this.userConfig = configFile_1.configFile.config;
            configFile_1.configFile.on("updated", async (config) => {
                this.userConfig = config;
                await this.applyConfig();
            });
            configFile_1.configFile.watch();
        }
        if (options.config) {
            this.clientConfig = options.config;
        }
        if (this.dataStore) {
            const localConfig = (0, deepmerge_ts_1.deepmerge)(AgentConfig_1.defaultAgentConfig, this.userConfig, this.clientConfig);
            this.serverProvidedConfig = this.dataStore?.data.serverConfig?.[localConfig.server.endpoint] ?? {};
            if (this.dataStore instanceof events_1.EventEmitter) {
                this.dataStore.on("updated", async () => {
                    const localConfig = (0, deepmerge_ts_1.deepmerge)(AgentConfig_1.defaultAgentConfig, this.userConfig, this.clientConfig);
                    const storedServerConfig = dataStore_1.dataStore?.data.serverConfig?.[localConfig.server.endpoint];
                    if (!(0, deep_equal_1.default)(storedServerConfig, this.serverProvidedConfig)) {
                        this.serverProvidedConfig = storedServerConfig ?? {};
                        await this.applyConfig();
                    }
                });
            }
        }
        await this.applyConfig();
        await this.anonymousUsageLogger.uniqueEvent("AgentInitialized");
        this.logger.debug({ options }, "Initialized");
        return this.status !== "notInitialized";
    }
    async finalize() {
        if (this.status === "finalized") {
            return false;
        }
        await this.submitStats();
        if (this.tryingConnectTimer) {
            clearInterval(this.tryingConnectTimer);
        }
        if (this.submitStatsTimer) {
            clearInterval(this.submitStatsTimer);
        }
        this.changeStatus("finalized");
        return true;
    }
    async updateClientProperties(type, key, value) {
        switch (type) {
            case "session":
                logger_1.allBasicLoggers.forEach((logger) => logger.setBindings?.((0, dot_prop_1.setProperty)({}, key, value)));
                this.anonymousUsageLogger.setSessionProperties(key, value);
                break;
            case "user":
                this.anonymousUsageLogger.setUserProperties(key, value);
                break;
        }
        return true;
    }
    async updateConfig(key, value) {
        const current = (0, dot_prop_1.getProperty)(this.clientConfig, key);
        if (!(0, deep_equal_1.default)(current, value)) {
            if (value === undefined) {
                (0, dot_prop_1.deleteProperty)(this.clientConfig, key);
            }
            else {
                (0, dot_prop_1.setProperty)(this.clientConfig, key, value);
            }
            await this.applyConfig();
        }
        return true;
    }
    async clearConfig(key) {
        return await this.updateConfig(key, undefined);
    }
    getConfig() {
        return this.config;
    }
    getStatus() {
        return this.status;
    }
    getIssues() {
        return this.issues;
    }
    getIssueDetail(options) {
        const issues = this.getIssues();
        if (options.index !== undefined && options.index < issues.length) {
            return this.issueFromName(issues[options.index]);
        }
        else if (options.name !== undefined && this.issues.includes(options.name)) {
            return this.issueFromName(options.name);
        }
        else {
            return null;
        }
    }
    getServerHealthState() {
        return this.serverHealthState ?? null;
    }
    async requestAuthUrl(options) {
        if (this.status === "notInitialized") {
            throw new Error("Agent is not initialized");
        }
        await this.healthCheck(options);
        if (this.status !== "unauthorized" || !this.auth) {
            return null;
        }
        else {
            return await this.auth.requestAuthUrl(options);
        }
    }
    async waitForAuthToken(code, options) {
        if (this.status === "notInitialized") {
            throw new Error("Agent is not initialized");
        }
        if (this.status !== "unauthorized" || !this.auth) {
            return;
        }
        await this.auth.pollingToken(code, options);
        await this.setupApi();
    }
    async provideCompletions(request, options) {
        if (this.status === "notInitialized") {
            throw new Error("Agent is not initialized");
        }
        this.logger.trace({ request }, "Call provideCompletions");
        if (this.nonParallelProvideCompletionAbortController) {
            this.nonParallelProvideCompletionAbortController.abort();
        }
        this.nonParallelProvideCompletionAbortController = new AbortController();
        const signal = (0, utils_1.abortSignalFromAnyOf)([this.nonParallelProvideCompletionAbortController.signal, options?.signal]);
        let completionResponse;
        let stats = {
            triggerMode: request.manually ? "manual" : "auto",
            cacheHit: false,
            aborted: false,
            requestSent: false,
            requestLatency: 0,
            requestCanceled: false,
            requestTimeout: false,
        };
        let requestStartedAt;
        const context = new CompletionContext_1.CompletionContext(request);
        try {
            if (this.completionCache.has(context)) {
                // Cache hit
                stats.cacheHit = true;
                this.logger.debug({ context }, "Completion cache hit");
                // Debounce before returning cached response
                await this.completionDebounce.debounce({
                    request,
                    config: this.config.completion.debounce,
                    responseTime: 0,
                }, { signal });
                completionResponse = this.completionCache.get(context);
            }
            else {
                // Cache miss
                stats.cacheHit = false;
                const segments = this.createSegments(context);
                if ((0, utils_1.isBlank)(segments.prefix)) {
                    // Empty prompt
                    stats = undefined; // no need to record stats for empty prompt
                    this.logger.debug("Segment prefix is blank, returning empty completion response");
                    completionResponse = {
                        id: "agent-" + (0, uuid_1.v4)(),
                        choices: [],
                    };
                }
                else {
                    // Debounce before sending request
                    await this.completionDebounce.debounce({
                        request,
                        config: this.config.completion.debounce,
                        responseTime: this.completionProviderStats.windowed().stats.averageResponseTime,
                    }, options);
                    // Send http request
                    const requestId = (0, uuid_1.v4)();
                    stats.requestSent = true;
                    requestStartedAt = performance.now();
                    try {
                        if (!this.api) {
                            throw new Error("http client not initialized");
                        }
                        const requestPath = "/v1/completions";
                        const requestOptions = {
                            body: {
                                language: request.language,
                                segments,
                                user: this.auth?.user,
                            },
                            signal: this.createAbortSignal({ signal }),
                        };
                        this.logger.debug({ requestId, requestOptions, url: this.config.server.endpoint + requestPath }, "Completion request");
                        const response = await this.api.POST(requestPath, requestOptions);
                        if (response.error || !response.response.ok) {
                            throw new utils_1.HttpError(response.response);
                        }
                        this.logger.debug({ requestId, response }, "Completion response");
                        const responseData = response.data;
                        stats.requestLatency = performance.now() - requestStartedAt;
                        completionResponse = {
                            id: responseData.id,
                            choices: responseData.choices.map((choice) => {
                                return {
                                    index: choice.index,
                                    text: choice.text,
                                    replaceRange: {
                                        start: request.position,
                                        end: request.position,
                                    },
                                };
                            }),
                        };
                    }
                    catch (error) {
                        if ((0, utils_1.isCanceledError)(error)) {
                            this.logger.debug({ requestId, error }, "Completion request canceled");
                            stats.requestCanceled = true;
                            stats.requestLatency = performance.now() - requestStartedAt;
                        }
                        else if ((0, utils_1.isTimeoutError)(error)) {
                            this.logger.debug({ requestId, error }, "Completion request timeout");
                            stats.requestTimeout = true;
                            stats.requestLatency = NaN;
                        }
                        else {
                            this.logger.error({ requestId, error }, "Completion request failed with unknown error");
                            // schedule a health check
                            this.healthCheck();
                        }
                        // rethrow error
                        throw error;
                    }
                    // Postprocess (pre-cache)
                    completionResponse = await (0, postprocess_1.preCacheProcess)(context, this.config.postprocess, completionResponse);
                    if (signal.aborted) {
                        throw signal.reason;
                    }
                    // Build cache
                    this.completionCache.buildCache(context, JSON.parse(JSON.stringify(completionResponse)));
                }
            }
            // Postprocess (post-cache)
            completionResponse = await (0, postprocess_1.postCacheProcess)(context, this.config.postprocess, completionResponse);
            if (signal.aborted) {
                throw signal.reason;
            }
        }
        catch (error) {
            if ((0, utils_1.isCanceledError)(error) || (0, utils_1.isTimeoutError)(error)) {
                if (stats) {
                    stats.aborted = true;
                }
            }
            else {
                // unexpected error
                stats = undefined;
            }
            // rethrow error
            throw error;
        }
        finally {
            if (stats) {
                this.completionProviderStats.add(stats);
                if (stats.requestSent && !stats.requestCanceled) {
                    const windowedStats = this.completionProviderStats.windowed();
                    const checkResult = this.completionProviderStats.check(windowedStats);
                    switch (checkResult) {
                        case "healthy":
                            this.popIssue("slowCompletionResponseTime");
                            this.popIssue("highCompletionTimeoutRate");
                            break;
                        case "highTimeoutRate":
                            this.popIssue("slowCompletionResponseTime");
                            this.pushIssue("highCompletionTimeoutRate");
                            break;
                        case "slowResponseTime":
                            this.popIssue("highCompletionTimeoutRate");
                            this.pushIssue("slowCompletionResponseTime");
                            break;
                    }
                }
            }
        }
        this.logger.trace({ context, completionResponse }, "Return from provideCompletions");
        return completionResponse;
    }
    async postEvent(request, options) {
        if (this.status === "notInitialized") {
            throw new Error("Agent is not initialized");
        }
        this.completionProviderStats.addEvent(request.type);
        const requestId = (0, uuid_1.v4)();
        try {
            if (!this.api) {
                throw new Error("http client not initialized");
            }
            const requestPath = "/v1/events";
            const requestOptions = {
                body: request,
                params: {
                    query: {
                        select_kind: request.select_kind,
                    },
                },
                signal: this.createAbortSignal(options),
                parseAs: "text",
            };
            this.logger.debug({ requestId, requestOptions, url: this.config.server.endpoint + requestPath }, "Event request");
            const response = await this.api.POST(requestPath, requestOptions);
            if (response.error || !response.response.ok) {
                throw new utils_1.HttpError(response.response);
            }
            this.logger.debug({ requestId, response }, "Event response");
            return true;
        }
        catch (error) {
            if ((0, utils_1.isTimeoutError)(error)) {
                this.logger.debug({ requestId, error }, "Event request timeout");
            }
            else if ((0, utils_1.isCanceledError)(error)) {
                this.logger.debug({ requestId, error }, "Event request canceled");
            }
            else {
                this.logger.error({ requestId, error }, "Event request failed with unknown error");
            }
            return false;
        }
    }
}
exports.TabbyAgent = TabbyAgent;
TabbyAgent.tryConnectInterval = 1000 * 30; // 30s
TabbyAgent.submitStatsInterval = 1000 * 60 * 60 * 24; // 24h
//# sourceMappingURL=TabbyAgent.js.map