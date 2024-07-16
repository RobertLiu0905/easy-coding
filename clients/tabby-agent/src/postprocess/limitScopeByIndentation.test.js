"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const limitScopeByIndentation_1 = require("./limitScopeByIndentation");
describe("postprocess", () => {
    describe("limitScopeByIndentation: default config", () => {
        const limitScopeByIndentationDefault = (0, limitScopeByIndentation_1.limitScopeByIndentation)({
            experimentalKeepBlockScopeWhenCompletingLine: false,
        });
        it("should limit scope at sentence end, when completion is continuing uncompleted sentence in the prefix.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let a =║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
               ├ 1;
        let b = 2;┤
      `;
            const expected = (0, testUtils_1.inline) `
               ├ 1;┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(expected);
        });
        it("should limit scope at sentence end, when completion is continuing uncompleted sentence in the prefix.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function safeParse(json) {
          try {
            console.log║
          } catch (error) {
            console.error(error);
            return null;
          }
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                        ├("Parsing", { json });
            return JSON.parse(json);
          } catch (e) {
            return null;
          }
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                        ├("Parsing", { json });┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(expected);
        });
        it("should limit scope at next indent level, including closing line, when completion is starting a new indent level in next line.", () => {
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
        }
        console.log(findMax([1, 2, 3, 4, 5]));┤
      `;
            const expected = (0, testUtils_1.inline) `
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
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(expected);
        });
        it("should limit scope at next indent level, including closing line, when completion is continuing uncompleted sentence in the prefix, and starting a new indent level in next line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {
          let max = arr[0];
          for║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
             ├ (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }
        console.log(findMax([1, 2, 3, 4, 5]));┤
      `;
            const expected = (0, testUtils_1.inline) `
             ├ (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }┤
        ┴┴
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(expected);
        });
        it("should limit scope at current indent level, including closing line, when completion starts new sentences at same indent level.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {
          let max = arr[0];║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                           ├
          for (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(completion);
        });
        it("should allow only one level closing bracket", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function safeParse(json) {
          try {
            return JSON.parse(json);
          } catch (e) {
            return null;║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                        ├
          }
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                        ├
          }┤
        ┴┴
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(expected);
        });
        it("should allow level closing bracket at current line, it looks same as starts new sentences", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function helloworld() {
          console.log("hello");
          ║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
          ├}┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.be.eq(completion);
        });
        it("should not allow level closing bracket, when the suffix lines have same indent level", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function helloworld() {
          console.log("hello");║
          console.log("world");
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                               ├
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                               ├┤`;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.be.eq(expected);
        });
        it("should use indent level of previous line, when current line is empty.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function safeParse(json) {
          try {
            ║
          }
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
            ├return JSON.parse(json);
          } catch (e) {
            return null;
          }
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
            ├return JSON.parse(json);
          } catch (e) {
            return null;
          }┤
        ┴┴
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).to.eq(expected);
        });
    });
    describe("limitScopeByIndentation: bad cases", () => {
        const limitScopeByIndentationDefault = (0, limitScopeByIndentation_1.limitScopeByIndentation)({
            experimentalKeepBlockScopeWhenCompletingLine: false,
        });
        it("cannot handle the case of indent that does'nt have a close line, e.g. chaining call", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function sortWords(input) {
          const output = input.trim()
            .split("\n")
            .map((line) => line.split(" "))
            ║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
            ├.flat()
            .sort()
            .join(" ");
          console.log(output);
          return output;
        }
        sortWords("world hello");┤
      `;
            const expected = (0, testUtils_1.inline) `
            ├.flat()
            .sort()
            .join(" ");
          console.log(output);
          return output;
        }┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).not.to.eq(expected);
        });
        it("cannot handle the case of indent that does'nt have a close line, e.g. python def function", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def findMax(arr):
          ║
        `,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
          ├max = arr[0]
          for i in range(1, len(arr)):
            if arr[i] > max:
              max = arr[i]
          return max
        findMax([1, 2, 3, 4, 5])┤
      `;
            const expected = (0, testUtils_1.inline) `
          ├max = arr[0]
          for i in range(1, len(arr)):
            if arr[i] > max:
              max = arr[i]
          return max┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationDefault(completion, context)).not.to.eq(expected);
        });
    });
    describe("limitScopeByIndentation: with experimentalKeepBlockScopeWhenCompletingLine on", () => {
        const limitScopeByIndentationKeepBlock = (0, limitScopeByIndentation_1.limitScopeByIndentation)({
            experimentalKeepBlockScopeWhenCompletingLine: true,
        });
        it("should limit scope at block end, when completion is continuing uncompleted sentence in the prefix.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let a =║
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
               ├ 1;
        let b = 2;┤
      `;
            (0, chai_1.expect)(limitScopeByIndentationKeepBlock(completion, context)).to.eq(completion);
        });
        it("should limit scope at block end, when completion is continuing uncompleted sentence in the prefix.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function safeParse(json) {
          try {
            console.log║
          }
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
                        ├("Parsing", { json });
            return JSON.parse(json);
          } catch (e) {
            return null;
          }
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                        ├("Parsing", { json });
            return JSON.parse(json);
          } catch (e) {
            return null;
          }┤
        ┴┴
      `;
            (0, chai_1.expect)(limitScopeByIndentationKeepBlock(completion, context)).to.eq(expected);
        });
        it("should limit scope at same indent level, including closing line, when completion is continuing uncompleted sentence in the prefix, and starting a new indent level in next line.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function findMax(arr) {
          let max = arr[0];
          for║
        }
        `,
                language: "javascript",
            };
            const completion = (0, testUtils_1.inline) `
             ├ (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }
        console.log(findMax([1, 2, 3, 4, 5]));┤
      `;
            const expected = (0, testUtils_1.inline) `
             ├ (let i = 1; i < arr.length; i++) {
            if (arr[i] > max) {
              max = arr[i];
            }
          }
          return max;
        }┤
        ┴┴
      `;
            (0, chai_1.expect)(limitScopeByIndentationKeepBlock(completion, context)).to.eq(expected);
        });
    });
});
//# sourceMappingURL=limitScopeByIndentation.test.js.map