"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const removeLineEndsWithRepetition_1 = require("./removeLineEndsWithRepetition");
describe("postprocess", () => {
    describe("removeLineEndsWithRepetition", () => {
        it("should drop one line completion ends with repetition", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let foo = ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                  ├foo = foo = foo = foo = foo = foo = foo =┤
        `;
            (0, chai_1.expect)((0, removeLineEndsWithRepetition_1.removeLineEndsWithRepetition)()(completion, context)).to.be.null;
        });
        it("should remove last line that ends with repetition", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let largeNumber = 1000000
        let veryLargeNumber = ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                              ├1000000000
        let superLargeNumber = 1000000000000000000000000000000000000000000000┤
        `;
            const expected = (0, testUtils_1.inline) `
                              ├1000000000┤
        `;
            (0, chai_1.expect)((0, removeLineEndsWithRepetition_1.removeLineEndsWithRepetition)()(completion, context)).to.eq(expected);
        });
        it("should keep repetition less than threshold", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let largeNumber = 1000000
        let veryLargeNumber = ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                              ├1000000000000┤
        `;
            const expected = completion;
            (0, chai_1.expect)((0, removeLineEndsWithRepetition_1.removeLineEndsWithRepetition)()(completion, context)).to.eq(expected);
        });
    });
});
//# sourceMappingURL=removeLineEndsWithRepetition.test.js.map