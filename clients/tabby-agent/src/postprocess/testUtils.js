"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.inline = exports.documentContext = void 0;
const dedent_1 = __importDefault(require("dedent"));
const uuid_1 = require("uuid");
const CompletionContext_1 = require("../CompletionContext");
// `║` is the cursor position
function documentContext(literals, ...placeholders) {
    const doc = (0, dedent_1.default)(literals, ...placeholders);
    return new CompletionContext_1.CompletionContext({
        filepath: (0, uuid_1.v4)(),
        language: "",
        text: doc.replace(/║/, ""),
        position: doc.indexOf("║"),
    });
}
exports.documentContext = documentContext;
// `├` start of the inline completion to insert
// `┤` end of the inline completion to insert
// `┴` use for indent placeholder, should be placed at last line after `┤`
function inline(literals, ...placeholders) {
    const inline = (0, dedent_1.default)(literals, ...placeholders);
    return inline.slice(inline.indexOf("├") + 1, inline.lastIndexOf("┤"));
}
exports.inline = inline;
//# sourceMappingURL=testUtils.js.map