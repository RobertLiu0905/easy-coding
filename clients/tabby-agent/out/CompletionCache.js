import { LRUCache } from "lru-cache";
import { CompletionContext } from "./CompletionContext";
import { logger } from "./logger";
import { splitLines, autoClosingPairs, findUnpairedAutoClosingChars } from "./utils";
export class CompletionCache {
    constructor() {
        this.logger = logger("CompletionCache");
        this.options = {
            maxCount: 10000,
            prebuildCache: {
                enabled: true,
                perCharacter: {
                    lines: 1,
                    max: 50,
                },
                perLine: {
                    max: 10,
                },
                autoClosingPairCheck: {
                    max: 3,
                },
            },
        };
        this.cache = new LRUCache({
            max: this.options.maxCount,
        });
    }
    has(key) {
        return this.cache.has(key.hash);
    }
    buildCache(key, value) {
        this.logger.debug({ key, value }, "Starting to build cache");
        const entries = this.createCacheEntries(key, value);
        entries.forEach((entry) => {
            this.cache.set(entry.key.hash, { value: entry.value, rebuildFlag: entry.rebuildFlag });
        });
        this.logger.debug({ newEntries: entries.length, cacheSize: this.cache.size }, "Cache updated");
    }
    get(key) {
        const entry = this.cache.get(key.hash);
        if (entry === null || entry === void 0 ? void 0 : entry.rebuildFlag) {
            this.buildCache(key, entry === null || entry === void 0 ? void 0 : entry.value);
        }
        return entry === null || entry === void 0 ? void 0 : entry.value;
    }
    createCacheEntries(key, value) {
        const list = [{ key, value, rebuildFlag: false }];
        if (this.options.prebuildCache.enabled) {
            for (const choice of value.choices) {
                const completionText = choice.text.slice(key.position - choice.replaceRange.start);
                const perLinePositions = this.getPerLinePositions(completionText);
                this.logger.trace({ completionText, perLinePositions }, "Calculate per-line cache positions");
                for (const position of perLinePositions) {
                    const completionTextPrefix = completionText.slice(0, position);
                    const completionTextPrefixWithAutoClosedChars = this.generateAutoClosedPrefixes(completionTextPrefix);
                    for (const prefix of [completionTextPrefix, ...completionTextPrefixWithAutoClosedChars]) {
                        const entry = {
                            key: new CompletionContext(Object.assign(Object.assign({}, key), { text: key.text.slice(0, key.position) + prefix + key.text.slice(key.position), position: key.position + position })),
                            value: Object.assign(Object.assign({}, value), { choices: [
                                    {
                                        index: choice.index,
                                        text: completionText.slice(position),
                                        replaceRange: {
                                            start: key.position + position,
                                            end: key.position + position,
                                        },
                                    },
                                ] }),
                            rebuildFlag: true,
                        };
                        this.logger.trace({ prefix, entry }, "Build per-line cache entry");
                        list.push(entry);
                    }
                }
                const perCharacterPositions = this.getPerCharacterPositions(completionText);
                this.logger.trace({ completionText, perCharacterPositions }, "Calculate per-character cache positions");
                for (const position of perCharacterPositions) {
                    let lineStart = position;
                    while (lineStart > 0 && completionText[lineStart - 1] !== "\n") {
                        lineStart--;
                    }
                    const completionTextPrefix = completionText.slice(0, position);
                    const completionTextPrefixWithAutoClosedChars = this.generateAutoClosedPrefixes(completionTextPrefix);
                    for (const prefix of [completionTextPrefix, ...completionTextPrefixWithAutoClosedChars]) {
                        const entry = {
                            key: new CompletionContext(Object.assign(Object.assign({}, key), { text: key.text.slice(0, key.position) + prefix + key.text.slice(key.position), position: key.position + position })),
                            value: Object.assign(Object.assign({}, value), { choices: [
                                    {
                                        index: choice.index,
                                        text: completionText.slice(lineStart),
                                        replaceRange: {
                                            start: key.position + lineStart,
                                            end: key.position + position,
                                        },
                                    },
                                ] }),
                            rebuildFlag: false,
                        };
                        this.logger.trace({ prefix, entry }, "Build per-character cache entry");
                        list.push(entry);
                    }
                }
            }
        }
        const result = list.reduce((prev, curr) => {
            const found = prev.find((entry) => entry.key.hash === curr.key.hash);
            if (found) {
                found.value.choices.push(...curr.value.choices);
                found.rebuildFlag = found.rebuildFlag || curr.rebuildFlag;
            }
            else {
                prev.push(curr);
            }
            return prev;
        }, []);
        return result;
    }
    // positions for every line end (before newline character) and line begin (after indent)
    getPerLinePositions(completion) {
        var _a, _b;
        const result = [];
        const option = this.options.prebuildCache;
        const lines = splitLines(completion);
        let index = 0;
        let offset = 0;
        // `index < lines.length - 1` to exclude the last line
        while (index < lines.length - 1 && index < option.perLine.max) {
            offset += (_b = (_a = lines[index]) === null || _a === void 0 ? void 0 : _a.length) !== null && _b !== void 0 ? _b : 0;
            result.push(offset - 1); // cache at the end of the line (before newline character)
            result.push(offset); // cache at the beginning of the next line (after newline character)
            let offsetNextLineBegin = offset;
            while (offsetNextLineBegin < completion.length && completion[offsetNextLineBegin].match(/\s/)) {
                offsetNextLineBegin++;
            }
            result.push(offsetNextLineBegin); // cache at the beginning of the next line (after indent)
            index++;
        }
        return result;
    }
    // positions for every character in the leading lines
    getPerCharacterPositions(completion) {
        const result = [];
        const option = this.options.prebuildCache;
        const text = splitLines(completion).slice(0, option.perCharacter.lines).join("");
        let offset = 0;
        while (offset < text.length && offset < option.perCharacter.max) {
            result.push(offset);
            offset++;
        }
        return result;
    }
    // FIXME: add unit tests
    // "function(" => ["function()"]
    // "call([" => ["call([]", "call([])" ]
    // "function(arg" => ["function(arg)" ]
    generateAutoClosedPrefixes(prefix) {
        const result = [];
        const unpaired = findUnpairedAutoClosingChars(prefix);
        let checkIndex = 0;
        let autoClosing = "";
        while (checkIndex < unpaired.length && checkIndex < this.options.prebuildCache.autoClosingPairCheck.max) {
            autoClosingPairs
                .filter((pair) => {
                let pattern;
                if ("open" in pair) {
                    pattern = pair.open;
                }
                else {
                    pattern = pair.openOrClose;
                }
                return pattern.chars === unpaired[unpaired.length - 1 - checkIndex];
            })
                .forEach((pair) => {
                let pattern;
                if ("close" in pair) {
                    pattern = pair.close;
                }
                else {
                    pattern = pair.openOrClose;
                }
                autoClosing += pattern.chars;
                result.push(prefix + autoClosing);
            });
            checkIndex++;
        }
        return result;
    }
}
//# sourceMappingURL=CompletionCache.js.map