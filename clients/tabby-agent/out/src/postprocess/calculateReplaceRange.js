"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateReplaceRange = void 0;
const env_1 = require("../env");
const base_1 = require("./base");
const calculateReplaceRangeByBracketStack_1 = require("./calculateReplaceRangeByBracketStack");
const calculateReplaceRangeBySyntax_1 = require("./calculateReplaceRangeBySyntax");
function calculateReplaceRange(config) {
    return async (choice, context) => {
        const preferSyntaxParser = !env_1.isBrowser && // syntax parser is not supported in browser yet
            config.experimentalSyntax;
        if (preferSyntaxParser) {
            try {
                return await (0, calculateReplaceRangeBySyntax_1.calculateReplaceRangeBySyntax)(choice, context);
            }
            catch (error) {
                base_1.logger.debug({ error }, "Failed to calculate replace range by syntax parser");
            }
        }
        return (0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context);
    };
}
exports.calculateReplaceRange = calculateReplaceRange;
//# sourceMappingURL=calculateReplaceRange.js.map