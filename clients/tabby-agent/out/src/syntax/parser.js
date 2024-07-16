"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getParser = exports.languagesConfigs = void 0;
const path_1 = __importDefault(require("path"));
const web_tree_sitter_1 = __importDefault(require("web-tree-sitter"));
const env_1 = require("../env");
// https://code.visualstudio.com/docs/languages/identifiers
exports.languagesConfigs = {
    javascript: "tsx",
    typescript: "tsx",
    javascriptreact: "tsx",
    typescriptreact: "tsx",
    python: "python",
    go: "go",
    rust: "rust",
    ruby: "ruby",
};
let treeSitterInitialized = false;
async function createParser(languageConfig) {
    if (!treeSitterInitialized) {
        await web_tree_sitter_1.default.init({
            locateFile(scriptName, scriptDirectory) {
                const paths = env_1.isTest ? [scriptDirectory, scriptName] : [scriptDirectory, "wasm", scriptName];
                return path_1.default.join(...paths);
            },
        });
        treeSitterInitialized = true;
    }
    const parser = new web_tree_sitter_1.default();
    const langWasmPaths = env_1.isTest
        ? [process.cwd(), "wasm", `tree-sitter-${languageConfig}.wasm`]
        : [__dirname, "wasm", `tree-sitter-${languageConfig}.wasm`];
    parser.setLanguage(await web_tree_sitter_1.default.Language.load(path_1.default.join(...langWasmPaths)));
    return parser;
}
const parsers = new Map();
async function getParser(languageConfig) {
    let parser = parsers.get(languageConfig);
    if (!parser) {
        parser = await createParser(languageConfig);
        parsers.set(languageConfig, parser);
    }
    return parser;
}
exports.getParser = getParser;
//# sourceMappingURL=parser.js.map