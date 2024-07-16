"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const removeRepetitiveLines_1 = require("./removeRepetitiveLines");
describe("postprocess", () => {
    describe("removeRepetitiveLines", () => {
        it("should remove repetitive lines", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function hello() {
          console.log("hello");
        }
        hello();
        hello();
        ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
        ├hello();
        hello();
        hello();
        hello();
        hello();
        hello();
        hello();
        hello();
        hello();
        hello();┤
        `;
            const expected = (0, testUtils_1.inline) `
        ├hello();┤
      `;
            (0, chai_1.expect)((0, removeRepetitiveLines_1.removeRepetitiveLines)()(completion, context)).to.eq(expected);
        });
        it("should remove repetitive lines with patterns", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        const a = 1;
        ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
        ├const b = 1;
        const c = 1;
        const d = 1;
        const e = 1;
        const f = 1;
        const g = 1;
        const h = 1;
        const i = 1;
        const j = 1;
        const k =┤`;
            const expected = (0, testUtils_1.inline) `
        ├const b = 1;┤
        `;
            (0, chai_1.expect)((0, removeRepetitiveLines_1.removeRepetitiveLines)()(completion, context)).to.eq(expected);
        });
    });
});
//# sourceMappingURL=removeRepetitiveLines.test.js.map