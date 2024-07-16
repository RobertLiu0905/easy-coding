"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dataStore = void 0;
const events_1 = require("events");
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const deep_equal_1 = __importDefault(require("deep-equal"));
const chokidar_1 = __importDefault(require("chokidar"));
const env_1 = require("./env");
class FileDataStore extends events_1.EventEmitter {
    constructor(filepath) {
        super();
        this.filepath = filepath;
        this.data = {};
    }
    async load() {
        this.data = (await fs_extra_1.default.readJson(dataFile, { throws: false })) || {};
    }
    async save() {
        await fs_extra_1.default.outputJson(dataFile, this.data);
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
}
const dataFile = path_1.default.join(os_1.default.homedir(), ".tabby-client", "agent", "data.json");
exports.dataStore = env_1.isBrowser ? undefined : new FileDataStore(dataFile);
//# sourceMappingURL=dataStore.js.map