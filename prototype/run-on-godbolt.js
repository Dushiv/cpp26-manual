#!/usr/bin/env node
// Compile + run a C++ snippet via the public Compiler Explorer (godbolt.org) API.
// Usage: node run-on-godbolt.js <compilerId> <sourceFile> ["<compiler flags>"]
//   compilerId examples: gsnapshot (gcc trunk), clang_trunk, clang_bb_p2996 (reflection),
//                        edg-experimental-reflection, gcontracts-trunk
//   Default flags: "-std=c++26 -O2". Pass a single quoted string to override, e.g.:
//     node run-on-godbolt.js clang_bb_p2996 lesson.cpp "-std=c++26 -stdlib=libc++"
// Prints stdout/stderr from compilation and execution, plus the exit code.

const fs = require("fs");
const https = require("https");

const [, , compilerId, sourceFile, ...extra] = process.argv;
if (!compilerId || !sourceFile) {
  console.error("usage: node run-on-godbolt.js <compilerId> <sourceFile> [-- <userArguments>]");
  process.exit(2);
}

const userArguments = extra.length ? extra.join(" ") : "-std=c++26 -O2";
const source = fs.readFileSync(sourceFile, "utf8");

const payload = JSON.stringify({
  source,
  options: {
    userArguments,
    filters: { execute: true },
    tools: [],
  },
});

const req = https.request(
  {
    hostname: "godbolt.org",
    path: `/api/compiler/${encodeURIComponent(compilerId)}/compile`,
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json",
      "Content-Length": Buffer.byteLength(payload),
    },
  },
  (res) => {
    let body = "";
    res.on("data", (c) => (body += c));
    res.on("end", () => {
      let d;
      try {
        d = JSON.parse(body);
      } catch (e) {
        console.error("Failed to parse response:", e.message);
        console.error(body.slice(0, 2000));
        process.exit(1);
      }
      const join = (arr) => (arr || []).map((x) => x.text).join("\n");
      console.log("=== compile ===");
      console.log("exit code:", d.code);
      const cstdout = join(d.stdout);
      const cstderr = join(d.stderr);
      if (cstdout) console.log("--- stdout ---\n" + cstdout);
      if (cstderr) console.log("--- stderr ---\n" + cstderr);
      if (d.code !== 0) {
        process.exit(d.code || 1);
      }
      if (d.execResult) {
        console.log("\n=== execute ===");
        console.log("exit code:", d.execResult.code);
        const estdout = join(d.execResult.stdout);
        const estderr = join(d.execResult.stderr);
        if (estdout) console.log("--- stdout ---\n" + estdout);
        if (estderr) console.log("--- stderr ---\n" + estderr);
        process.exit(d.execResult.code || 0);
      }
    });
  }
);
req.on("error", (e) => {
  console.error("Request failed:", e.message);
  process.exit(1);
});
req.write(payload);
req.end();
