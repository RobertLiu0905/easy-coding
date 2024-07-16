"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionContext = void 0;
const utils_1 = require("./utils");
const object_hash_1 = __importDefault(require("object-hash"));
function isAtLineEndExcludingAutoClosedChar(suffix) {
    return suffix.trimEnd().match(utils_1.regOnlyAutoClosingCloseChars);
}
class CompletionContext {
    constructor(request) {
        this.filepath = request.filepath;
        this.language = request.language;
        this.text = request.text;
        this.position = request.position;
        this.indentation = request.indentation;
        this.prefix = request.text.slice(0, request.position);
        this.suffix = request.text.slice(request.position);
        this.prefixLines = (0, utils_1.splitLines)(this.prefix);
        this.suffixLines = (0, utils_1.splitLines)(this.suffix);
        this.currentLinePrefix = this.prefixLines[this.prefixLines.length - 1] ?? "";
        this.currentLineSuffix = this.suffixLines[0] ?? "";
        this.clipboard = request.clipboard?.trim() ?? "";
        const lineEnd = isAtLineEndExcludingAutoClosedChar(this.suffixLines[0] ?? "");
        this.mode = lineEnd ? "default" : "fill-in-line";
        this.hash = (0, object_hash_1.default)({
            filepath: this.filepath,
            language: this.language,
            text: this.text,
            position: this.position,
            clipboard: this.clipboard,
        });
    }
}
exports.CompletionContext = CompletionContext;
//# sourceMappingURL=CompletionContext.js.map