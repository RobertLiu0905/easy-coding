"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LspServer = void 0;
const node_1 = require("vscode-languageserver/node");
const vscode_languageserver_textdocument_1 = require("vscode-languageserver-textdocument");
const package_json_1 = require("../package.json");
const logger_1 = require("./logger");
const utils_1 = require("./utils");
class LspServer {
    constructor() {
        this.connection = (0, node_1.createConnection)();
        this.documents = new node_1.TextDocuments(vscode_languageserver_textdocument_1.TextDocument);
        this.logger = (0, logger_1.logger)("LspServer");
        this.connection.onInitialize(async (params) => {
            return await this.initialize(params);
        });
        this.connection.onShutdown(async () => {
            return await this.shutdown();
        });
        this.connection.onExit(async () => {
            return this.exit();
        });
        this.connection.onCompletion(async (params) => {
            return await this.completion(params);
        });
    }
    bind(agent) {
        this.agent = agent;
        this.agent.on("statusChanged", (event) => {
            if (event.status === "disconnected" || event.status === "unauthorized") {
                this.showMessage({
                    type: node_1.MessageType.Warning,
                    message: `Tabby agent status: ${event.status}`,
                });
            }
        });
    }
    listen() {
        this.documents.listen(this.connection);
        this.connection.listen();
    }
    // LSP interface methods
    async initialize(params) {
        this.logger.debug({ params }, "LSP: initialize: request");
        if (!this.agent) {
            throw new Error(`Agent not bound.\n`);
        }
        const { clientInfo, capabilities } = params;
        if (capabilities.textDocument?.inlineCompletion) {
            // TODO: use inlineCompletion instead of completion
        }
        await this.agent.initialize({
            clientProperties: {
                session: {
                    client: `${clientInfo?.name} ${clientInfo?.version ?? ""}`,
                    ide: {
                        name: clientInfo?.name,
                        version: clientInfo?.version,
                    },
                    tabby_plugin: {
                        name: `${package_json_1.name} (LSP)`,
                        version: package_json_1.version,
                    },
                },
            },
        });
        const result = {
            capabilities: {
                textDocumentSync: {
                    openClose: true,
                    change: node_1.TextDocumentSyncKind.Incremental,
                },
                completionProvider: {},
                // inlineCompletionProvider: {},
            },
            serverInfo: {
                name: package_json_1.name,
                version: package_json_1.version,
            },
        };
        return result;
    }
    async shutdown() {
        this.logger.debug("LSP: shutdown: request");
        if (!this.agent) {
            throw new Error(`Agent not bound.\n`);
        }
        await this.agent.finalize();
    }
    exit() {
        this.logger.debug("LSP: exit: request");
        return process.exit(0);
    }
    async showMessage(params) {
        this.logger.debug({ params }, "LSP server notification: window/showMessage");
        await this.connection.sendNotification("window/showMessage", params);
    }
    async completion(params) {
        this.logger.debug({ params }, "LSP: textDocument/completion: request");
        if (!this.agent) {
            throw new Error(`Agent not bound.\n`);
        }
        try {
            const request = this.buildCompletionRequest(params);
            const response = await this.agent.provideCompletions(request);
            const completionList = this.toCompletionList(response, params);
            this.logger.debug({ completionList }, "LSP: textDocument/completion: response");
            return completionList;
        }
        catch (error) {
            if ((0, utils_1.isCanceledError)(error)) {
                this.logger.debug({ error }, "LSP: textDocument/completion: canceled");
            }
            else {
                this.logger.error({ error }, "LSP: textDocument/completion: error");
            }
        }
        return {
            isIncomplete: true,
            items: [],
        };
    }
    buildCompletionRequest(documentPosition, manually = false) {
        const { textDocument, position } = documentPosition;
        const document = this.documents.get(textDocument.uri);
        const request = {
            filepath: document.uri,
            language: document.languageId,
            text: document.getText(),
            position: document.offsetAt(position),
            manually,
        };
        return request;
    }
    toCompletionList(response, documentPosition) {
        const { textDocument, position } = documentPosition;
        const document = this.documents.get(textDocument.uri);
        // Get word prefix if cursor is at end of a word
        const linePrefix = document.getText({
            start: { line: position.line, character: 0 },
            end: position,
        });
        const wordPrefix = linePrefix.match(/(\w+)$/)?.[0] ?? "";
        return {
            isIncomplete: true,
            items: response.choices.map((choice) => {
                const insertionText = choice.text.slice(document.offsetAt(position) - choice.replaceRange.start);
                const lines = (0, utils_1.splitLines)(insertionText);
                const firstLine = lines[0] || "";
                const secondLine = lines[1] || "";
                return {
                    label: wordPrefix + firstLine,
                    labelDetails: {
                        detail: secondLine,
                        description: "Tabby",
                    },
                    kind: node_1.CompletionItemKind.Text,
                    documentation: {
                        kind: "markdown",
                        value: `\`\`\`\n${linePrefix + insertionText}\n\`\`\`\n ---\nSuggested by Tabby.`,
                    },
                    textEdit: {
                        newText: wordPrefix + insertionText,
                        range: {
                            start: { line: position.line, character: position.character - wordPrefix.length },
                            end: document.positionAt(choice.replaceRange.end),
                        },
                    },
                    data: {
                        completionId: response.id,
                        choiceIndex: choice.index,
                    },
                };
            }),
        };
    }
}
exports.LspServer = LspServer;
//# sourceMappingURL=LspServer.js.map