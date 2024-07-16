export const defaultAgentConfig = {
    server: {
        endpoint: "http://localhost:8080",
        token: "",
        requestHeaders: {},
        requestTimeout: 2 * 60 * 1000, // 2 minutes
    },
    completion: {
        prompt: {
            experimentalStripAutoClosingCharacters: false,
            maxPrefixLines: 20,
            maxSuffixLines: 20,
            clipboard: {
                minChars: 3,
                maxChars: 2000,
            },
        },
        debounce: {
            mode: "adaptive",
            interval: 250, // ms
        },
    },
    postprocess: {
        limitScope: {
            experimentalSyntax: false,
            indentation: {
                experimentalKeepBlockScopeWhenCompletingLine: false,
            },
        },
        calculateReplaceRange: {
            experimentalSyntax: false,
        },
    },
    logs: {
        level: "silent",
    },
    tls: {
        caCerts: "system",
    },
    anonymousUsageTracking: {
        disable: false,
    },
};
//# sourceMappingURL=AgentConfig.js.map