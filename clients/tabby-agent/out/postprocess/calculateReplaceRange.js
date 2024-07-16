var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { isBrowser } from "../env";
import { logger } from "./base";
import { calculateReplaceRangeByBracketStack } from "./calculateReplaceRangeByBracketStack";
import { calculateReplaceRangeBySyntax } from "./calculateReplaceRangeBySyntax";
export function calculateReplaceRange(config) {
    return (choice, context) => __awaiter(this, void 0, void 0, function* () {
        const preferSyntaxParser = !isBrowser && // syntax parser is not supported in browser yet
            config.experimentalSyntax;
        if (preferSyntaxParser) {
            try {
                return yield calculateReplaceRangeBySyntax(choice, context);
            }
            catch (error) {
                logger.debug({ error }, "Failed to calculate replace range by syntax parser");
            }
        }
        return calculateReplaceRangeByBracketStack(choice, context);
    });
}
//# sourceMappingURL=calculateReplaceRange.js.map