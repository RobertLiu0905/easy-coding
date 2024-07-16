"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnonymousUsageLogger = void 0;
const os_1 = __importDefault(require("os"));
const openapi_fetch_1 = __importDefault(require("openapi-fetch"));
const dot_prop_1 = require("dot-prop");
const uuid_1 = require("uuid");
const package_json_1 = require("../package.json");
const env_1 = require("./env");
const logger_1 = require("./logger");
class AnonymousUsageLogger {
    constructor() {
        this.anonymousUsageTrackingApi = (0, openapi_fetch_1.default)({ baseUrl: "https://app.tabbyml.com/api" });
        this.logger = (0, logger_1.logger)("AnonymousUsage");
        this.systemData = {
            agent: `${package_json_1.name}, ${package_json_1.version}`,
            browser: env_1.isBrowser ? navigator?.userAgent || "browser" : undefined,
            node: env_1.isBrowser ? undefined : `${process.version} ${process.platform} ${os_1.default.arch()} ${os_1.default.release()}`,
        };
        this.sessionProperties = {};
        this.userProperties = {};
        this.userPropertiesUpdated = false;
        this.emittedUniqueEvent = [];
        this.disabled = false;
    }
    async init(options) {
        this.dataStore = options?.dataStore;
        if (this.dataStore) {
            if (typeof this.dataStore.data["anonymousId"] === "string") {
                this.anonymousId = this.dataStore.data["anonymousId"];
            }
            else {
                this.anonymousId = (0, uuid_1.v4)();
                this.dataStore.data["anonymousId"] = this.anonymousId;
                try {
                    await this.dataStore.save();
                }
                catch (error) {
                    this.logger.debug({ error }, "Error when saving anonymousId");
                }
            }
        }
        else {
            this.anonymousId = (0, uuid_1.v4)();
        }
    }
    /**
     * Set properties to be sent with every event in this session.
     */
    setSessionProperties(key, value) {
        (0, dot_prop_1.setProperty)(this.sessionProperties, key, value);
    }
    /**
     * Set properties which will be bind to the user.
     */
    setUserProperties(key, value) {
        (0, dot_prop_1.setProperty)(this.userProperties, key, value);
        this.userPropertiesUpdated = true;
    }
    async uniqueEvent(event, data = {}) {
        await this.event(event, data, true);
    }
    async event(event, data = {}, unique = false) {
        if (this.disabled || !this.anonymousId) {
            return;
        }
        if (unique && this.emittedUniqueEvent.includes(event)) {
            return;
        }
        if (unique) {
            this.emittedUniqueEvent.push(event);
        }
        const properties = {
            ...this.systemData,
            ...this.sessionProperties,
            ...data,
        };
        if (this.userPropertiesUpdated) {
            (0, dot_prop_1.setProperty)(properties, "$set", this.userProperties);
            this.userPropertiesUpdated = false;
        }
        try {
            await this.anonymousUsageTrackingApi.POST("/usage", {
                body: {
                    distinctId: this.anonymousId,
                    event,
                    properties,
                },
            });
        }
        catch (error) {
            this.logger.error({ error }, "Error when sending anonymous usage data");
        }
    }
}
exports.AnonymousUsageLogger = AnonymousUsageLogger;
//# sourceMappingURL=AnonymousUsageLogger.js.map