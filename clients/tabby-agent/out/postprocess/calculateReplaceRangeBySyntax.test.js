var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { expect } from "chai";
import { documentContext, inline } from "./testUtils";
import { calculateReplaceRangeBySyntax } from "./calculateReplaceRangeBySyntax";
describe("postprocess", () => {
    describe("calculateReplaceRangeBySyntax", () => {
        it("should handle auto closing quotes", () => __awaiter(void 0, void 0, void 0, function* () {
            const context = Object.assign(Object.assign({}, documentContext `
        const hello = "║"
        `), { language: "typescript" });
            const choice = {
                index: 0,
                text: inline `
                       ├hello";┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: inline `
                       ├hello";┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 1,
                },
            };
            expect(yield calculateReplaceRangeBySyntax(choice, context)).to.deep.equal(expected);
        }));
        it("should handle auto closing quotes", () => __awaiter(void 0, void 0, void 0, function* () {
            const context = Object.assign(Object.assign({}, documentContext `
        let htmlMarkup = \`║\`
        `), { language: "typescript" });
            const choice = {
                index: 0,
                text: inline `
                           ├<h1>\${message}</h1>\`;┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: inline `
                           ├<h1>\${message}</h1>\`;┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 1,
                },
            };
            expect(yield calculateReplaceRangeBySyntax(choice, context)).to.deep.equal(expected);
        }));
        it("should handle multiple auto closing brackets", () => __awaiter(void 0, void 0, void 0, function* () {
            const context = Object.assign(Object.assign({}, documentContext `
        process.on('data', (data) => {║})
        `), { language: "typescript" });
            const choice = {
                index: 0,
                text: inline `
                                      ├
          console.log(data);
        });┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: inline `
                                      ├
          console.log(data);
        });┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 2,
                },
            };
            expect(yield calculateReplaceRangeBySyntax(choice, context)).to.deep.equal(expected);
        }));
        it("should handle multiple auto closing brackets", () => __awaiter(void 0, void 0, void 0, function* () {
            const context = Object.assign(Object.assign({}, documentContext `
        let mat: number[][][] = [[[║]]]
        `), { language: "typescript" });
            const choice = {
                index: 0,
                text: inline `
                                   ├1, 2], [3, 4]], [[5, 6], [7, 8]]];┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: inline `
                                   ├1, 2], [3, 4]], [[5, 6], [7, 8]]];┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 3,
                },
            };
            expect(yield calculateReplaceRangeBySyntax(choice, context)).to.deep.equal(expected);
        }));
        it("should handle the bad case of calculateReplaceRangeByBracketStack", () => __awaiter(void 0, void 0, void 0, function* () {
            const context = Object.assign(Object.assign({}, documentContext `
      function clamp(n: number, max: number, min: number): number {
        return Math.max(Math.min(║);
      }
      `), { language: "typescript" });
            const choice = {
                index: 0,
                text: inline `
                                 ├n, max), min┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: inline `
                                 ├n, max), min┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            expect(yield calculateReplaceRangeBySyntax(choice, context)).to.deep.equal(expected);
        }));
    });
});
//# sourceMappingURL=calculateReplaceRangeBySyntax.test.js.map