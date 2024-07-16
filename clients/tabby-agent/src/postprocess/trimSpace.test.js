"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const trimSpace_1 = require("./trimSpace");
describe("postprocess", () => {
    describe("trimSpace", () => {
        it("should remove trailing space", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let foo = new ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                      ├Foo(); ┤
        `;
            const expected = (0, testUtils_1.inline) `
                      ├Foo();┤
      `;
            (0, chai_1.expect)((0, trimSpace_1.trimSpace)()(completion, context)).to.eq(expected);
        });
        it("should not remove trailing space if filling in line", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let foo = sum(║baz)
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                      ├bar, ┤
        `;
            (0, chai_1.expect)((0, trimSpace_1.trimSpace)()(completion, context)).to.eq(completion);
        });
        it("should remove trailing space if filling in line with suffix starts with space", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let foo = sum(║ baz)
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                      ├bar, ┤
        `;
            const expected = (0, testUtils_1.inline) `
                      ├bar,┤
        `;
            (0, chai_1.expect)((0, trimSpace_1.trimSpace)()(completion, context)).to.eq(expected);
        });
        it("should not remove leading space if current line is blank", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function sum(a, b) {
        ║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
        ├  return a + b;┤
        `;
            (0, chai_1.expect)((0, trimSpace_1.trimSpace)()(completion, context)).to.eq(completion);
        });
        it("should remove leading space if current line is not blank and ends with space", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let foo = ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                  ├ sum(bar, baz);┤
        `;
            const expected = (0, testUtils_1.inline) `
                  ├sum(bar, baz);┤
        `;
            (0, chai_1.expect)((0, trimSpace_1.trimSpace)()(completion, context)).to.eq(expected);
        });
    });
});
//# sourceMappingURL=trimSpace.test.js.map