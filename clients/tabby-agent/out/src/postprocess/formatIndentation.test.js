"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const formatIndentation_1 = require("./formatIndentation");
describe("postprocess", () => {
    describe("formatIndentation", () => {
        it("should format indentation if first line of completion is over indented.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function clamp(n: number, max: number, min: number): number {
          ║
        }
        `,
                indentation: "  ",
                language: "typescript",
            };
            const completion = (0, testUtils_1.inline) `
          ├  return Math.max(Math.min(n, max), min);┤
      `;
            const expected = (0, testUtils_1.inline) `
          ├return Math.max(Math.min(n, max), min);┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(expected);
        });
        it("should format indentation if first line of completion is wrongly indented.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        function clamp(n: number, max: number, min: number): number {
        ║
        }
        `,
                indentation: "    ",
                language: "typescript",
            };
            const completion = (0, testUtils_1.inline) `
        ├  return Math.max(Math.min(n, max), min);┤
      `;
            const expected = (0, testUtils_1.inline) `
        ├    return Math.max(Math.min(n, max), min);┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(expected);
        });
        it("should format indentation if completion lines is over indented.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def findMax(arr):║
        `,
                indentation: "  ",
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                         ├
            max = arr[0]
            for i in range(1, len(arr)):
                if arr[i] > max:
                    max = arr[i]
            return max
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                         ├
          max = arr[0]
          for i in range(1, len(arr)):
            if arr[i] > max:
              max = arr[i]
          return max
        }┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(expected);
        });
        it("should format indentation if completion lines is wrongly indented.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def findMax(arr):║
        `,
                indentation: "    ",
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                         ├
          max = arr[0]
          for i in range(1, len(arr)):
            if arr[i] > max:
              max = arr[i]
          return max
        }┤
      `;
            const expected = (0, testUtils_1.inline) `
                         ├
            max = arr[0]
            for i in range(1, len(arr)):
                if arr[i] > max:
                    max = arr[i]
            return max
        }┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(expected);
        });
        it("should keep it unchanged if it no indentation specified.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def findMax(arr):║
        `,
                indentation: undefined,
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                          ├
            max = arr[0]
            for i in range(1, len(arr)):
                if arr[i] > max:
                    max = arr[i]
            return max
        }┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(completion);
        });
        it("should keep it unchanged if there is indentation in the context.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def hello():
            return "world"

        def findMax(arr):║
        `,
                indentation: "\t",
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                          ├
            max = arr[0]
            for i in range(1, len(arr)):
                if arr[i] > max:
                    max = arr[i]
            return max
        }┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(completion);
        });
        it("should keep it unchanged if it is well indented.", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        def findMax(arr):║
        `,
                indentation: "    ",
                language: "python",
            };
            const completion = (0, testUtils_1.inline) `
                          ├
            max = arr[0]
            for i in range(1, len(arr)):
                if arr[i] > max:
                    max = arr[i]
            return max
        }┤
      `;
            (0, chai_1.expect)((0, formatIndentation_1.formatIndentation)()(completion, context)).to.eq(completion);
        });
    });
});
//# sourceMappingURL=formatIndentation.test.js.map