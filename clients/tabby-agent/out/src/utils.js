"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.errorToString = exports.isCanceledError = exports.isTimeoutError = exports.HttpError = exports.abortSignalFromAnyOf = exports.calcDistance = exports.findUnpairedAutoClosingChars = exports.regOnlyAutoClosingCloseChars = exports.autoClosingPairs = exports.isBlockClosingLine = exports.isBlockOpeningLine = exports.getIndentationLevel = exports.isBlank = exports.splitWords = exports.splitLines = void 0;
function splitLines(input) {
    const lines = input.match(/.*(?:$|\r?\n)/g)?.filter(Boolean) ?? []; // Split lines and keep newline character
    if (lines.length > 0 && lines[lines.length - 1]?.endsWith("\n")) {
        // Keep last empty line
        lines.push("");
    }
    return lines;
}
exports.splitLines = splitLines;
function splitWords(input) {
    return input.match(/\w+|\W+/g)?.filter(Boolean) ?? []; // Split consecutive words and non-words
}
exports.splitWords = splitWords;
function isBlank(input) {
    return input.trim().length === 0;
}
exports.isBlank = isBlank;
// Indentation
function getIndentationLevel(line, indentation) {
    if (indentation === undefined) {
        return line.match(/^[ \t]*/)?.[0]?.length ?? 0;
    }
    else if (indentation === "\t") {
        return line.match(/^\t*/)?.[0].length ?? 0;
    }
    else if (indentation.match(/^ *$/)) {
        const spaces = line.match(/^ */)?.[0].length ?? 0;
        return spaces / indentation.length;
    }
    else {
        throw new Error(`Invalid indentation: ${indentation}`);
    }
}
exports.getIndentationLevel = getIndentationLevel;
// function foo(a) {  // <-- block opening line
//   return a;
// }                  // <-- block closing line
function isBlockOpeningLine(lines, index) {
    if (index < 0 || index >= lines.length - 1) {
        return false;
    }
    return getIndentationLevel(lines[index]) < getIndentationLevel(lines[index + 1]);
}
exports.isBlockOpeningLine = isBlockOpeningLine;
function isBlockClosingLine(lines, index) {
    if (index <= 0 || index > lines.length - 1) {
        return false;
    }
    return getIndentationLevel(lines[index - 1]) > getIndentationLevel(lines[index]);
}
exports.isBlockClosingLine = isBlockClosingLine;
// FIXME: use syntax parser instead
exports.autoClosingPairs = [
    {
        open: {
            chars: "(",
            reg: /\(/,
        },
        close: {
            chars: ")",
            reg: /\)/,
        },
    },
    {
        open: {
            chars: "[",
            reg: /\[/,
        },
        close: {
            chars: "]",
            reg: /\]/,
        },
    },
    {
        open: {
            chars: "{",
            reg: /\{/,
        },
        close: {
            chars: "}",
            reg: /\}/,
        },
    },
    {
        open: {
            chars: "<",
            reg: /<(?=\w)/,
        },
        close: {
            chars: "/>",
            reg: /\/>/,
        },
    },
    {
        open: {
            chars: "<",
            reg: /<(?=[/\w])/,
        },
        close: {
            chars: ">",
            reg: />/,
        },
    },
    {
        openOrClose: {
            chars: '"',
            reg: /"/,
        },
    },
    {
        openOrClose: {
            chars: "'",
            reg: /'/,
        },
    },
    {
        openOrClose: {
            chars: "`",
            reg: /`/,
        },
    },
];
exports.regOnlyAutoClosingCloseChars = /^([)\]}>"'`]|(\/>))*$/g;
// FIXME: This function is not good enough, it can not handle escaped characters.
function findUnpairedAutoClosingChars(input) {
    const stack = [];
    let index = 0;
    while (index < input.length) {
        const remain = input.slice(index);
        let nextFound = {
            index: remain.length,
            found: undefined,
        };
        exports.autoClosingPairs.forEach((pair) => {
            Object.entries(pair).forEach(([pos, pattern]) => {
                const match = remain.match(pattern.reg);
                if (match && match.index !== undefined && match.index < nextFound.index) {
                    nextFound = {
                        index: match.index,
                        found: { pair, pos: pos, pattern },
                    };
                }
            });
        });
        if (!nextFound.found) {
            break;
        }
        switch (nextFound.found.pos) {
            case "openOrClose": {
                const chars = nextFound.found.pattern.chars;
                if (stack.length > 0 && stack.includes(chars)) {
                    stack.splice(stack.lastIndexOf(chars), stack.length - stack.lastIndexOf(chars));
                }
                else {
                    stack.push(chars);
                }
                break;
            }
            case "open": {
                stack.push(nextFound.found.pattern.chars);
                break;
            }
            case "close": {
                const pair = nextFound.found.pair;
                if (stack.length > 0 && "open" in pair && stack[stack.length - 1] === pair.open.chars) {
                    stack.pop();
                }
                else {
                    stack.push(nextFound.found.pattern.chars);
                }
                break;
            }
        }
        index += nextFound.index + nextFound.found.pattern.chars.length;
    }
    return stack;
}
exports.findUnpairedAutoClosingChars = findUnpairedAutoClosingChars;
// Using string levenshtein distance is not good, because variable name may create a large distance.
// Such as distance is 9 between `const fooFooFoo = 1;` and `const barBarBar = 1;`, but maybe 1 is enough.
// May be better to count distance based on words instead of characters.
const levenshtein = __importStar(require("fast-levenshtein"));
function calcDistance(a, b) {
    return levenshtein.get(a, b);
}
exports.calcDistance = calcDistance;
// Polyfill for AbortSignal.any(signals) which added in Node.js v20.
function abortSignalFromAnyOf(signals) {
    const controller = new AbortController();
    for (const signal of signals) {
        if (signal?.aborted) {
            controller.abort(signal.reason);
            return signal;
        }
        signal?.addEventListener("abort", () => controller.abort(signal.reason), {
            signal: controller.signal,
        });
    }
    return controller.signal;
}
exports.abortSignalFromAnyOf = abortSignalFromAnyOf;
// Http Error
class HttpError extends Error {
    constructor(response) {
        super(`${response.status} ${response.statusText}`);
        this.name = "HttpError";
        this.status = response.status;
        this.statusText = response.statusText;
        this.response = response;
    }
}
exports.HttpError = HttpError;
function isTimeoutError(error) {
    return ((error instanceof Error && error.name === "TimeoutError") ||
        (error instanceof HttpError && [408, 499].includes(error.status)));
}
exports.isTimeoutError = isTimeoutError;
function isCanceledError(error) {
    return error instanceof Error && error.name === "AbortError";
}
exports.isCanceledError = isCanceledError;
function errorToString(error) {
    let message = error.message || error.toString();
    if (error.cause) {
        message += "\nCaused by: " + errorToString(error.cause);
    }
    return message;
}
exports.errorToString = errorToString;
//# sourceMappingURL=utils.js.map