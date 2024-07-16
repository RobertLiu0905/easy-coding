"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitScopeBySyntax = exports.supportedLanguages = void 0;
const parser_1 = require("../syntax/parser");
const typeList_1 = require("../syntax/typeList");
const base_1 = require("./base");
exports.supportedLanguages = Object.keys(parser_1.languagesConfigs);
function findLineBegin(text, position) {
    let lastNonBlankCharPos = position - 1;
    while (lastNonBlankCharPos >= 0 && text[lastNonBlankCharPos]?.match(/\s/)) {
        lastNonBlankCharPos--;
    }
    if (lastNonBlankCharPos < 0) {
        return 0;
    }
    const lineBegin = text.lastIndexOf("\n", lastNonBlankCharPos);
    if (lineBegin < 0) {
        return 0;
    }
    const line = text.slice(lineBegin + 1, position);
    const indentation = line.search(/\S/);
    return lineBegin + 1 + indentation;
}
function findLineEnd(text, position) {
    let firstNonBlankCharPos = position;
    while (firstNonBlankCharPos < text.length && text[firstNonBlankCharPos]?.match(/\s/)) {
        firstNonBlankCharPos++;
    }
    if (firstNonBlankCharPos >= text.length) {
        return text.length;
    }
    const lineEnd = text.indexOf("\n", firstNonBlankCharPos);
    if (lineEnd < 0) {
        return text.length;
    }
    return lineEnd;
}
function findScope(node, typeList) {
    for (const types of typeList) {
        let scope = node;
        while (scope) {
            if (types.includes(scope.type)) {
                return scope;
            }
            scope = scope.parent;
        }
    }
    return node;
}
function limitScopeBySyntax() {
    return async (input, context) => {
        const { position, text, language, prefix, suffix } = context;
        if (!exports.supportedLanguages.includes(language)) {
            throw new Error(`Language ${language} is not supported`);
        }
        const languageConfig = parser_1.languagesConfigs[language];
        const parser = await (0, parser_1.getParser)(languageConfig);
        const updatedText = prefix + input + suffix;
        const updatedTree = parser.parse(updatedText);
        const lineBegin = findLineBegin(updatedText, position);
        const lineEnd = findLineEnd(updatedText, position);
        const scope = findScope(updatedTree.rootNode.namedDescendantForIndex(lineBegin, lineEnd), typeList_1.typeList[languageConfig] ?? []);
        if (scope.type == "ERROR") {
            throw new Error("Cannot determine syntax scope.");
        }
        if (scope.endIndex < position + input.length) {
            base_1.logger.debug({
                languageConfig,
                text,
                updatedText,
                position,
                lineBegin,
                lineEnd,
                scope: { type: scope.type, start: scope.startIndex, end: scope.endIndex },
            }, "Remove content out of syntax scope");
            return input.slice(0, scope.endIndex - position);
        }
        return input;
    };
}
exports.limitScopeBySyntax = limitScopeBySyntax;
//# sourceMappingURL=limitScopeBySyntax.js.map