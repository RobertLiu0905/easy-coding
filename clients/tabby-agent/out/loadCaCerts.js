var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import tls from "tls";
import path from "path";
import fs from "fs-extra";
import winCa from "win-ca/api";
import * as macCa from "mac-ca";
import { isBrowser } from "./env";
import "./ArrayExt";
import { logger as getLogger } from "./logger";
const logger = getLogger("CaCert");
let extraCaCerts = [];
let originalCreateSecureContext = undefined;
function appendCaCerts(certs) {
    if (!originalCreateSecureContext) {
        originalCreateSecureContext = tls.createSecureContext;
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
    tls.createSecureContext = (options) => {
        const secureContext = originalCreateSecureContext(options);
        extraCaCerts.forEach((cert) => {
            secureContext.context.addCACert(cert);
        });
        return secureContext;
    };
}
function loadFromFiles(files) {
    return __awaiter(this, void 0, void 0, function* () {
        logger.debug(`Loading extra certs from ${files}.`);
        const certs = (yield files.split(path.delimiter).mapAsync((cert) => __awaiter(this, void 0, void 0, function* () {
            try {
                return (yield fs.readFile(cert)).toString();
            }
            catch (err) {
                return null;
            }
        })))
            .join("\n")
            .split(/(?=-----BEGIN\sCERTIFICATE-----)/g)
            .distinct();
        appendCaCerts(certs);
    });
}
export function loadTlsCaCerts(options) {
    return __awaiter(this, void 0, void 0, function* () {
        if (isBrowser) {
            return;
        }
        if (options.caCerts === "bundled") {
            return;
        }
        else if (options.caCerts === "system") {
            if (process.platform === "win32") {
                logger.debug(`Loading extra certs from win-ca.`);
                winCa.exe(path.join("win-ca", "roots.exe"));
                winCa({
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
                yield loadFromFiles(path.join("/etc/ssl/certs/ca-certificates.crt"));
            }
        }
        else if (options.caCerts) {
            yield loadFromFiles(options.caCerts);
        }
    });
}
//# sourceMappingURL=loadCaCerts.js.map