"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.trimSpace = void 0;
const utils_1 = require("../utils");
function trimSpace() {
    return (input, context) => {
        const { currentLinePrefix, currentLineSuffix } = context;
        let trimmedInput = input;
        if (!(0, utils_1.isBlank)(currentLinePrefix) && currentLinePrefix.match(/\s$/)) {
            trimmedInput = trimmedInput.trimStart();
        }
        if ((0, utils_1.isBlank)(currentLineSuffix) || (!(0, utils_1.isBlank)(currentLineSuffix) && currentLineSuffix.match(/^\s/))) {
            trimmedInput = trimmedInput.trimEnd();
        }
        return trimmedInput;
    };
}
exports.trimSpace = trimSpace;
//# sourceMappingURL=trimSpace.js.map