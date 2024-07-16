#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const TabbyAgent_1 = require("./TabbyAgent");
const JsonLineServer_1 = require("./JsonLineServer");
const LspServer_1 = require("./LspServer");
const args = process.argv.slice(2);
let server;
if (args.indexOf("--lsp") >= 0) {
    server = new LspServer_1.LspServer();
}
else {
    server = new JsonLineServer_1.JsonLineServer();
}
const agent = new TabbyAgent_1.TabbyAgent();
server.bind(agent);
server.listen();
//# sourceMappingURL=cli.js.map