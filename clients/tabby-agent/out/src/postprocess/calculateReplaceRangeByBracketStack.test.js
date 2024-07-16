"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const calculateReplaceRangeByBracketStack_1 = require("./calculateReplaceRangeByBracketStack");
describe("postprocess", () => {
    describe("calculateReplaceRangeByBracketStack", () => {
        it("should handle auto closing quotes", () => {
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
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).to.deep.equal(expected);
        });
        it("should handle auto closing quotes", () => {
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
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).to.deep.equal(expected);
        });
        it("should handle multiple auto closing brackets", () => {
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
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).to.deep.equal(expected);
        });
        it("should handle multiple auto closing brackets", () => {
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
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).to.deep.equal(expected);
        });
        it("should handle html tags", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        <html></h║>
        `,
                language: "html",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
                 ├tml>┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: (0, testUtils_1.inline) `
                 ├tml>┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 1,
                },
            };
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).to.deep.equal(expected);
        });
        it("should handle jsx tags", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        root.render(
          <React.StrictMode>
            <App m║/>
          </React.StrictMode>
        );
        `,
                language: "javascriptreact",
            };
            const choice = {
                index: 0,
                text: (0, testUtils_1.inline) `
                  ├essage={message} />┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position,
                },
            };
            const expected = {
                index: 0,
                text: (0, testUtils_1.inline) `
                  ├essage={message} />┤
        `,
                replaceRange: {
                    start: context.position,
                    end: context.position + 2,
                },
            };
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).to.deep.equal(expected);
        });
    });
    describe("calculateReplaceRangeByBracketStack: bad cases", () => {
        it("cannot handle the case of completion bracket stack is same with suffix but should not be replaced", () => {
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
            (0, chai_1.expect)((0, calculateReplaceRangeByBracketStack_1.calculateReplaceRangeByBracketStack)(choice, context)).not.to.deep.equal(expected);
        });
    });
});
//# sourceMappingURL=calculateReplaceRangeByBracketStack.test.js.map