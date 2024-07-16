"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeDuplicatedBlockClosingLine = void 0;
const base_1 = require("./base");
const utils_1 = require("../utils");
// For remove duplicated block closing line at ( ending of input text ) and ( beginning of suffix text )
// Should be useful after limitScope
function removeDuplicatedBlockClosingLine() {
    return (input, context) => {
        const { suffixLines, currentLinePrefix } = context;
        const inputLines = (0, utils_1.splitLines)(input);
        if (inputLines.length < 2) {
            // If completion only has one line, don't continue process
            return input;
        }
        const inputLinesForDetection = inputLines.map((line, index) => {
            return index === 0 ? currentLinePrefix + line : line;
        });
        if (!(0, utils_1.isBlockClosingLine)(inputLinesForDetection, inputLines.length - 1)) {
            return input;
        }
        const inputEndingLine = inputLines[inputLines.length - 1];
        let suffixBeginningIndex = 1;
        while (suffixBeginningIndex < suffixLines.length && (0, utils_1.isBlank)(suffixLines[suffixBeginningIndex])) {
            suffixBeginningIndex++;
        }
        if (suffixBeginningIndex >= suffixLines.length) {
            return input;
        }
        const suffixBeginningLine = suffixLines[suffixBeginningIndex];
        if (inputEndingLine.startsWith(suffixBeginningLine.trimEnd()) ||
            suffixBeginningLine.startsWith(inputEndingLine.trimEnd())) {
            base_1.logger.debug({ inputLines, suffixLines }, "Removing duplicated block closing line");
            return inputLines
                .slice(0, inputLines.length - 1)
                .join("")
                .trimEnd();
        }
        return input;
    };
}
exports.removeDuplicatedBlockClosingLine = removeDuplicatedBlockClosingLine;
//# sourceMappingURL=removeDuplicatedBlockClosingLine.js.map