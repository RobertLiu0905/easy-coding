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
import path from "path";
import os from "os";
import fs from "fs-extra";
import deepEqual from "deep-equal";
import chokidar from "chokidar";
import { isBrowser } from "./env";
class FileDataStore extends EventEmitter {
    constructor(filepath) {
        super();
        this.filepath = filepath;
        this.data = {};
    }
    load() {
        return __awaiter(this, void 0, void 0, function* () {
            this.data = (yield fs.readJson(dataFile, { throws: false })) || {};
        });
    }
    save() {
        return __awaiter(this, void 0, void 0, function* () {
            yield fs.outputJson(dataFile, this.data);
        });
    }
    watch() {
        const _super = Object.create(null, {
            emit: { get: () => super.emit }
        });
        this.watcher = chokidar.watch(this.filepath, {
            interval: 1000,
        });
        const onChanged = () => __awaiter(this, void 0, void 0, function* () {
            const oldData = this.data;
            yield this.load();
            if (!deepEqual(oldData, this.data)) {
                _super.emit.call(this, "updated", this.data);
            }
        });
        this.watcher.on("add", onChanged);
        this.watcher.on("change", onChanged);
    }
}
const dataFile = path.join(os.homedir(), ".tabby-client", "agent", "data.json");
export const dataStore = isBrowser ? undefined : new FileDataStore(dataFile);
//# sourceMappingURL=dataStore.js.map