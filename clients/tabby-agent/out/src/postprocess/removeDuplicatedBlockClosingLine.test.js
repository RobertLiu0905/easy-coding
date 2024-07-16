"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const removeDuplicatedBlockClosingLine_1 = require("./removeDuplicatedBlockClosingLine");
describe("postprocess", () => {
    describe("removeDuplicatedBlockClosingLine", () => {
        it("should remove duplicated block closing line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function hello() {
          ║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
          ├console.log("hello");
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
          ├console.log("hello");┤
        ┴┴
      `;
            (0, chai_1.expect)((0, removeDuplicatedBlockClosingLine_1.removeDuplicatedBlockClosingLine)()(completion, context)).to.eq(expected);
        });
        it("should remove duplicated block closing line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function check(condition) {
          if (!condition) {
            ║
          } else {
            return;
          }
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
            ├throw new Error("check not passed");
          }┤
        ┴┴
      `;
            const expected = (0, testUtils_1.inline) `
            ├throw new Error("check not passed");┤
        ┴┴┴┴
      `;
            (0, chai_1.expect)((0, removeDuplicatedBlockClosingLine_1.removeDuplicatedBlockClosingLine)()(completion, context)).to.eq(expected);
        });
        it("should not remove non-duplicated block closing line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function check(condition) {
          if (!condition) {
            ║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
            ├throw new Error("check not passed");
          }┤
        ┴┴
      `;
            (0, chai_1.expect)((0, removeDuplicatedBlockClosingLine_1.removeDuplicatedBlockClosingLine)()(completion, context)).to.eq(completion);
        });
    });
});
//# sourceMappingURL=removeDuplicatedBlockClosingLine.test.js.map