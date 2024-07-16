import { splitLines, regOnlyAutoClosingCloseChars } from "./utils";
import hashObject from "object-hash";
function isAtLineEndExcludingAutoClosedChar(suffix) {
    return suffix.trimEnd().match(regOnlyAutoClosingCloseChars);
}
export class CompletionContext {
    constructor(request) {
        var _a, _b, _c, _d, _e;
        this.filepath = request.filepath;
        this.language = request.language;
        this.text = request.text;
        this.position = request.position;
        this.indentation = request.indentation;
        this.prefix = request.text.slice(0, request.position);
        this.suffix = request.text.slice(request.position);
        this.prefixLines = splitLines(this.prefix);
        this.suffixLines = splitLines(this.suffix);
        this.currentLinePrefix = (_a = this.prefixLines[this.prefixLines.length - 1]) !== null && _a !== void 0 ? _a : "";
        this.currentLineSuffix = (_b = this.suffixLines[0]) !== null && _b !== void 0 ? _b : "";
        this.clipboard = (_d = (_c = request.clipboard) === null || _c === void 0 ? void 0 : _c.trim()) !== null && _d !== void 0 ? _d : "";
        const lineEnd = isAtLineEndExcludingAutoClosedChar((_e = this.suffixLines[0]) !== null && _e !== void 0 ? _e : "");
        this.mode = lineEnd ? "default" : "fill-in-line";
        this.hash = hashObject({
            filepath: this.filepath,
            language: this.language,
            text: this.text,
            position: this.position,
            clipboard: this.clipboard,
        });
    }
}
//# sourceMappingURL=CompletionContext.js.map