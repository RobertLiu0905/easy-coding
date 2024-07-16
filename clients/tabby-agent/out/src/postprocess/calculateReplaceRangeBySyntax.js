"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReplaceRangeBySyntax = exports.supportedLanguages = void 0;
const parser_1 = require("../syntax/parser");
const utils_1 = require("../utils");
const base_1 = require("./base");
exports.supportedLanguages = Object.keys(parser_1.languagesConfigs);
/**
 * @throws {Error} if language is not supported
 * @throws {Error} if syntax error when parsing completion
 */
async function calculateReplaceRangeBySyntax(choice, context) {
    const { position, prefix, suffix, prefixLines, currentLinePrefix, currentLineSuffix, language } = context;
    const suffixText = currentLineSuffix.trimEnd();
    if ((0, utils_1.isBlank)(suffixText)) {
        return choice;
    }
    if (!exports.supportedLanguages.includes(language)) {
        throw new Error(`Language ${language} is not supported`);
    }
    const languageConfig = parser_1.languagesConfigs[language];
    const parser = await (0, parser_1.getParser)(languageConfig);
    const completionText = choice.text.slice(position - choice.replaceRange.start);
    const completionLines = (0, utils_1.splitLines)(completionText);
    let replaceLength = 0;
    let tree = parser.parse(prefix + completionText + suffix);
    let node = tree.rootNode.namedDescendantForIndex(prefix.length + completionText.length, prefix.length + completionText.length + suffixText.length - replaceLength);
    while (node.hasError() && replaceLength < suffixText.length) {
        replaceLength++;
        const row = prefixLines.length - 1 + completionLines.length - 1;
        let column = completionLines[completionLines.length - 1]?.length ?? 0;
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
    base_1.logger.trace({ context, completion: choice.text, range: choice.replaceRange }, "Adjust replace range by syntax");
    return choice;
}
exports.calculateReplaceRangeBySyntax = calculateReplaceRangeBySyntax;
//# sourceMappingURL=calculateReplaceRangeBySyntax.js.map