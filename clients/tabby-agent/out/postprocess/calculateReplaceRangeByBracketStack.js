import { isBlank, findUnpairedAutoClosingChars } from "../utils";
import { logger } from "./base";
export function calculateReplaceRangeByBracketStack(choice, context) {
    const { currentLineSuffix } = context;
    const suffixText = currentLineSuffix.trimEnd();
    if (isBlank(suffixText)) {
        return choice;
    }
    const completionText = choice.text.slice(context.position - choice.replaceRange.start);
    const unpaired = findUnpairedAutoClosingChars(completionText).join("");
    if (isBlank(unpaired)) {
        return choice;
    }
    if (suffixText.startsWith(unpaired)) {
        choice.replaceRange.end = context.position + unpaired.length;
        logger.trace({ context, completion: choice.text, range: choice.replaceRange, unpaired }, "Adjust replace range by bracket stack");
    }
    else if (unpaired.startsWith(suffixText)) {
        choice.replaceRange.end = context.position + suffixText.length;
        logger.trace({ context, completion: choice.text, range: choice.replaceRange, unpaired }, "Adjust replace range by bracket stack");
    }
    return choice;
}
//# sourceMappingURL=calculateReplaceRangeByBracketStack.js.map