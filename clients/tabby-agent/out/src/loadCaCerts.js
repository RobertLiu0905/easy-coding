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
exports.loadTlsCaCerts = void 0;
const tls_1 = __importDefault(require("tls"));
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const api_1 = __importDefault(require("win-ca/api"));
const macCa = __importStar(require("mac-ca"));
const env_1 = require("./env");
require("./ArrayExt");
const logger_1 = require("./logger");
const logger = (0, logger_1.logger)("CaCert");
let extraCaCerts = [];
let originalCreateSecureContext = undefined;
function appendCaCerts(certs) {
    if (!originalCreateSecureContext) {
        originalCreateSecureContext = tls_1.default.createSecureContext;
    }
    const filtered = certs.filter((cert) => {
        if (typeof cert === "string") {
            return cert.trim().length > 0;
        }
        return true;
    });
    const merged = [...extraCaCerts, ...filtered].distinct();
    logger.debug(`Loaded ${merged.length - extraCaCerts.length} extra certs.`);
    extraCaCerts = merged;
    tls_1.default.createSecureContext = (options) => {
        const secureContext = originalCreateSecureContext(options);
        extraCaCerts.forEach((cert) => {
            secureContext.context.addCACert(cert);
        });
        return secureContext;
    };
}
async function loadFromFiles(files) {
    logger.debug(`Loading extra certs from ${files}.`);
    const certs = (await files.split(path_1.default.delimiter).mapAsync(async (cert) => {
        try {
            return (await fs_extra_1.default.readFile(cert)).toString();
        }
        catch (err) {
            return null;
        }
    }))
        .join("\n")
        .split(/(?=-----BEGIN\sCERTIFICATE-----)/g)
        .distinct();
    appendCaCerts(certs);
}
async function loadTlsCaCerts(options) {
    if (env_1.isBrowser) {
        return;
    }
    if (options.caCerts === "bundled") {
        return;
    }
    else if (options.caCerts === "system") {
        if (process.platform === "win32") {
            logger.debug(`Loading extra certs from win-ca.`);
            api_1.default.exe(path_1.default.join("win-ca", "roots.exe"));
            (0, api_1.default)({
                fallback: true,
                inject: "+",
            });
        }
        else if (process.platform === "darwin") {
            logger.debug(`Loading extra certs from mac-ca.`);
            const certs = macCa.get();
            appendCaCerts(certs);
        }
        else {
            // linux: load from openssl cert
            await loadFromFiles(path_1.default.join("/etc/ssl/certs/ca-certificates.crt"));
        }
    }
    else if (options.caCerts) {
        await loadFromFiles(options.caCerts);
    }
}
exports.loadTlsCaCerts = loadTlsCaCerts;
//# sourceMappingURL=loadCaCerts.js.map