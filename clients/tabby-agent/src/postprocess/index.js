"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.postCacheProcess = exports.preCacheProcess = void 0;
const base_1 = require("./base");
const removeRepetitiveBlocks_1 = require("./removeRepetitiveBlocks");
const removeRepetitiveLines_1 = require("./removeRepetitiveLines");
const removeLineEndsWithRepetition_1 = require("./removeLineEndsWithRepetition");
const removeDuplicatedBlockClosingLine_1 = require("./removeDuplicatedBlockClosingLine");
const limitScope_1 = require("./limitScope");
const formatIndentation_1 = require("./formatIndentation");
const trimSpace_1 = require("./trimSpace");
const trimMultiLineInSingleLineMode_1 = require("./trimMultiLineInSingleLineMode");
const dropDuplicated_1 = require("./dropDuplicated");
const dropBlank_1 = require("./dropBlank");
const calculateReplaceRange_1 = require("./calculateReplaceRange");
async function preCacheProcess(context, _, response) {
    return Promise.resolve(response)
        .then((0, base_1.applyFilter)((0, trimMultiLineInSingleLineMode_1.trimMultiLineInSingleLineMode)(), context))
        .then((0, base_1.applyFilter)((0, removeLineEndsWithRepetition_1.removeLineEndsWithRepetition)(), context))
        .then((0, base_1.applyFilter)((0, dropDuplicated_1.dropDuplicated)(), context))
        .then((0, base_1.applyFilter)((0, trimSpace_1.trimSpace)(), context))
        .then((0, base_1.applyFilter)((0, dropBlank_1.dropBlank)(), context));
}
exports.preCacheProcess = preCacheProcess;
async function postCacheProcess(context, config, response) {
    return Promise.resolve(response)
        .then((0, base_1.applyFilter)((0, removeRepetitiveBlocks_1.removeRepetitiveBlocks)(), context))
        .then((0, base_1.applyFilter)((0, removeRepetitiveLines_1.removeRepetitiveLines)(), context))
        .then((0, base_1.applyFilter)((0, limitScope_1.limitScope)(config["limitScope"]), context))
        .then((0, base_1.applyFilter)((0, removeDuplicatedBlockClosingLine_1.removeDuplicatedBlockClosingLine)(), context))
        .then((0, base_1.applyFilter)((0, formatIndentation_1.formatIndentation)(), context))
        .then((0, base_1.applyFilter)((0, dropDuplicated_1.dropDuplicated)(), context))
        .then((0, base_1.applyFilter)((0, trimSpace_1.trimSpace)(), context))
        .then((0, base_1.applyFilter)((0, dropBlank_1.dropBlank)(), context))
        .then((0, base_1.applyChoiceFilter)((0, calculateReplaceRange_1.calculateReplaceRange)(config["calculateReplaceRange"]), context));
}
exports.postCacheProcess = postCacheProcess;
//# sourceMappingURL=index.js.map