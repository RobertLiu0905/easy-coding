var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import os from "os";
import createClient from "openapi-fetch";
import { setProperty } from "dot-prop";
import { v4 as uuid } from "uuid";
import { name as agentName, version as agentVersion } from "../package.json";
import { isBrowser } from "./env";
import { logger } from "./logger";
export class AnonymousUsageLogger {
    constructor() {
        this.anonymousUsageTrackingApi = createClient({ baseUrl: "https://app.tabbyml.com/api" });
        this.logger = logger("AnonymousUsage");
        this.systemData = {
            agent: `${agentName}, ${agentVersion}`,
            browser: isBrowser ? (navigator === null || navigator === void 0 ? void 0 : navigator.userAgent) || "browser" : undefined,
            node: isBrowser ? undefined : `${process.version} ${process.platform} ${os.arch()} ${os.release()}`,
        };
        this.sessionProperties = {};
        this.userProperties = {};
        this.userPropertiesUpdated = false;
        this.emittedUniqueEvent = [];
        this.disabled = false;
    }
    init(options) {
        return __awaiter(this, void 0, void 0, function* () {
            this.dataStore = options === null || options === void 0 ? void 0 : options.dataStore;
            if (this.dataStore) {
                if (typeof this.dataStore.data["anonymousId"] === "string") {
                    this.anonymousId = this.dataStore.data["anonymousId"];
                }
                else {
                    this.anonymousId = uuid();
                    this.dataStore.data["anonymousId"] = this.anonymousId;
                    try {
                        yield this.dataStore.save();
                    }
                    catch (error) {
                        this.logger.debug({ error }, "Error when saving anonymousId");
                    }
                }
            }
            else {
                this.anonymousId = uuid();
            }
        });
    }
    /**
     * Set properties to be sent with every event in this session.
     */
    setSessionProperties(key, value) {
        setProperty(this.sessionProperties, key, value);
    }
    /**
     * Set properties which will be bind to the user.
     */
    setUserProperties(key, value) {
        setProperty(this.userProperties, key, value);
        this.userPropertiesUpdated = true;
    }
    uniqueEvent(event_1) {
        return __awaiter(this, arguments, void 0, function* (event, data = {}) {
            yield this.event(event, data, true);
        });
    }
    event(event_1) {
        return __awaiter(this, arguments, void 0, function* (event, data = {}, unique = false) {
            if (this.disabled || !this.anonymousId) {
                return;
            }
            if (unique && this.emittedUniqueEvent.includes(event)) {
                return;
            }
            if (unique) {
                this.emittedUniqueEvent.push(event);
            }
            const properties = Object.assign(Object.assign(Object.assign({}, this.systemData), this.sessionProperties), data);
            if (this.userPropertiesUpdated) {
                setProperty(properties, "$set", this.userProperties);
                this.userPropertiesUpdated = false;
            }
            try {
                yield this.anonymousUsageTrackingApi.POST("/usage", {
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
        });
    }
}
//# sourceMappingURL=AnonymousUsageLogger.js.map