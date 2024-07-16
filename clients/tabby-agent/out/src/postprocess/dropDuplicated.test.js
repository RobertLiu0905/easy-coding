"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const testUtils_1 = require("./testUtils");
const dropDuplicated_1 = require("./dropDuplicated");
describe("postprocess", () => {
    describe("dropDuplicated", () => {
        it("should drop completion duplicated with suffix", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let sum = (a, b) => {
          ║return a + b;
        };
        `,
                language: "javascript",
            };
            // completion give a `;` at end but context have not
            const completion = (0, testUtils_1.inline) `
          ├return a + b;┤
      `;
            (0, chai_1.expect)((0, dropDuplicated_1.dropDuplicated)()(completion, context)).to.be.null;
        });
        it("should drop completion similar to suffix", () => {
            const context = {
                ...(0, testUtils_1.documentContext) `
        let sum = (a, b) => {
          return a + b;
          ║
        };
        `,
                language: "javascript",
            };
            // the difference is a `\n`
            const completion = (0, testUtils_1.inline) `
          ├}┤
      `;
            (0, chai_1.expect)((0, dropDuplicated_1.dropDuplicated)()(completion, context)).to.be.null;
        });
    });
});
//# sourceMappingURL=dropDuplicated.test.js.map