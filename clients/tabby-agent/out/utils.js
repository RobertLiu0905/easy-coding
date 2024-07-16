export function splitLines(input) {
    var _a, _b, _c;
    const lines = (_b = (_a = input.match(/.*(?:$|\r?\n)/g)) === null || _a === void 0 ? void 0 : _a.filter(Boolean)) !== null && _b !== void 0 ? _b : []; // Split lines and keep newline character
    if (lines.length > 0 && ((_c = lines[lines.length - 1]) === null || _c === void 0 ? void 0 : _c.endsWith("\n"))) {
        // Keep last empty line
        lines.push("");
    }
    return lines;
}
export function splitWords(input) {
    var _a, _b;
    return (_b = (_a = input.match(/\w+|\W+/g)) === null || _a === void 0 ? void 0 : _a.filter(Boolean)) !== null && _b !== void 0 ? _b : []; // Split consecutive words and non-words
}
export function isBlank(input) {
    return input.trim().length === 0;
}
// Indentation
export function getIndentationLevel(line, indentation) {
    var _a, _b, _c, _d, _e, _f, _g;
    if (indentation === undefined) {
        return (_c = (_b = (_a = line.match(/^[ \t]*/)) === null || _a === void 0 ? void 0 : _a[0]) === null || _b === void 0 ? void 0 : _b.length) !== null && _c !== void 0 ? _c : 0;
    }
    else if (indentation === "\t") {
        return (_e = (_d = line.match(/^\t*/)) === null || _d === void 0 ? void 0 : _d[0].length) !== null && _e !== void 0 ? _e : 0;
    }
    else if (indentation.match(/^ *$/)) {
        const spaces = (_g = (_f = line.match(/^ */)) === null || _f === void 0 ? void 0 : _f[0].length) !== null && _g !== void 0 ? _g : 0;
        return spaces / indentation.length;
    }
    else {
        throw new Error(`Invalid indentation: ${indentation}`);
    }
}
// function foo(a) {  // <-- block opening line
//   return a;
// }                  // <-- block closing line
export function isBlockOpeningLine(lines, index) {
    if (index < 0 || index >= lines.length - 1) {
        return false;
    }
    return getIndentationLevel(lines[index]) < getIndentationLevel(lines[index + 1]);
}
export function isBlockClosingLine(lines, index) {
    if (index <= 0 || index > lines.length - 1) {
        return false;
    }
    return getIndentationLevel(lines[index - 1]) > getIndentationLevel(lines[index]);
}
// FIXME: use syntax parser instead
export const autoClosingPairs = [
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
export const regOnlyAutoClosingCloseChars = /^([)\]}>"'`]|(\/>))*$/g;
// FIXME: This function is not good enough, it can not handle escaped characters.
export function findUnpairedAutoClosingChars(input) {
    const stack = [];
    let index = 0;
    while (index < input.length) {
        const remain = input.slice(index);
        let nextFound = {
            index: remain.length,
            found: undefined,
        };
        autoClosingPairs.forEach((pair) => {
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
// Using string levenshtein distance is not good, because variable name may create a large distance.
// Such as distance is 9 between `const fooFooFoo = 1;` and `const barBarBar = 1;`, but maybe 1 is enough.
// May be better to count distance based on words instead of characters.
import * as levenshtein from "fast-levenshtein";
export function calcDistance(a, b) {
    return levenshtein.get(a, b);
}
// Polyfill for AbortSignal.any(signals) which added in Node.js v20.
export function abortSignalFromAnyOf(signals) {
    const controller = new AbortController();
    for (const signal of signals) {
        if (signal === null || signal === void 0 ? void 0 : signal.aborted) {
            controller.abort(signal.reason);
            return signal;
        }
        signal === null || signal === void 0 ? void 0 : signal.addEventListener("abort", () => controller.abort(signal.reason), {
            signal: controller.signal,
        });
    }
    return controller.signal;
}
// Http Error
export class HttpError extends Error {
    constructor(response) {
        super(`${response.status} ${response.statusText}`);
        this.name = "HttpError";
        this.status = response.status;
        this.statusText = response.statusText;
        this.response = response;
    }
}
export function isTimeoutError(error) {
    return ((error instanceof Error && error.name === "TimeoutError") ||
        (error instanceof HttpError && [408, 499].includes(error.status)));
}
export function isCanceledError(error) {
    return error instanceof Error && error.name === "AbortError";
}
export function errorToString(error) {
    let message = error.message || error.toString();
    if (error.cause) {
        message += "\nCaused by: " + errorToString(error.cause);
    }
    return message;
}
//# sourceMappingURL=utils.js.map