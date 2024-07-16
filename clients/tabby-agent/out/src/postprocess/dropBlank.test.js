"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const dropBlank_1 = require("./dropBlank");
const testUtils_1 = require("./testUtils");
describe("postprocess", () => {
    describe("dropBlank", () => {
        const dummyContext = {
            ...(0, testUtils_1.documentContext) `
      dummy║
      `,
            language: "plaintext",
        };
        it("should return null if input is blank", () => {
            (0, chai_1.expect)((0, dropBlank_1.dropBlank)()("\n", dummyContext)).to.be.null;
            (0, chai_1.expect)((0, dropBlank_1.dropBlank)()("\t\n", dummyContext)).to.be.null;
        });
        it("should keep unchanged if input is not blank", () => {
            (0, chai_1.expect)((0, dropBlank_1.dropBlank)()("Not blank", dummyContext)).to.eq("Not blank");
        });
    });
});
//# sourceMappingURL=dropBlank.test.js.map