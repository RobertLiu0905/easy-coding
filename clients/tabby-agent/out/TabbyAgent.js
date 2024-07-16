var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { EventEmitter } from "events";
import { v4 as uuid } from "uuid";
import deepEqual from "deep-equal";
import { deepmerge } from "deepmerge-ts";
import { getProperty, setProperty, deleteProperty } from "dot-prop";
import createClient from "openapi-fetch";
import { dataStore as defaultDataStore } from "./dataStore";
import { isBlank, abortSignalFromAnyOf, HttpError, isTimeoutError, isCanceledError, errorToString } from "./utils";
import { Auth } from "./Auth";
import { defaultAgentConfig } from "./AgentConfig";
import { configFile } from "./configFile";
import { CompletionCache } from "./CompletionCache";
import { CompletionDebounce } from "./CompletionDebounce";
import { CompletionContext } from "./CompletionContext";
import { preCacheProcess, postCacheProcess } from "./postprocess";
import { logger, allBasicLoggers, extraLogger } from "./logger";
import { AnonymousUsageLogger } from "./AnonymousUsageLogger";
import { CompletionProviderStats } from "./CompletionProviderStats";
import { loadTlsCaCerts } from "./loadCaCerts";
export class TabbyAgent extends EventEmitter {
    constructor() {
        super();
        this.logger = logger("TabbyAgent");
        this.anonymousUsageLogger = new AnonymousUsageLogger();
        this.config = defaultAgentConfig;
        this.userConfig = {}; // config from `~/.tabby-client/agent/config.toml`
        this.clientConfig = {}; // config from `initialize` and `updateConfig` method
        this.serverProvidedConfig = {}; // config fetched from server and saved in dataStore
        this.status = "notInitialized";
        this.issues = [];
        this.completionCache = new CompletionCache();
        this.completionDebounce = new CompletionDebounce();
        this.completionProviderStats = new CompletionProviderStats();
        this.tryingConnectTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (this.status === "disconnected") {
                this.logger.debug("Trying to connect...");
                yield this.healthCheck();
            }
        }), TabbyAgent.tryConnectInterval);
        this.submitStatsTimer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
            yield this.submitStats();
        }), TabbyAgent.submitStatsInterval);
    }
    applyConfig() {
        const _super = Object.create(null, {
            emit: { get: () => super.emit }
        });
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const oldConfig = this.config;
            const oldStatus = this.status;
            this.config = deepmerge(defaultAgentConfig, this.userConfig, this.clientConfig, this.serverProvidedConfig);
            allBasicLoggers.forEach((logger) => (logger.level = this.config.logs.level));
            this.anonymousUsageLogger.disabled = this.config.anonymousUsageTracking.disable;
            yield loadTlsCaCerts(this.config.tls);
            if (isBlank(this.config.server.token) && this.config.server.requestHeaders["Authorization"] === undefined) {
                if (this.config.server.endpoint !== ((_a = this.auth) === null || _a === void 0 ? void 0 : _a.endpoint)) {
                    this.auth = new Auth(this.config.server.endpoint);
                    yield this.auth.init({ dataStore: this.dataStore });
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
            if (!deepEqual(oldConfig.server, this.config.server)) {
                this.serverHealthState = undefined;
                this.completionProviderStats.resetWindowed();
                this.popIssue("slowCompletionResponseTime");
                this.popIssue("highCompletionTimeoutRate");
                this.popIssue("connectionFailed");
                this.connectionErrorMessage = undefined;
            }
            if (!this.api || !deepEqual(oldConfig.server, this.config.server)) {
                yield this.setupApi();
                // schedule fetch server config later, no await
                this.fetchServerConfig();
            }
            if (!deepEqual(oldConfig.server, this.config.server)) {
                // If server config changed and status remain `unauthorized`, we want to emit `authRequired` again.
                // but `changeStatus` will not emit `authRequired` if status is not changed, so we emit it manually here.
                if (oldStatus === "unauthorized" && this.status === "unauthorized") {
                    this.emitAuthRequired();
                }
            }
            const event = { event: "configUpdated", config: this.config };
            this.logger.debug({ event }, "Config updated");
            _super.emit.call(this, "configUpdated", event);
        });
    }
    setupApi() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            const auth = !isBlank(this.config.server.token)
                ? `Bearer ${this.config.server.token}`
                : ((_a = this.auth) === null || _a === void 0 ? void 0 : _a.token)
                    ? `Bearer ${this.auth.token}`
                    : undefined;
            this.api = createClient({
                baseUrl: this.config.server.endpoint.replace(/\/+$/, ""), // remove trailing slash
                headers: Object.assign({ Authorization: auth }, this.config.server.requestHeaders),
            });
            yield this.healthCheck();
        });
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
    submitStats() {
        return __awaiter(this, void 0, void 0, function* () {
            const stats = this.completionProviderStats.stats();
            if (stats.completion_request.count > 0) {
                yield this.anonymousUsageLogger.event("AgentStats", { stats });
                this.completionProviderStats.reset();
                this.logger.debug({ stats }, "Stats submitted");
            }
        });
    }
    createAbortSignal(options) {
        const timeout = Math.min(0x7fffffff, (options === null || options === void 0 ? void 0 : options.timeout) || this.config.server.requestTimeout);
        return abortSignalFromAnyOf([AbortSignal.timeout(timeout), options === null || options === void 0 ? void 0 : options.signal]);
    }
    healthCheck(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = uuid();
            const requestPath = "/v1/health";
            const requestUrl = this.config.server.endpoint + requestPath;
            const requestOptions = {
                signal: this.createAbortSignal({ signal: options === null || options === void 0 ? void 0 : options.signal }),
            };
            try {
                if (!this.api) {
                    throw new Error("http client not initialized");
                }
                this.logger.debug({ requestId, requestOptions, url: requestUrl }, "Health check request");
                let response;
                if ((options === null || options === void 0 ? void 0 : options.method) === "POST") {
                    response = yield this.api.POST(requestPath, requestOptions);
                }
                else {
                    response = yield this.api.GET(requestPath, requestOptions);
                }
                if (response.error || !response.response.ok) {
                    throw new HttpError(response.response);
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
                if (error instanceof HttpError && error.status == 405 && (options === null || options === void 0 ? void 0 : options.method) !== "POST") {
                    return yield this.healthCheck({ method: "POST" });
                }
                else if (error instanceof HttpError && [401, 403].includes(error.status)) {
                    this.logger.debug({ requestId, error }, "Health check error: unauthorized");
                    this.changeStatus("unauthorized");
                }
                else {
                    if (isTimeoutError(error)) {
                        this.logger.debug({ requestId, error }, "Health check error: timeout");
                        this.connectionErrorMessage = `GET ${requestUrl}: Timed out.`;
                    }
                    else if (isCanceledError(error)) {
                        this.logger.debug({ requestId, error }, "Health check error: canceled");
                        this.connectionErrorMessage = `GET ${requestUrl}: Canceled.`;
                    }
                    else {
                        this.logger.error({ requestId, error }, "Health check error: unknown error");
                        const message = error instanceof Error ? errorToString(error) : JSON.stringify(error);
                        this.connectionErrorMessage = `GET ${requestUrl}: Request failed: \n${message}`;
                    }
                    this.pushIssue("connectionFailed");
                    this.changeStatus("disconnected");
                }
            }
        });
    }
    fetchServerConfig() {
        return __awaiter(this, void 0, void 0, function* () {
            const requestId = uuid();
            try {
                if (!this.api) {
                    throw new Error("http client not initialized");
                }
                const requestPath = "/v1beta/server_setting";
                this.logger.debug({ requestId, url: this.config.server.endpoint + requestPath }, "Fetch server config request");
                const response = yield this.api.GET(requestPath);
                if (response.error || !response.response.ok) {
                    throw new HttpError(response.response);
                }
                this.logger.debug({ requestId, response }, "Fetch server config response");
                const fetchedConfig = response.data;
                const serverProvidedConfig = {};
                if (fetchedConfig.disable_client_side_telemetry) {
                    serverProvidedConfig.anonymousUsageTracking = {
                        disable: true,
                    };
                }
                if (!deepEqual(serverProvidedConfig, this.serverProvidedConfig)) {
                    this.serverProvidedConfig = serverProvidedConfig;
                    yield this.applyConfig();
                    if (this.dataStore) {
                        if (!this.dataStore.data.serverConfig) {
                            this.dataStore.data.serverConfig = {};
                        }
                        this.dataStore.data.serverConfig[this.config.server.endpoint] = this.serverProvidedConfig;
                        try {
                            yield this.dataStore.save();
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
        });
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
    initialize(options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c, _d;
            if (options.loggers) {
                extraLogger.loggers = options.loggers;
            }
            this.dataStore = (_a = options.dataStore) !== null && _a !== void 0 ? _a : defaultDataStore;
            if (this.dataStore) {
                try {
                    yield this.dataStore.load();
                    if ("watch" in this.dataStore && typeof this.dataStore.watch === "function") {
                        this.dataStore.watch();
                    }
                }
                catch (error) {
                    this.logger.debug({ error }, "No stored data loaded.");
                }
            }
            yield this.anonymousUsageLogger.init({ dataStore: this.dataStore });
            if (options.clientProperties) {
                const { user: userProp, session: sessionProp } = options.clientProperties;
                allBasicLoggers.forEach((logger) => { var _a; return (_a = logger.setBindings) === null || _a === void 0 ? void 0 : _a.call(logger, Object.assign({}, sessionProp)); });
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
            if (configFile) {
                yield configFile.load();
                this.userConfig = configFile.config;
                configFile.on("updated", (config) => __awaiter(this, void 0, void 0, function* () {
                    this.userConfig = config;
                    yield this.applyConfig();
                }));
                configFile.watch();
            }
            if (options.config) {
                this.clientConfig = options.config;
            }
            if (this.dataStore) {
                const localConfig = deepmerge(defaultAgentConfig, this.userConfig, this.clientConfig);
                this.serverProvidedConfig = (_d = (_c = (_b = this.dataStore) === null || _b === void 0 ? void 0 : _b.data.serverConfig) === null || _c === void 0 ? void 0 : _c[localConfig.server.endpoint]) !== null && _d !== void 0 ? _d : {};
                if (this.dataStore instanceof EventEmitter) {
                    this.dataStore.on("updated", () => __awaiter(this, void 0, void 0, function* () {
                        var _e;
                        const localConfig = deepmerge(defaultAgentConfig, this.userConfig, this.clientConfig);
                        const storedServerConfig = (_e = defaultDataStore === null || defaultDataStore === void 0 ? void 0 : defaultDataStore.data.serverConfig) === null || _e === void 0 ? void 0 : _e[localConfig.server.endpoint];
                        if (!deepEqual(storedServerConfig, this.serverProvidedConfig)) {
                            this.serverProvidedConfig = storedServerConfig !== null && storedServerConfig !== void 0 ? storedServerConfig : {};
                            yield this.applyConfig();
                        }
                    }));
                }
            }
            yield this.applyConfig();
            yield this.anonymousUsageLogger.uniqueEvent("AgentInitialized");
            this.logger.debug({ options }, "Initialized");
            return this.status !== "notInitialized";
        });
    }
    finalize() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === "finalized") {
                return false;
            }
            yield this.submitStats();
            if (this.tryingConnectTimer) {
                clearInterval(this.tryingConnectTimer);
            }
            if (this.submitStatsTimer) {
                clearInterval(this.submitStatsTimer);
            }
            this.changeStatus("finalized");
            return true;
        });
    }
    updateClientProperties(type, key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            switch (type) {
                case "session":
                    allBasicLoggers.forEach((logger) => { var _a; return (_a = logger.setBindings) === null || _a === void 0 ? void 0 : _a.call(logger, setProperty({}, key, value)); });
                    this.anonymousUsageLogger.setSessionProperties(key, value);
                    break;
                case "user":
                    this.anonymousUsageLogger.setUserProperties(key, value);
                    break;
            }
            return true;
        });
    }
    updateConfig(key, value) {
        return __awaiter(this, void 0, void 0, function* () {
            const current = getProperty(this.clientConfig, key);
            if (!deepEqual(current, value)) {
                if (value === undefined) {
                    deleteProperty(this.clientConfig, key);
                }
                else {
                    setProperty(this.clientConfig, key, value);
                }
                yield this.applyConfig();
            }
            return true;
        });
    }
    clearConfig(key) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield this.updateConfig(key, undefined);
        });
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
        var _a;
        return (_a = this.serverHealthState) !== null && _a !== void 0 ? _a : null;
    }
    requestAuthUrl(options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === "notInitialized") {
                throw new Error("Agent is not initialized");
            }
            yield this.healthCheck(options);
            if (this.status !== "unauthorized" || !this.auth) {
                return null;
            }
            else {
                return yield this.auth.requestAuthUrl(options);
            }
        });
    }
    waitForAuthToken(code, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === "notInitialized") {
                throw new Error("Agent is not initialized");
            }
            if (this.status !== "unauthorized" || !this.auth) {
                return;
            }
            yield this.auth.pollingToken(code, options);
            yield this.setupApi();
        });
    }
    provideCompletions(request, options) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a;
            if (this.status === "notInitialized") {
                throw new Error("Agent is not initialized");
            }
            this.logger.trace({ request }, "Call provideCompletions");
            if (this.nonParallelProvideCompletionAbortController) {
                this.nonParallelProvideCompletionAbortController.abort();
            }
            this.nonParallelProvideCompletionAbortController = new AbortController();
            const signal = abortSignalFromAnyOf([this.nonParallelProvideCompletionAbortController.signal, options === null || options === void 0 ? void 0 : options.signal]);
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
            const context = new CompletionContext(request);
            try {
                if (this.completionCache.has(context)) {
                    // Cache hit
                    stats.cacheHit = true;
                    this.logger.debug({ context }, "Completion cache hit");
                    // Debounce before returning cached response
                    yield this.completionDebounce.debounce({
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
                    if (isBlank(segments.prefix)) {
                        // Empty prompt
                        stats = undefined; // no need to record stats for empty prompt
                        this.logger.debug("Segment prefix is blank, returning empty completion response");
                        completionResponse = {
                            id: "agent-" + uuid(),
                            choices: [],
                        };
                    }
                    else {
                        // Debounce before sending request
                        yield this.completionDebounce.debounce({
                            request,
                            config: this.config.completion.debounce,
                            responseTime: this.completionProviderStats.windowed().stats.averageResponseTime,
                        }, options);
                        // Send http request
                        const requestId = uuid();
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
                                    user: (_a = this.auth) === null || _a === void 0 ? void 0 : _a.user,
                                },
                                signal: this.createAbortSignal({ signal }),
                            };
                            this.logger.debug({ requestId, requestOptions, url: this.config.server.endpoint + requestPath }, "Completion request");
                            const response = yield this.api.POST(requestPath, requestOptions);
                            if (response.error || !response.response.ok) {
                                throw new HttpError(response.response);
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
                            if (isCanceledError(error)) {
                                this.logger.debug({ requestId, error }, "Completion request canceled");
                                stats.requestCanceled = true;
                                stats.requestLatency = performance.now() - requestStartedAt;
                            }
                            else if (isTimeoutError(error)) {
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
                        completionResponse = yield preCacheProcess(context, this.config.postprocess, completionResponse);
                        if (signal.aborted) {
                            throw signal.reason;
                        }
                        // Build cache
                        this.completionCache.buildCache(context, JSON.parse(JSON.stringify(completionResponse)));
                    }
                }
                // Postprocess (post-cache)
                completionResponse = yield postCacheProcess(context, this.config.postprocess, completionResponse);
                if (signal.aborted) {
                    throw signal.reason;
                }
            }
            catch (error) {
                if (isCanceledError(error) || isTimeoutError(error)) {
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
        });
    }
    postEvent(request, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.status === "notInitialized") {
                throw new Error("Agent is not initialized");
            }
            this.completionProviderStats.addEvent(request.type);
            const requestId = uuid();
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
                const response = yield this.api.POST(requestPath, requestOptions);
                if (response.error || !response.response.ok) {
                    throw new HttpError(response.response);
                }
                this.logger.debug({ requestId, response }, "Event response");
                return true;
            }
            catch (error) {
                if (isTimeoutError(error)) {
                    this.logger.debug({ requestId, error }, "Event request timeout");
                }
                else if (isCanceledError(error)) {
                    this.logger.debug({ requestId, error }, "Event request canceled");
                }
                else {
                    this.logger.error({ requestId, error }, "Event request failed with unknown error");
                }
                return false;
            }
        });
    }
}
TabbyAgent.tryConnectInterval = 1000 * 30; // 30s
TabbyAgent.submitStatsInterval = 1000 * 60 * 60 * 24; // 24h
//# sourceMappingURL=TabbyAgent.js.map