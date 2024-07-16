"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.dropBlank = void 0;
const utils_1 = require("../utils");
function dropBlank() {
    return (input) => {
        return (0, utils_1.isBlank)(input) ? null : input;
    };
}
exports.dropBlank = dropBlank;
//# sourceMappingURL=dropBlank.js.map