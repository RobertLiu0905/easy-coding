var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
if (!Array.prototype.distinct) {
    Array.prototype.distinct = function (identity) {
        return [...new Map(this.map((item) => { var _a; return [(_a = identity === null || identity === void 0 ? void 0 : identity(item)) !== null && _a !== void 0 ? _a : item, item]; })).values()];
    };
}
if (!Array.prototype.mapAsync) {
    Array.prototype.mapAsync = function (callbackfn, thisArg) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield Promise.all(this.map((item, index) => callbackfn.call(thisArg, item, index, this)));
        });
    };
}
export default {};
//# sourceMappingURL=ArrayExt.js.map