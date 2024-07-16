"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Auth = void 0;
const events_1 = require("events");
const jwt_decode_1 = __importDefault(require("jwt-decode"));
const deep_equal_1 = __importDefault(require("deep-equal"));
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
const utils_1 = require("./utils");
const logger_1 = require("./logger");
class RetryLimitReachedError extends Error {
    constructor(cause) {
        super();
        this.cause = cause;
        this.name = "RetryLimitReachedError";
    }
}
class Auth extends events_1.EventEmitter {
    constructor(endpoint) {
        super();
        this.endpoint = endpoint;
        this.logger = (0, logger_1.logger)("Auth");
        this.authApi = (0, openapi_fetch_1.default)({ baseUrl: "https://app.tabbyml.com/api" });
    }
    async init(options) {
        this.dataStore = options?.dataStore;
        if (this.dataStore instanceof events_1.EventEmitter) {
            this.dataStore.on("updated", async () => {
                const oldJwt = this.jwt;
                await this.load();
                if (!(0, deep_equal_1.default)(oldJwt, this.jwt)) {
                    super.emit("updated", this.jwt);
                }
            });
        }
        this.scheduleRefreshToken();
        await this.load();
    }
    get token() {
        return this.jwt?.token;
    }
    get user() {
        return this.jwt?.payload.email;
    }
    async load() {
        if (!this.dataStore) {
            return;
        }
        try {
            await this.dataStore.load();
            const storedJwt = this.dataStore.data.auth?.[this.endpoint]?.jwt;
            if (typeof storedJwt === "string" && this.jwt?.token !== storedJwt) {
                this.logger.debug({ storedJwt }, "Load jwt from data store.");
                const jwt = {
                    token: storedJwt,
                    payload: (0, jwt_decode_1.default)(storedJwt),
                };
                // refresh token if it is about to expire or has expired
                if (jwt.payload.exp * 1000 - Date.now() < Auth.tokenStrategy.refresh.beforeExpire) {
                    this.jwt = await this.refreshToken(jwt, Auth.tokenStrategy.refresh.whenLoaded);
                    await this.save();
                }
                else {
                    this.jwt = jwt;
                }
            }
        }
        catch (error) {
            this.logger.debug({ error }, "Error when loading auth");
        }
    }
    async save() {
        if (!this.dataStore) {
            return;
        }
        try {
            if (this.jwt) {
                if (this.dataStore.data.auth?.[this.endpoint]?.jwt === this.jwt.token) {
                    return;
                }
                this.dataStore.data.auth = { ...this.dataStore.data.auth, [this.endpoint]: { jwt: this.jwt.token } };
            }
            else {
                if (typeof this.dataStore.data.auth?.[this.endpoint] === "undefined") {
                    return;
                }
                delete this.dataStore.data.auth[this.endpoint];
            }
            await this.dataStore.save();
            this.logger.debug("Save changes to data store.");
        }
        catch (error) {
            this.logger.error({ error }, "Error when saving auth");
        }
    }
    async reset() {
        if (this.jwt) {
            this.jwt = undefined;
            await this.save();
        }
    }
    async requestAuthUrl(options) {
        try {
            await this.reset();
            if (options?.signal.aborted) {
                throw options.signal.reason;
            }
            this.logger.debug("Start to request device token");
            const response = await this.authApi.POST("/device-token", {
                body: { auth_url: this.endpoint },
                signal: options?.signal,
            });
            if (response.error || !response.response.ok) {
                throw new utils_1.HttpError(response.response);
            }
            const deviceToken = response.data;
            this.logger.debug({ deviceToken }, "Request device token response");
            const authUrl = new URL(Auth.authPageUrl);
            authUrl.searchParams.append("code", deviceToken.data.code);
            return { authUrl: authUrl.toString(), code: deviceToken.data.code };
        }
        catch (error) {
            this.logger.error({ error }, "Error when requesting token");
            throw error;
        }
    }
    async pollingToken(code, options) {
        return new Promise((resolve, reject) => {
            const signal = (0, utils_1.abortSignalFromAnyOf)([AbortSignal.timeout(Auth.tokenStrategy.polling.timeout), options?.signal]);
            const timer = setInterval(async () => {
                try {
                    const response = await this.authApi.POST("/device-token/accept", { params: { query: { code } }, signal });
                    if (response.error || !response.response.ok) {
                        throw new utils_1.HttpError(response.response);
                    }
                    const result = response.data;
                    this.logger.debug({ result }, "Poll jwt response");
                    this.jwt = {
                        token: result.data.jwt,
                        payload: (0, jwt_decode_1.default)(result.data.jwt),
                    };
                    super.emit("updated", this.jwt);
                    await this.save();
                    clearInterval(timer);
                    resolve(true);
                }
                catch (error) {
                    if (error instanceof utils_1.HttpError && [400, 401, 403, 405].includes(error.status)) {
                        this.logger.debug({ error }, "Expected error when polling jwt");
                    }
                    else {
                        // unknown error but still keep polling
                        this.logger.error({ error }, "Error when polling jwt");
                    }
                }
            }, Auth.tokenStrategy.polling.interval);
            if (signal.aborted) {
                clearInterval(timer);
                reject(signal.reason);
            }
            else {
                signal.addEventListener("abort", () => {
                    clearInterval(timer);
                    reject(signal.reason);
                });
            }
        });
    }
    async refreshToken(jwt, options = { maxTry: 1, retryDelay: 1000 }, retry = 0) {
        try {
            this.logger.debug({ retry }, "Start to refresh token");
            const response = await this.authApi.POST("/device-token/refresh", {
                headers: { Authorization: `Bearer ${jwt.token}` },
            });
            if (response.error || !response.response.ok) {
                throw new utils_1.HttpError(response.response);
            }
            const refreshedJwt = response.data;
            this.logger.debug({ refreshedJwt }, "Refresh token response");
            return {
                token: refreshedJwt.data.jwt,
                payload: (0, jwt_decode_1.default)(refreshedJwt.data.jwt),
            };
        }
        catch (error) {
            if (error instanceof utils_1.HttpError && [400, 401, 403, 405].includes(error.status)) {
                this.logger.debug({ error }, "Error when refreshing jwt");
            }
            else {
                // unknown error, retry a few times
                this.logger.error({ error }, "Unknown error when refreshing jwt");
                if (retry < options.maxTry) {
                    this.logger.debug(`Retry refreshing jwt after ${options.retryDelay}ms`);
                    await new Promise((resolve) => setTimeout(resolve, options.retryDelay));
                    return this.refreshToken(jwt, options, retry + 1);
                }
            }
            throw new RetryLimitReachedError(error);
        }
    }
    scheduleRefreshToken() {
        setInterval(async () => {
            if (!this.jwt) {
                return;
            }
            if (this.jwt.payload.exp * 1000 - Date.now() < Auth.tokenStrategy.refresh.beforeExpire) {
                try {
                    this.jwt = await this.refreshToken(this.jwt, Auth.tokenStrategy.refresh.whenScheduled);
                    super.emit("updated", this.jwt);
                    await this.save();
                }
                catch (error) {
                    this.logger.error({ error }, "Error when refreshing jwt");
                }
            }
            else {
                this.logger.debug("Check token, still valid");
            }
        }, Auth.tokenStrategy.refresh.interval);
    }
}
exports.Auth = Auth;
Auth.authPageUrl = "https://app.tabbyml.com/account/device-token";
Auth.tokenStrategy = {
    polling: {
        // polling token after auth url generated
        interval: 5000, // polling token every 5 seconds
        timeout: 5 * 60 * 1000, // stop polling after trying for 5 min
    },
    refresh: {
        // check token every 15 min, refresh token if it expires in 30 min
        interval: 15 * 60 * 1000,
        beforeExpire: 30 * 60 * 1000,
        whenLoaded: {
            // after token loaded from data store, refresh token if it is about to expire or has expired
            maxTry: 5, // keep loading time not too long
            retryDelay: 1000, // retry after 1 seconds
        },
        whenScheduled: {
            // if running until token is about to expire, refresh token as scheduled
            maxTry: 60,
            retryDelay: 30 * 1000, // retry after 30 seconds
        },
    },
};
//# sourceMappingURL=Auth.js.map