"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CompletionProviderStats = void 0;
const stats_logscale_1 = require("stats-logscale");
class Average {
    constructor() {
        this.sum = 0;
        this.quantity = 0;
    }
    add(value) {
        this.sum += value;
        this.quantity += 1;
    }
    mean() {
        if (this.quantity === 0) {
            return undefined;
        }
        return this.sum / this.quantity;
    }
    count() {
        return this.quantity;
    }
}
class Windowed {
    constructor(maxSize) {
        this.values = [];
        this.maxSize = maxSize;
    }
    add(value) {
        this.values.push(value);
        if (this.values.length > this.maxSize) {
            this.values.shift();
        }
    }
    getValues() {
        return this.values;
    }
}
class CompletionProviderStats {
    constructor() {
        this.config = {
            windowSize: 10,
            checks: {
                disable: false,
                // Mark status as healthy if the latency is less than the threshold for each latest windowSize requests.
                healthy: { windowSize: 1, latency: 3000 },
                // If there is at least {count} requests, and the average response time is higher than the {latency}, show warning
                slowResponseTime: { latency: 5000, count: 1 },
                // If there is at least {count} timeouts, and the timeout rate is higher than the {rate}, show warning
                highTimeoutRate: { rate: 0.5, count: 1 },
            },
        };
        this.autoCompletionCount = 0;
        this.manualCompletionCount = 0;
        this.cacheHitCount = 0;
        this.cacheMissCount = 0;
        this.eventMap = new Map();
        this.completionRequestLatencyStats = new stats_logscale_1.Univariate();
        this.completionRequestCanceledStats = new Average();
        this.completionRequestTimeoutCount = 0;
        this.recentCompletionRequestLatencies = new Windowed(this.config.windowSize);
    }
    add(value) {
        const { triggerMode, cacheHit, aborted, requestSent, requestLatency, requestCanceled, requestTimeout } = value;
        if (!aborted) {
            if (triggerMode === "auto") {
                this.autoCompletionCount += 1;
            }
            else {
                this.manualCompletionCount += 1;
            }
            if (cacheHit) {
                this.cacheHitCount += 1;
            }
            else {
                this.cacheMissCount += 1;
            }
        }
        if (requestSent) {
            if (requestCanceled) {
                this.completionRequestCanceledStats.add(requestLatency);
            }
            else if (requestTimeout) {
                this.completionRequestTimeoutCount += 1;
            }
            else {
                this.completionRequestLatencyStats.add(requestLatency);
            }
            if (!requestCanceled) {
                this.recentCompletionRequestLatencies.add(requestLatency);
            }
        }
    }
    addEvent(event) {
        const count = this.eventMap.get(event) || 0;
        this.eventMap.set(event, count + 1);
    }
    reset() {
        this.autoCompletionCount = 0;
        this.manualCompletionCount = 0;
        this.cacheHitCount = 0;
        this.cacheMissCount = 0;
        this.eventMap = new Map();
        this.completionRequestLatencyStats = new stats_logscale_1.Univariate();
        this.completionRequestCanceledStats = new Average();
        this.completionRequestTimeoutCount = 0;
    }
    resetWindowed() {
        this.recentCompletionRequestLatencies = new Windowed(this.config.windowSize);
    }
    // stats for anonymous usage report
    stats() {
        const eventCount = Object.fromEntries(Array.from(this.eventMap.entries()).map(([key, value]) => ["count_" + key, value]));
        return {
            completion: {
                count_auto: this.autoCompletionCount,
                count_manual: this.manualCompletionCount,
                cache_hit: this.cacheHitCount,
                cache_miss: this.cacheMissCount,
                ...eventCount,
            },
            completion_request: {
                count: this.completionRequestLatencyStats.count(),
                latency_avg: this.completionRequestLatencyStats.mean(),
                latency_p50: this.completionRequestLatencyStats.percentile(50),
                latency_p95: this.completionRequestLatencyStats.percentile(95),
                latency_p99: this.completionRequestLatencyStats.percentile(99),
            },
            completion_request_canceled: {
                count: this.completionRequestCanceledStats.count(),
                latency_avg: this.completionRequestCanceledStats.mean(),
            },
            completion_request_timeout: {
                count: this.completionRequestTimeoutCount,
            },
        };
    }
    // stats for "highTimeoutRate" | "slowResponseTime" warning
    windowed() {
        const latencies = this.recentCompletionRequestLatencies.getValues();
        const timeouts = latencies.filter((latency) => Number.isNaN(latency));
        const responses = latencies.filter((latency) => !Number.isNaN(latency));
        const averageResponseTime = responses.reduce((acc, latency) => acc + latency, 0) / responses.length;
        return {
            values: latencies,
            stats: {
                total: latencies.length,
                timeouts: timeouts.length,
                responses: responses.length,
                averageResponseTime,
            },
        };
    }
    check(windowed) {
        if (this.config.checks.disable) {
            return null;
        }
        const config = this.config.checks;
        const { values: latencies, stats: { total, timeouts, responses, averageResponseTime }, } = windowed;
        if (latencies
            .slice(-Math.min(this.config.windowSize, config.healthy.windowSize))
            .every((latency) => latency < config.healthy.latency)) {
            return "healthy";
        }
        if (timeouts / total > config.highTimeoutRate.rate && timeouts >= config.highTimeoutRate.count) {
            return "highTimeoutRate";
        }
        if (averageResponseTime > config.slowResponseTime.latency && responses >= config.slowResponseTime.count) {
            return "slowResponseTime";
        }
        return null;
    }
}
exports.CompletionProviderStats = CompletionProviderStats;
//# sourceMappingURL=CompletionProviderStats.js.map