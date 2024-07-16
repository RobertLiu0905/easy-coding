var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { getParser, languagesConfigs } from "../syntax/parser";
import { isBlank, splitLines } from "../utils";
import { logger } from "./base";
export const supportedLanguages = Object.keys(languagesConfigs);
/**
 * @throws {Error} if language is not supported
 * @throws {Error} if syntax error when parsing completion
 */
export function calculateReplaceRangeBySyntax(choice, context) {
    return __awaiter(this, void 0, void 0, function* () {
        var _a, _b;
        const { position, prefix, suffix, prefixLines, currentLinePrefix, currentLineSuffix, language } = context;
        const suffixText = currentLineSuffix.trimEnd();
        if (isBlank(suffixText)) {
            return choice;
        }
        if (!supportedLanguages.includes(language)) {
            throw new Error(`Language ${language} is not supported`);
        }
        const languageConfig = languagesConfigs[language];
        const parser = yield getParser(languageConfig);
        const completionText = choice.text.slice(position - choice.replaceRange.start);
        const completionLines = splitLines(completionText);
        let replaceLength = 0;
        let tree = parser.parse(prefix + completionText + suffix);
        let node = tree.rootNode.namedDescendantForIndex(prefix.length + completionText.length, prefix.length + completionText.length + suffixText.length - replaceLength);
        while (node.hasError() && replaceLength < suffixText.length) {
            replaceLength++;
            const row = prefixLines.length - 1 + completionLines.length - 1;
            let column = (_b = (_a = completionLines[completionLines.length - 1]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
            if (completionLines.length == 1) {
                column += currentLinePrefix.length;
            }
            tree.edit({
                startIndex: prefix.length + completionText.length,
                oldEndIndex: prefix.length + completionText.length + 1,
                newEndIndex: prefix.length + completionText.length,
                startPosition: { row, column },
                oldEndPosition: { row, column: column + 1 },
                newEndPosition: { row, column },
            });
            tree = parser.parse(prefix + completionText + suffix.slice(replaceLength), tree);
            node = tree.rootNode.namedDescendantForIndex(prefix.length + completionText.length, prefix.length + completionText.length + suffixText.length - replaceLength);
        }
        if (node.hasError()) {
            throw new Error("Syntax error when parsing completion");
        }
        choice.replaceRange.end = position + replaceLength;
        logger.trace({ context, completion: choice.text, range: choice.replaceRange }, "Adjust replace range by syntax");
        return choice;
    });
}
//# sourceMappingURL=calculateReplaceRangeBySyntax.js.map