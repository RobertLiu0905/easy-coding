import { logger } from "./base";
import { isBlank, splitLines } from "../utils";
function detectIndentation(lines) {
    var _a, _b;
    const matches = {
        "\t": 0,
        "  ": 0,
        "    ": 0,
    };
    for (const line of lines) {
        if (line.match(/^\t/)) {
            matches["\t"]++;
        }
        else {
            const spaces = (_b = (_a = line.match(/^ */)) === null || _a === void 0 ? void 0 : _a[0].length) !== null && _b !== void 0 ? _b : 0;
            if (spaces > 0) {
                if (spaces % 4 === 0) {
                    matches["    "]++;
                }
                if (spaces % 2 === 0) {
                    matches["  "]++;
                }
            }
        }
    }
    if (matches["\t"] > 0) {
        return "\t";
    }
    if (matches["  "] > matches["    "]) {
        return "  ";
    }
    if (matches["    "] > 0) {
        return "    ";
    }
    return null;
}
function getIndentLevel(line, indentation) {
    var _a, _b, _c, _d;
    if (indentation === "\t") {
        return (_b = (_a = line.match(/^\t*/)) === null || _a === void 0 ? void 0 : _a[0].length) !== null && _b !== void 0 ? _b : 0;
    }
    else {
        const spaces = (_d = (_c = line.match(/^ */)) === null || _c === void 0 ? void 0 : _c[0].length) !== null && _d !== void 0 ? _d : 0;
        return spaces / indentation.length;
    }
}
export function formatIndentation() {
    return (input, context) => {
        const { prefixLines, suffixLines, currentLinePrefix, indentation } = context;
        const inputLines = splitLines(input);
        // if no indentation is specified
        if (!indentation) {
            return input;
        }
        // if there is any indentation in context, the server output should have learned from it
        const prefixLinesForDetection = isBlank(currentLinePrefix)
            ? prefixLines.slice(0, prefixLines.length - 1)
            : prefixLines;
        if (prefixLines.length > 1 && detectIndentation(prefixLinesForDetection) !== null) {
            return input;
        }
        const suffixLinesForDetection = suffixLines.slice(1);
        if (suffixLines.length > 1 && detectIndentation(suffixLinesForDetection) !== null) {
            return input;
        }
        // if the input is well indented with specific indentation
        const inputLinesForDetection = inputLines.map((line, index) => {
            return index === 0 ? currentLinePrefix + line : line;
        });
        const inputIndentation = detectIndentation(inputLinesForDetection);
        if (inputIndentation === null || inputIndentation === indentation) {
            return input;
        }
        // otherwise, do formatting
        const formatted = inputLinesForDetection.map((line, index) => {
            const level = getIndentLevel(line, inputIndentation);
            if (level === 0) {
                return inputLines[index];
            }
            const rest = line.slice(inputIndentation.length * level);
            if (index === 0) {
                // for first line
                if (!isBlank(currentLinePrefix)) {
                    return inputLines[0];
                }
                else {
                    return indentation.repeat(level).slice(currentLinePrefix.length) + rest;
                }
            }
            else {
                // for next lines
                return indentation.repeat(level) + rest;
            }
        });
        logger.debug({ prefixLines, suffixLines, inputLines, formatted }, "Format indentation.");
        return formatted.join("");
    };
}
//# sourceMappingURL=formatIndentation.js.map