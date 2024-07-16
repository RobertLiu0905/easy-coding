"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.applyChoiceFilter = exports.applyFilter = exports.logger = void 0;
const logger_1 = require("../logger");
require("../ArrayExt");
exports.logger = (0, logger_1.logger)("Postprocess");
function applyFilter(filter, context) {
    return applyChoiceFilter(async (choice) => {
        const replaceLength = context.position - choice.replaceRange.start;
        const input = choice.text.slice(replaceLength);
        const filtered = await filter(input, context);
        choice.text = choice.text.slice(0, replaceLength) + (filtered ?? "");
        return choice;
    }, context);
}
exports.applyFilter = applyFilter;
function applyChoiceFilter(choiceFilter, context) {
    return async (response) => {
        response.choices = (await response.choices.mapAsync(async (choice) => {
            return await choiceFilter(choice, context);
        }))
            .filter((choice) => {
            // Filter out empty choices.
            return !!choice && !!choice.text;
        })
            .distinct((choice) => choice.text);
        return response;
    };
}
exports.applyChoiceFilter = applyChoiceFilter;
//# sourceMappingURL=base.js.map