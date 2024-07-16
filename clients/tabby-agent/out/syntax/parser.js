var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from "path";
import TreeSitterParser from "web-tree-sitter";
import { isTest } from "../env";
// https://code.visualstudio.com/docs/languages/identifiers
export const languagesConfigs = {
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
function createParser(languageConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        if (!treeSitterInitialized) {
            yield TreeSitterParser.init({
                locateFile(scriptName, scriptDirectory) {
                    const paths = isTest ? [scriptDirectory, scriptName] : [scriptDirectory, "wasm", scriptName];
                    return path.join(...paths);
                },
            });
            treeSitterInitialized = true;
        }
        const parser = new TreeSitterParser();
        const langWasmPaths = isTest
            ? [process.cwd(), "wasm", `tree-sitter-${languageConfig}.wasm`]
            : [__dirname, "wasm", `tree-sitter-${languageConfig}.wasm`];
        parser.setLanguage(yield TreeSitterParser.Language.load(path.join(...langWasmPaths)));
        return parser;
    });
}
const parsers = new Map();
export function getParser(languageConfig) {
    return __awaiter(this, void 0, void 0, function* () {
        let parser = parsers.get(languageConfig);
        if (!parser) {
            parser = yield createParser(languageConfig);
            parsers.set(languageConfig, parser);
        }
        return parser;
    });
}
//# sourceMappingURL=parser.js.map