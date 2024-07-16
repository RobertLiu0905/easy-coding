"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimMultiLineInSingleLineMode = void 0;
const base_1 = require("./base");
const utils_1 = require("../utils");
function trimMultiLineInSingleLineMode() {
    return (input, context) => {
        const inputLines = (0, utils_1.splitLines)(input);
        if (context.mode === "fill-in-line" && inputLines.length > 1) {
            const suffix = context.currentLineSuffix.trimEnd();
            const inputLine = inputLines[0].trimEnd();
            if (inputLine.endsWith(suffix)) {
                const trimmedInputLine = inputLine.slice(0, -suffix.length);
                if (trimmedInputLine.length > 0) {
                    base_1.logger.debug({ inputLines, trimmedInputLine }, "Trim content with multiple lines");
                    return trimmedInputLine;
                }
            }
            base_1.logger.debug({ inputLines }, "Drop content with multiple lines");
            return null;
        }
        return input;
    };
}
exports.trimMultiLineInSingleLineMode = trimMultiLineInSingleLineMode;
//# sourceMappingURL=trimMultiLineInSingleLineMode.js.map