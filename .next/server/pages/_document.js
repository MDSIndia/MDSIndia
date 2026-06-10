const CHUNK_PUBLIC_PATH = "server/pages/_document.js";
const runtime = require("../chunks/ssr/[turbopack]_runtime.js");
runtime.loadChunk("server/chunks/ssr/[root-of-the-server]__2e92c943._.js");
runtime.loadChunk("server/chunks/ssr/[root-of-the-server]__5402c70b._.js");
runtime.getOrInstantiateRuntimeModule(45253, CHUNK_PUBLIC_PATH);
module.exports = runtime.getOrInstantiateRuntimeModule(45253, CHUNK_PUBLIC_PATH).exports;
