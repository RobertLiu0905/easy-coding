"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatIndentation = void 0;
const base_1 = require("./base");
const utils_1 = require("../utils");
function detectIndentation(lines) {
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
            const spaces = line.match(/^ */)?.[0].length ?? 0;
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
    if (indentation === "\t") {
        return line.match(/^\t*/)?.[0].length ?? 0;
    }
    else {
        const spaces = line.match(/^ */)?.[0].length ?? 0;
        return spaces / indentation.length;
    }
}
function formatIndentation() {
    return (input, context) => {
        const { prefixLines, suffixLines, currentLinePrefix, indentation } = context;
        const inputLines = (0, utils_1.splitLines)(input);
        // if no indentation is specified
        if (!indentation) {
            return input;
        }
        // if there is any indentation in context, the server output should have learned from it
        const prefixLinesForDetection = (0, utils_1.isBlank)(currentLinePrefix)
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
                if (!(0, utils_1.isBlank)(currentLinePrefix)) {
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
        base_1.logger.debug({ prefixLines, suffixLines, inputLines, formatted }, "Format indentation.");
        return formatted.join("");
    };
}
exports.formatIndentation = formatIndentation;
//# sourceMappingURL=formatIndentation.js.map