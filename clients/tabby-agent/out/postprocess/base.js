var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { logger as getLogger } from "../logger";
import "../ArrayExt";
export const logger = getLogger("Postprocess");
export function applyFilter(filter, context) {
    return applyChoiceFilter((choice) => __awaiter(this, void 0, void 0, function* () {
        const replaceLength = context.position - choice.replaceRange.start;
        const input = choice.text.slice(replaceLength);
        const filtered = yield filter(input, context);
        choice.text = choice.text.slice(0, replaceLength) + (filtered !== null && filtered !== void 0 ? filtered : "");
        return choice;
    }), context);
}
export function applyChoiceFilter(choiceFilter, context) {
    return (response) => __awaiter(this, void 0, void 0, function* () {
        response.choices = (yield response.choices.mapAsync((choice) => __awaiter(this, void 0, void 0, function* () {
            return yield choiceFilter(choice, context);
        })))
            .filter((choice) => {
            // Filter out empty choices.
            return !!choice && !!choice.text;
        })
            .distinct((choice) => choice.text);
        return response;
    });
}
//# sourceMappingURL=base.js.map