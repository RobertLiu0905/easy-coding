"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const calculateReplaceRangeBySyntax_1 = require("./calculateReplaceRangeBySyntax");
describe("postprocess", () => {
    describe("calculateReplaceRangeBySyntax", () => {
        it("should handle auto closing quotes", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        const hello = "║"
        `,
                language: "typescript",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
                       ├hello";┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: (0, testUtils_1.inline) `
                       ├hello";┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 1,
                },
            };
            (0, chai_1.expect)(await (0, calculateReplaceRangeBySyntax_1.calculateReplaceRangeBySyntax)(choice, context)).to.deep.equal(expected);
        });
        it("should handle auto closing quotes", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let htmlMarkup = \`║\`
        `,
                language: "typescript",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
                           ├<h1>\${message}</h1>\`;┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: (0, testUtils_1.inline) `
                           ├<h1>\${message}</h1>\`;┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 1,
                },
            };
            (0, chai_1.expect)(await (0, calculateReplaceRangeBySyntax_1.calculateReplaceRangeBySyntax)(choice, context)).to.deep.equal(expected);
        });
        it("should handle multiple auto closing brackets", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        process.on('data', (data) => {║})
        `,
                language: "typescript",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
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
                text: (0, testUtils_1.inline) `
                                      ├
          console.log(data);
        });┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 2,
                },
            };
            (0, chai_1.expect)(await (0, calculateReplaceRangeBySyntax_1.calculateReplaceRangeBySyntax)(choice, context)).to.deep.equal(expected);
        });
        it("should handle multiple auto closing brackets", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let mat: number[][][] = [[[║]]]
        `,
                language: "typescript",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
                                   ├1, 2], [3, 4]], [[5, 6], [7, 8]]];┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: (0, testUtils_1.inline) `
                                   ├1, 2], [3, 4]], [[5, 6], [7, 8]]];┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 3,
                },
            };
            (0, chai_1.expect)(await (0, calculateReplaceRangeBySyntax_1.calculateReplaceRangeBySyntax)(choice, context)).to.deep.equal(expected);
        });
        it("should handle the bad case of calculateReplaceRangeByBracketStack", async () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
      function clamp(n: number, max: number, min: number): number {
        return Math.max(Math.min(║);
      }
      `,
                language: "typescript",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
                                 ├n, max), min┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: (0, testUtils_1.inline) `
                                 ├n, max), min┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            (0, chai_1.expect)(await (0, calculateReplaceRangeBySyntax_1.calculateReplaceRangeBySyntax)(choice, context)).to.deep.equal(expected);
        });
    });
});
//# sourceMappingURL=calculateReplaceRangeBySyntax.test.js.map