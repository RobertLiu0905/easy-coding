var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { splitLines } from "./utils";
function clamp(min, max, value) {
    return Math.max(min, Math.min(max, value));
}
export class CompletionDebounce {
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
    debounce(context, options) {
        return __awaiter(this, void 0, void 0, function* () {
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
        });
    }
    sleep(delay, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return new Promise((resolve, reject) => {
                const timer = setTimeout(resolve, Math.min(delay, 0x7fffffff));
                if (options === null || options === void 0 ? void 0 : options.signal) {
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
        var _a, _b, _c;
        let score = 0;
        const weights = this.options.contextScoreWeights;
        const triggerCharacter = (_a = request.text[request.position - 1]) !== null && _a !== void 0 ? _a : "";
        score += triggerCharacter.match(/^\W*$/) ? weights.triggerCharacter : 0;
        const suffix = (_b = request.text.slice(request.position)) !== null && _b !== void 0 ? _b : "";
        const currentLineInSuffix = (_c = splitLines(suffix)[0]) !== null && _c !== void 0 ? _c : "";
        score += currentLineInSuffix.match(/^\W*$/) ? weights.noSuffixInCurrentLine : 0;
        score += suffix.match(/^\W*$/) ? weights.noSuffix : 0;
        score = clamp(0, 1, score);
        return score;
    }
}
//# sourceMappingURL=CompletionDebounce.js.map