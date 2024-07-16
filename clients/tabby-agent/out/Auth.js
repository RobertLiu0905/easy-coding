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
import decodeJwt from "jwt-decode";
import deepEqual from "deep-equal";
import createClient from "openapi-fetch";
import { HttpError, abortSignalFromAnyOf } from "./utils";
import { logger } from "./logger";
class RetryLimitReachedError extends Error {
    constructor(cause) {
        super();
        this.cause = cause;
        this.name = "RetryLimitReachedError";
    }
}
export class Auth extends EventEmitter {
    constructor(endpoint) {
        super();
        this.endpoint = endpoint;
        this.logger = logger("Auth");
        this.authApi = createClient({ baseUrl: "https://app.tabbyml.com/api" });
    }
    init(options) {
        const _super = Object.create(null, {
            emit: { get: () => super.emit }
        });
        return __awaiter(this, void 0, void 0, function* () {
            this.dataStore = options === null || options === void 0 ? void 0 : options.dataStore;
            if (this.dataStore instanceof EventEmitter) {
                this.dataStore.on("updated", () => __awaiter(this, void 0, void 0, function* () {
                    const oldJwt = this.jwt;
                    yield this.load();
                    if (!deepEqual(oldJwt, this.jwt)) {
                        _super.emit.call(this, "updated", this.jwt);
                    }
                }));
            }
            this.scheduleRefreshToken();
            yield this.load();
        });
    }
    get token() {
        var _a;
        return (_a = this.jwt) === null || _a === void 0 ? void 0 : _a.token;
    }
    get user() {
        var _a;
        return (_a = this.jwt) === null || _a === void 0 ? void 0 : _a.payload.email;
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!this.dataStore) {
                return;
            }
            try {
                yield this.dataStore.load();
                const storedJwt = (_b = (_a = this.dataStore.data.auth) === null || _a === void 0 ? void 0 : _a[this.endpoint]) === null || _b === void 0 ? void 0 : _b.jwt;
                if (typeof storedJwt === "string" && ((_c = this.jwt) === null || _c === void 0 ? void 0 : _c.token) !== storedJwt) {
                    this.logger.debug({ storedJwt }, "Load jwt from data store.");
                    const jwt = {
                        token: storedJwt,
                        payload: decodeJwt(storedJwt),
                    };
                    // refresh token if it is about to expire or has expired
                    if (jwt.payload.exp * 1000 - Date.now() < Auth.tokenStrategy.refresh.beforeExpire) {
                        this.jwt = yield this.refreshToken(jwt, Auth.tokenStrategy.refresh.whenLoaded);
                        yield this.save();
                    }
                    else {
                        this.jwt = jwt;
                    }
                }
            }
            catch (error) {
                this.logger.debug({ error }, "Error when loading auth");
            }
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b, _c;
            if (!this.dataStore) {
                return;
            }
            try {
                if (this.jwt) {
                    if (((_b = (_a = this.dataStore.data.auth) === null || _a === void 0 ? void 0 : _a[this.endpoint]) === null || _b === void 0 ? void 0 : _b.jwt) === this.jwt.token) {
                        return;
                    }
                    this.dataStore.data.auth = Object.assign(Object.assign({}, this.dataStore.data.auth), { [this.endpoint]: { jwt: this.jwt.token } });
                }
                else {
                    if (typeof ((_c = this.dataStore.data.auth) === null || _c === void 0 ? void 0 : _c[this.endpoint]) === "undefined") {
                        return;
                    }
                    delete this.dataStore.data.auth[this.endpoint];
                }
                yield this.dataStore.save();
                this.logger.debug("Save changes to data store.");
            }
            catch (error) {
                this.logger.error({ error }, "Error when saving auth");
            }
        });
    }
    reset() {
        return __awaiter(this, void 0, void 0, function* () {
            if (this.jwt) {
                this.jwt = undefined;
                yield this.save();
            }
        });
    }
    requestAuthUrl(options) {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                yield this.reset();
                if (options === null || options === void 0 ? void 0 : options.signal.aborted) {
                    throw options.signal.reason;
                }
                this.logger.debug("Start to request device token");
                const response = yield this.authApi.POST("/device-token", {
                    body: { auth_url: this.endpoint },
                    signal: options === null || options === void 0 ? void 0 : options.signal,
                });
                if (response.error || !response.response.ok) {
                    throw new HttpError(response.response);
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
        });
    }
    pollingToken(code, options) {
        const _super = Object.create(null, {
            emit: { get: () => super.emit }
        });
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const signal = abortSignalFromAnyOf([AbortSignal.timeout(Auth.tokenStrategy.polling.timeout), options === null || options === void 0 ? void 0 : options.signal]);
                const timer = setInterval(() => __awaiter(this, void 0, void 0, function* () {
                    try {
                        const response = yield this.authApi.POST("/device-token/accept", { params: { query: { code } }, signal });
                        if (response.error || !response.response.ok) {
                            throw new HttpError(response.response);
                        }
                        const result = response.data;
                        this.logger.debug({ result }, "Poll jwt response");
                        this.jwt = {
                            token: result.data.jwt,
                            payload: decodeJwt(result.data.jwt),
                        };
                        _super.emit.call(this, "updated", this.jwt);
                        yield this.save();
                        clearInterval(timer);
                        resolve(true);
                    }
                    catch (error) {
                        if (error instanceof HttpError && [400, 401, 403, 405].includes(error.status)) {
                            this.logger.debug({ error }, "Expected error when polling jwt");
                        }
                        else {
                            // unknown error but still keep polling
                            this.logger.error({ error }, "Error when polling jwt");
                        }
                    }
                }), Auth.tokenStrategy.polling.interval);
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
        });
    }
    refreshToken(jwt_1) {
        return __awaiter(this, arguments, void 0, function* (jwt, options = { maxTry: 1, retryDelay: 1000 }, retry = 0) {
            try {
                this.logger.debug({ retry }, "Start to refresh token");
                const response = yield this.authApi.POST("/device-token/refresh", {
                    headers: { Authorization: `Bearer ${jwt.token}` },
                });
                if (response.error || !response.response.ok) {
                    throw new HttpError(response.response);
                }
                const refreshedJwt = response.data;
                this.logger.debug({ refreshedJwt }, "Refresh token response");
                return {
                    token: refreshedJwt.data.jwt,
                    payload: decodeJwt(refreshedJwt.data.jwt),
                };
            }
            catch (error) {
                if (error instanceof HttpError && [400, 401, 403, 405].includes(error.status)) {
                    this.logger.debug({ error }, "Error when refreshing jwt");
                }
                else {
                    // unknown error, retry a few times
                    this.logger.error({ error }, "Unknown error when refreshing jwt");
                    if (retry < options.maxTry) {
                        this.logger.debug(`Retry refreshing jwt after ${options.retryDelay}ms`);
                        yield new Promise((resolve) => setTimeout(resolve, options.retryDelay));
                        return this.refreshToken(jwt, options, retry + 1);
                    }
                }
                throw new RetryLimitReachedError(error);
            }
        });
    }
    scheduleRefreshToken() {
        const _super = Object.create(null, {
            emit: { get: () => super.emit }
        });
        setInterval(() => __awaiter(this, void 0, void 0, function* () {
            if (!this.jwt) {
                return;
            }
            if (this.jwt.payload.exp * 1000 - Date.now() < Auth.tokenStrategy.refresh.beforeExpire) {
                try {
                    this.jwt = yield this.refreshToken(this.jwt, Auth.tokenStrategy.refresh.whenScheduled);
                    _super.emit.call(this, "updated", this.jwt);
                    yield this.save();
                }
                catch (error) {
                    this.logger.error({ error }, "Error when refreshing jwt");
                }
            }
            else {
                this.logger.debug("Check token, still valid");
            }
        }), Auth.tokenStrategy.refresh.interval);
    }
}
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