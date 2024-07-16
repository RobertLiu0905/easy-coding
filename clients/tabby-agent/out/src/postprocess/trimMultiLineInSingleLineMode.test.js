"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const trimMultiLineInSingleLineMode_1 = require("./trimMultiLineInSingleLineMode");
describe("postprocess", () => {
    describe("trimMultiLineInSingleLineMode", () => {
        it("should trim multiline completions, when the suffix have non-auto-closed chars in the current line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let error = new Error("Something went wrong");
        console.log(║message);
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                    ├message);
        throw error;┤
      `;
            (0, chai_1.expect)((0, trimMultiLineInSingleLineMode_1.trimMultiLineInSingleLineMode)()(completion, context)).to.be.null;
        });
        it("should trim multiline completions, when the suffix have non-auto-closed chars in the current line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let error = new Error("Something went wrong");
        console.log(║message);
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                    ├error, message);
        throw error;┤
      `;
            const expected = (0, testUtils_1.inline) `
                    ├error, ┤
      `;
            (0, chai_1.expect)((0, trimMultiLineInSingleLineMode_1.trimMultiLineInSingleLineMode)()(completion, context)).to.eq(expected);
        });
        it("should allow singleline completions, when the suffix have non-auto-closed chars in the current line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let error = new Error("Something went wrong");
        console.log(║message);
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                    ├error, ┤
      `;
            (0, chai_1.expect)((0, trimMultiLineInSingleLineMode_1.trimMultiLineInSingleLineMode)()(completion, context)).to.eq(completion);
        });
        it("should allow multiline completions, when the suffix only have auto-closed chars that will be replaced in the current line, such as `)]}`.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {║}
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                               ├
          let max = arr[0];
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }┤
      `;
            (0, chai_1.expect)((0, trimMultiLineInSingleLineMode_1.trimMultiLineInSingleLineMode)()(completion, context)).to.eq(completion);
        });
    });
});
//# sourceMappingURL=trimMultiLineInSingleLineMode.test.js.map