"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReplaceRangeByBracketStack = void 0;
const utils_1 = require("../utils");
const base_1 = require("./base");
function calculateReplaceRangeByBracketStack(choice, context) {
    const { currentLineSuffix } = context;
    const suffixText = currentLineSuffix.trimEnd();
    if ((0, utils_1.isBlank)(suffixText)) {
        return choice;
    }
    const completionText = choice.text.slice(context.position - choice.replaceRange.start);
    const unpaired = (0, utils_1.findUnpairedAutoClosingChars)(completionText).join("");
    if ((0, utils_1.isBlank)(unpaired)) {
        return choice;
    }
    if (suffixText.startsWith(unpaired)) {
        choice.replaceRange.end = context.position + unpaired.length;
        base_1.logger.trace({ context, completion: choice.text, range: choice.replaceRange, unpaired }, "Adjust replace range by bracket stack");
    }
    else if (unpaired.startsWith(suffixText)) {
        choice.replaceRange.end = context.position + suffixText.length;
        base_1.logger.trace({ context, completion: choice.text, range: choice.replaceRange, unpaired }, "Adjust replace range by bracket stack");
    }
    return choice;
}
exports.calculateReplaceRangeByBracketStack = calculateReplaceRangeByBracketStack;
//# sourceMappingURL=calculateReplaceRangeByBracketStack.js.map