"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionDebounce = void 0;
const utils_1 = require("./utils");
function clamp(min, max, value) {
    return Math.max(min, Math.min(max, value));
}
class CompletionDebounce {
    constructor() {
        this.lastCalledTimeStamp = 0;
        this.baseInterval = 200; // ms
        this.calledIntervalHistory = [];
        this.options = {
            baseIntervalSlideWindowAvg: {
                minSize: 20,
                maxSize: 100,
                min: 100,
                max: 400,
            },
            adaptiveRate: {
                min: 1.5,
                max: 3.0,
            },
            contextScoreWeights: {
                triggerCharacter: 0.5,
                noSuffixInCurrentLine: 0.4,
                noSuffix: 0.1,
            },
            requestDelay: {
                min: 100, // ms
                max: 1000,
            },
        };
    }
    async debounce(context, options) {
        const { request, config, responseTime } = context;
        if (request.manually) {
            return this.sleep(0, options);
        }
        if (config.mode === "fixed") {
            return this.sleep(config.interval, options);
        }
        const now = Date.now();
        this.updateBaseInterval(now - this.lastCalledTimeStamp);
        this.lastCalledTimeStamp = now;
        const contextScore = this.calcContextScore(request);
        const adaptiveRate = this.options.adaptiveRate.max - (this.options.adaptiveRate.max - this.options.adaptiveRate.min) * contextScore;
        const expectedLatency = adaptiveRate * this.baseInterval;
        const delay = clamp(this.options.requestDelay.min, this.options.requestDelay.max, expectedLatency - responseTime);
        return this.sleep(delay, options);
    }
    async sleep(delay, options) {
        return new Promise((resolve, reject) => {
            const timer = setTimeout(resolve, Math.min(delay, 0x7fffffff));
            if (options?.signal) {
                if (options.signal.aborted) {
                    clearTimeout(timer);
                    reject(options.signal.reason);
                }
                else {
                    options.signal.addEventListener("abort", () => {
                        clearTimeout(timer);
                        reject(options.signal.reason);
                    });
                }
            }
        });
    }
    updateBaseInterval(interval) {
        if (interval > this.options.baseIntervalSlideWindowAvg.max) {
            return;
        }
        this.calledIntervalHistory.push(interval);
        if (this.calledIntervalHistory.length > this.options.baseIntervalSlideWindowAvg.maxSize) {
            this.calledIntervalHistory.shift();
        }
        if (this.calledIntervalHistory.length > this.options.baseIntervalSlideWindowAvg.minSize) {
            const avg = this.calledIntervalHistory.reduce((a, b) => a + b, 0) / this.calledIntervalHistory.length;
            this.baseInterval = clamp(this.options.baseIntervalSlideWindowAvg.min, this.options.baseIntervalSlideWindowAvg.max, avg);
        }
    }
    // return score in [0, 1], 1 means the context has a high chance to accept the completion
    calcContextScore(request) {
        let score = 0;
        const weights = this.options.contextScoreWeights;
        const triggerCharacter = request.text[request.position - 1] ?? "";
        score += triggerCharacter.match(/^\W*$/) ? weights.triggerCharacter : 0;
        const suffix = request.text.slice(request.position) ?? "";
        const currentLineInSuffix = (0, utils_1.splitLines)(suffix)[0] ?? "";
        score += currentLineInSuffix.match(/^\W*$/) ? weights.noSuffixInCurrentLine : 0;
        score += suffix.match(/^\W*$/) ? weights.noSuffix : 0;
        score = clamp(0, 1, score);
        return score;
    }
}
exports.CompletionDebounce = CompletionDebounce;
//# sourceMappingURL=CompletionDebounce.js.map