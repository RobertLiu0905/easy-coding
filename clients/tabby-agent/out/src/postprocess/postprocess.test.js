"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const path_1 = __importDefault(require("path"));
const fs_extra_1 = __importDefault(require("fs-extra"));
const uuid_1 = require("uuid");
const toml_1 = __importDefault(require("toml"));
const glob_1 = __importDefault(require("glob"));
const chai_1 = require("chai");
const deepmerge_ts_1 = require("deepmerge-ts");
const AgentConfig_1 = require("../AgentConfig");
const CompletionContext_1 = require("../CompletionContext");
const _1 = require(".");
function parseDocContext(text) {
    const insertStart = text.indexOf("├");
    const insertEnd = text.lastIndexOf("┤");
    let replaceStart = text.indexOf("╠");
    if (replaceStart < 0) {
        replaceStart = insertStart;
    }
    let replaceEnd = text.lastIndexOf("╣");
    if (replaceEnd < 0) {
        replaceEnd = insertEnd;
    }
    return {
        prefix: text.slice(0, replaceStart),
        prefixReplaceRange: text.slice(replaceStart + 1, insertStart),
        completion: text.slice(insertStart + 1, insertEnd),
        suffixReplaceRange: text.slice(insertEnd + 1, replaceEnd),
        suffix: text.slice(replaceEnd + 1),
    };
}
function getDoc(context) {
    return context.prefix + context.prefixReplaceRange + context.suffixReplaceRange + context.suffix;
}
function getPosition(context) {
    return context.prefix.length + context.prefixReplaceRange.length;
}
function getCompletion(context) {
    return context.prefixReplaceRange + context.completion;
}
function getReplaceRange(context) {
    return {
        start: context.prefix.length,
        end: context.prefix.length + context.prefixReplaceRange.length + context.suffixReplaceRange.length,
    };
}
function buildChoices(context) {
    const text = getCompletion(context);
    if (text.length === 0) {
        return [];
    }
    return [
        {
            index: 0,
            text,
            replaceRange: getReplaceRange(context),
        },
    ];
}
describe("postprocess golden test", () => {
    const postprocess = async (context, config, response) => {
        let processed = await (0, _1.preCacheProcess)(context, config, response);
        processed = await (0, _1.postCacheProcess)(context, config, processed);
        return processed;
    };
    const files = glob_1.default.sync(path_1.default.join(__dirname, "golden/**/*.toml"));
    files.sort().forEach((file) => {
        const fileContent = fs_extra_1.default.readFileSync(file, "utf8");
        const testCase = toml_1.default.parse(fileContent);
        it(testCase["description"] ?? file, async () => {
            const config = (0, deepmerge_ts_1.deepmerge)(AgentConfig_1.defaultAgentConfig["postprocess"], testCase["config"] ?? {});
            const docContext = parseDocContext(testCase["context"]?.["text"] ?? "");
            const completionContext = new CompletionContext_1.CompletionContext({
                filepath: testCase["context"]?.["filepath"] ?? (0, uuid_1.v4)(),
                language: testCase["context"]?.["language"] ?? "plaintext",
                text: getDoc(docContext),
                position: getPosition(docContext),
                indentation: testCase["context"]?.["indentation"],
            });
            const completionId = "test-" + (0, uuid_1.v4)();
            const completionResponse = {
                id: completionId,
                choices: buildChoices(docContext),
            };
            const unchanged = JSON.parse(JSON.stringify(completionResponse));
            const output = await postprocess(completionContext, config, completionResponse);
            const checkExpected = (expected) => {
                if (testCase["expected"]?.["notEqual"]) {
                    (0, chai_1.expect)(output).to.not.deep.equal(expected);
                }
                else {
                    (0, chai_1.expect)(output).to.deep.equal(expected);
                }
            };
            if (testCase["expected"]?.["unchanged"]) {
                checkExpected(unchanged);
            }
            else if (testCase["expected"]?.["discard"]) {
                const expected = {
                    id: completionId,
                    choices: [],
                };
                checkExpected(expected);
            }
            else {
                const expectedContext = parseDocContext(testCase["expected"]?.["text"] ?? "");
                const expected = {
                    id: completionId,
                    choices: buildChoices(expectedContext),
                };
                checkExpected(expected);
            }
        });
    });
});
//# sourceMappingURL=postprocess.test.js.map