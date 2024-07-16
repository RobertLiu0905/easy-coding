"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
if (!Array.prototype.distinct) {
    Array.prototype.distinct = function (identity) {
        return [...new Map(this.map((item) => [identity?.(item) ?? item, item])).values()];
    };
}
if (!Array.prototype.mapAsync) {
    Array.prototype.mapAsync = async function (callbackfn, thisArg) {
        return await Promise.all(this.map((item, index) => callbackfn.call(thisArg, item, index, this)));
    };
}
exports.default = {};
//# sourceMappingURL=ArrayExt.js.map