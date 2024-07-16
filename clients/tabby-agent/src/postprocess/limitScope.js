"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.limitScope = void 0;
const env_1 = require("../env");
const base_1 = require("./base");
const limitScopeByIndentation_1 = require("./limitScopeByIndentation");
const limitScopeBySyntax_1 = require("./limitScopeBySyntax");
function limitScope(config) {
    return async (input, context) => {
        const preferSyntaxParser = !env_1.isBrowser && // syntax parser is not supported in browser yet
            config.experimentalSyntax;
        if (preferSyntaxParser) {
            try {
                return await (0, limitScopeBySyntax_1.limitScopeBySyntax)()(input, context);
            }
            catch (error) {
                base_1.logger.debug({ error }, "Failed to limit scope by syntax parser");
            }
        }
        return (0, limitScopeByIndentation_1.limitScopeByIndentation)(config["indentation"])(input, context);
    };
}
exports.limitScope = limitScope;
//# sourceMappingURL=limitScope.js.map