"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testLogDebug = exports.isTest = exports.isBrowser = void 0;
// FIXME: refactor env variables for running tests
exports.isBrowser = !!process.env["IS_BROWSER"];
exports.isTest = !!process.env["IS_TEST"];
exports.testLogDebug = !!process.env["TEST_LOG_DEBUG"];
//# sourceMappingURL=env.js.map