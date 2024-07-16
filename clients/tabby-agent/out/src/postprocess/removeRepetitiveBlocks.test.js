"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const removeRepetitiveBlocks_1 = require("./removeRepetitiveBlocks");
describe("postprocess", () => {
    describe("removeRepetitiveBlocks", () => {
        it("should remove repetitive blocks", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function myFuncA() {
          console.log("myFuncA called.");
        }

        ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
        ├function myFuncB() {
          console.log("myFuncB called.");
        }

        function myFuncC() {
          console.log("myFuncC called.");
        }

        function myFuncD() {
          console.log("myFuncD called.");
        }

        function myFuncE() {
          console.log("myFuncE called.");
        }

        function myFuncF() {
          console.log("myFuncF called.");
        }

        function myFuncG() {
          console.log("myFuncG called.");
        }

        function myFuncH() {
          console.log("myFuncH ┤
        `;
            const expected = (0, testUtils_1.inline) `
        ├function myFuncB() {
          console.log("myFuncB called.");
        }┤
      `;
            (0, chai_1.expect)((0, removeRepetitiveBlocks_1.removeRepetitiveBlocks)()(completion, context)).to.eq(expected);
        });
    });
});
//# sourceMappingURL=removeRepetitiveBlocks.test.js.map