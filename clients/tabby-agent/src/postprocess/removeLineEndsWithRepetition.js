"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeLineEndsWithRepetition = void 0;
const base_1 = require("./base");
const utils_1 = require("../utils");
const repetitionTests = [
    /(.{3,}?)\1{5,}$/g, // match a 3+ characters pattern repeating 5+ times
    /(.{10,}?)\1{3,}$/g, // match a 10+ characters pattern repeating 3+ times
];
function removeLineEndsWithRepetition() {
    return (input) => {
        // only test last non-blank line
        const inputLines = (0, utils_1.splitLines)(input);
        let index = inputLines.length - 1;
        while (index >= 0 && (0, utils_1.isBlank)(inputLines[index])) {
            index--;
        }
        if (index < 0)
            return input;
        // if matches repetition test, remove this line
        for (const test of repetitionTests) {
            const match = inputLines[index].match(test);
            if (match) {
                base_1.logger.debug({
                    inputLines,
                    lineNumber: index,
                    match,
                }, "Remove line ends with repetition.");
                if (index < 1)
                    return null;
                return inputLines.slice(0, index).join("").trimEnd();
            }
        }
        // no repetition found
        return input;
    };
}
exports.removeLineEndsWithRepetition = removeLineEndsWithRepetition;
//# sourceMappingURL=removeLineEndsWithRepetition.js.map