"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.removeRepetitiveBlocks = void 0;
const base_1 = require("./base");
const utils_1 = require("../utils");
function blockSplitter(_) {
    // Have not implemented this for each language for now
    // Return a blank line matcher should work for most cases
    return /\n(\s*)\n/g;
}
// FIXME: refactor this because it is very similar to `removeRepetitiveLines`
function removeRepetitiveBlocks() {
    return (input, context) => {
        const inputBlocks = input.split(blockSplitter(context.language));
        let repetitionCount = 0;
        const repetitionThreshold = 2;
        // skip last block, it maybe cut
        let index = inputBlocks.length - 2;
        while (index >= 1) {
            if ((0, utils_1.isBlank)(inputBlocks[index])) {
                index--;
                continue;
            }
            let prev = index - 1;
            while (prev >= 0 && (0, utils_1.isBlank)(inputBlocks[prev])) {
                prev--;
            }
            if (prev < 0)
                break;
            // if distance between current and previous block is less than threshold (threshold = or 10% of string length)
            const currentBlock = inputBlocks[index].trim();
            const previousBlock = inputBlocks[prev].trim();
            const threshold = Math.max(0.1 * currentBlock.length, 0.1 * previousBlock.length);
            const distance = (0, utils_1.calcDistance)(currentBlock, previousBlock);
            if (distance <= threshold) {
                repetitionCount++;
                index--;
            }
            else {
                break;
            }
        }
        if (repetitionCount >= repetitionThreshold) {
            base_1.logger.debug({
                inputBlocks,
                repetitionCount,
            }, "Remove repetitive blocks.");
            return inputBlocks
                .slice(0, index + 1)
                .join("")
                .trimEnd();
        }
        return input;
    };
}
exports.removeRepetitiveBlocks = removeRepetitiveBlocks;
//# sourceMappingURL=removeRepetitiveBlocks.js.map