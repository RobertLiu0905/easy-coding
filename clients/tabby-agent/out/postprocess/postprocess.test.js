var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import path from "path";
import fs from "fs-extra";
import { v4 as uuid } from "uuid";
import toml from "toml";
import glob from "glob";
import { expect } from "chai";
import { deepmerge } from "deepmerge-ts";
import { defaultAgentConfig } from "../AgentConfig";
import { CompletionContext } from "../CompletionContext";
import { preCacheProcess, postCacheProcess } from ".";
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
    const postprocess = (context, config, response) => __awaiter(void 0, void 0, void 0, function* () {
        let processed = yield preCacheProcess(context, config, response);
        processed = yield postCacheProcess(context, config, processed);
        return processed;
    });
    const files = glob.sync(path.join(__dirname, "golden/**/*.toml"));
    files.sort().forEach((file) => {
        var _a;
        const fileContent = fs.readFileSync(file, "utf8");
        const testCase = toml.parse(fileContent);
        it((_a = testCase["description"]) !== null && _a !== void 0 ? _a : file, () => __awaiter(void 0, void 0, void 0, function* () {
            var _b, _c, _d, _e, _f, _g, _h, _j, _k, _l, _m, _o;
            const config = deepmerge(defaultAgentConfig["postprocess"], (_b = testCase["config"]) !== null && _b !== void 0 ? _b : {});
            const docContext = parseDocContext((_d = (_c = testCase["context"]) === null || _c === void 0 ? void 0 : _c["text"]) !== null && _d !== void 0 ? _d : "");
            const completionContext = new CompletionContext({
                filepath: (_f = (_e = testCase["context"]) === null || _e === void 0 ? void 0 : _e["filepath"]) !== null && _f !== void 0 ? _f : uuid(),
                language: (_h = (_g = testCase["context"]) === null || _g === void 0 ? void 0 : _g["language"]) !== null && _h !== void 0 ? _h : "plaintext",
                text: getDoc(docContext),
                position: getPosition(docContext),
                indentation: (_j = testCase["context"]) === null || _j === void 0 ? void 0 : _j["indentation"],
            });
            const completionId = "test-" + uuid();
            const completionResponse = {
                id: completionId,
                choices: buildChoices(docContext),
            };
            const unchanged = JSON.parse(JSON.stringify(completionResponse));
            const output = yield postprocess(completionContext, config, completionResponse);
            const checkExpected = (expected) => {
                var _a;
                if ((_a = testCase["expected"]) === null || _a === void 0 ? void 0 : _a["notEqual"]) {
                    expect(output).to.not.deep.equal(expected);
                }
                else {
                    expect(output).to.deep.equal(expected);
                }
            };
            if ((_k = testCase["expected"]) === null || _k === void 0 ? void 0 : _k["unchanged"]) {
                checkExpected(unchanged);
            }
            else if ((_l = testCase["expected"]) === null || _l === void 0 ? void 0 : _l["discard"]) {
                const expected = {
                    id: completionId,
                    choices: [],
                };
                checkExpected(expected);
            }
            else {
                const expectedContext = parseDocContext((_o = (_m = testCase["expected"]) === null || _m === void 0 ? void 0 : _m["text"]) !== null && _o !== void 0 ? _o : "");
                const expected = {
                    id: completionId,
                    choices: buildChoices(expectedContext),
                };
                checkExpected(expected);
            }
        }));
    });
});
//# sourceMappingURL=postprocess.test.js.map