var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { applyFilter, applyChoiceFilter } from "./base";
import { removeRepetitiveBlocks } from "./removeRepetitiveBlocks";
import { removeRepetitiveLines } from "./removeRepetitiveLines";
import { removeLineEndsWithRepetition } from "./removeLineEndsWithRepetition";
import { removeDuplicatedBlockClosingLine } from "./removeDuplicatedBlockClosingLine";
import { limitScope } from "./limitScope";
import { formatIndentation } from "./formatIndentation";
import { trimSpace } from "./trimSpace";
import { trimMultiLineInSingleLineMode } from "./trimMultiLineInSingleLineMode";
import { dropDuplicated } from "./dropDuplicated";
import { dropBlank } from "./dropBlank";
import { calculateReplaceRange } from "./calculateReplaceRange";
export function preCacheProcess(context, _, response) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(response)
            .then(applyFilter(trimMultiLineInSingleLineMode(), context))
            .then(applyFilter(removeLineEndsWithRepetition(), context))
            .then(applyFilter(dropDuplicated(), context))
            .then(applyFilter(trimSpace(), context))
            .then(applyFilter(dropBlank(), context));
    });
}
export function postCacheProcess(context, config, response) {
    return __awaiter(this, void 0, void 0, function* () {
        return Promise.resolve(response)
            .then(applyFilter(removeRepetitiveBlocks(), context))
            .then(applyFilter(removeRepetitiveLines(), context))
            .then(applyFilter(limitScope(config["limitScope"]), context))
            .then(applyFilter(removeDuplicatedBlockClosingLine(), context))
            .then(applyFilter(formatIndentation(), context))
            .then(applyFilter(dropDuplicated(), context))
            .then(applyFilter(trimSpace(), context))
            .then(applyFilter(dropBlank(), context))
            .then(applyChoiceFilter(calculateReplaceRange(config["calculateReplaceRange"]), context));
    });
}
//# sourceMappingURL=index.js.map