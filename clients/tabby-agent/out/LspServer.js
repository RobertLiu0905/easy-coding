var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
import { createConnection, TextDocuments, TextDocumentSyncKind, MessageType, CompletionItemKind, } from "vscode-languageserver/node";
import { TextDocument } from "vscode-languageserver-textdocument";
import { name as agentName, version as agentVersion } from "../package.json";
import { logger } from "./logger";
import { splitLines, isCanceledError } from "./utils";
export class LspServer {
    constructor() {
        this.connection = createConnection();
        this.documents = new TextDocuments(TextDocument);
        this.logger = logger("LspServer");
        this.connection.onInitialize((params) => __awaiter(this, void 0, void 0, function* () {
            return yield this.initialize(params);
        }));
        this.connection.onShutdown(() => __awaiter(this, void 0, void 0, function* () {
            return yield this.shutdown();
        }));
        this.connection.onExit(() => __awaiter(this, void 0, void 0, function* () {
            return this.exit();
        }));
        this.connection.onCompletion((params) => __awaiter(this, void 0, void 0, function* () {
            return yield this.completion(params);
        }));
    }
    bind(agent) {
        this.agent = agent;
        this.agent.on("statusChanged", (event) => {
            if (event.status === "disconnected" || event.status === "unauthorized") {
                this.showMessage({
                    type: MessageType.Warning,
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
    initialize(params) {
        return __awaiter(this, void 0, void 0, function* () {
            var _a, _b;
            this.logger.debug({ params }, "LSP: initialize: request");
            if (!this.agent) {
                throw new Error(`Agent not bound.\n`);
            }
            const { clientInfo, capabilities } = params;
            if ((_a = capabilities.textDocument) === null || _a === void 0 ? void 0 : _a.inlineCompletion) {
                // TODO: use inlineCompletion instead of completion
            }
            yield this.agent.initialize({
                clientProperties: {
                    session: {
                        client: `${clientInfo === null || clientInfo === void 0 ? void 0 : clientInfo.name} ${(_b = clientInfo === null || clientInfo === void 0 ? void 0 : clientInfo.version) !== null && _b !== void 0 ? _b : ""}`,
                        ide: {
                            name: clientInfo === null || clientInfo === void 0 ? void 0 : clientInfo.name,
                            version: clientInfo === null || clientInfo === void 0 ? void 0 : clientInfo.version,
                        },
                        tabby_plugin: {
                            name: `${agentName} (LSP)`,
                            version: agentVersion,
                        },
                    },
                },
            });
            const result = {
                capabilities: {
                    textDocumentSync: {
                        openClose: true,
                        change: TextDocumentSyncKind.Incremental,
                    },
                    completionProvider: {},
                    // inlineCompletionProvider: {},
                },
                serverInfo: {
                    name: agentName,
                    version: agentVersion,
                },
            };
            return result;
        });
    }
    shutdown() {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug("LSP: shutdown: request");
            if (!this.agent) {
                throw new Error(`Agent not bound.\n`);
            }
            yield this.agent.finalize();
        });
    }
    exit() {
        this.logger.debug("LSP: exit: request");
        return process.exit(0);
    }
    showMessage(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug({ params }, "LSP server notification: window/showMessage");
            yield this.connection.sendNotification("window/showMessage", params);
        });
    }
    completion(params) {
        return __awaiter(this, void 0, void 0, function* () {
            this.logger.debug({ params }, "LSP: textDocument/completion: request");
            if (!this.agent) {
                throw new Error(`Agent not bound.\n`);
            }
            try {
                const request = this.buildCompletionRequest(params);
                const response = yield this.agent.provideCompletions(request);
                const completionList = this.toCompletionList(response, params);
                this.logger.debug({ completionList }, "LSP: textDocument/completion: response");
                return completionList;
            }
            catch (error) {
                if (isCanceledError(error)) {
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
        });
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
        var _a, _b;
        const { textDocument, position } = documentPosition;
        const document = this.documents.get(textDocument.uri);
        // Get word prefix if cursor is at end of a word
        const linePrefix = document.getText({
            start: { line: position.line, character: 0 },
            end: position,
        });
        const wordPrefix = (_b = (_a = linePrefix.match(/(\w+)$/)) === null || _a === void 0 ? void 0 : _a[0]) !== null && _b !== void 0 ? _b : "";
        return {
            isIncomplete: true,
            items: response.choices.map((choice) => {
                const insertionText = choice.text.slice(document.offsetAt(position) - choice.replaceRange.start);
                const lines = splitLines(insertionText);
                const firstLine = lines[0] || "";
                const secondLine = lines[1] || "";
                return {
                    label: wordPrefix + firstLine,
                    labelDetails: {
                        detail: secondLine,
                        description: "Tabby",
                    },
                    kind: CompletionItemKind.Text,
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
//# sourceMappingURL=LspServer.js.map