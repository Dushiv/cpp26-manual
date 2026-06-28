#!/usr/bin/env node
// Verifies every challenge.starterCode is the challenge.referenceSolution
// program with only the answer region replaced by a `// твой код` stub:
// removing stub/blank lines from starterCode must leave an in-order
// subsequence of the reference program's lines. Usage: node prototype/check-starter-scaffold.js
const fs = require("fs");
const path = require("path");
const CONTENT_DIR = path.join(__dirname, "..", "content", "modules");
const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];

function unfence(s) {
  return (s || "").replace(/^```\w*\n/, "").replace(/\n```\s*$/, "");
}
const isStub = (l) => /\/\/\s*твой код/i.test(l) || l.trim() === "";

// returns true if `needles` (in order) all appear in `hay` preserving order
function isSubsequence(needles, hay) {
  let i = 0;
  for (const line of hay) { if (i < needles.length && line === needles[i]) i++; }
  return i === needles.length;
}

let errors = [];
for (const id of MODULE_IDS) {
  for (const loc of ["ru", "en"]) {
    const file = path.join(CONTENT_DIR, loc, `${id}.json`);
    const data = JSON.parse(fs.readFileSync(file, "utf8"));
    for (const l of (data.lessons || [])) {
      const ch = l.challenge;
      if (!ch) continue;
      if (!ch.starterCode) { errors.push(`${loc}/${id} ${l.id}: missing starterCode`); continue; }
      const refLines = unfence(ch.referenceSolution).split("\n");
      const starterKept = ch.starterCode.split("\n").filter((x) => !isStub(x));
      if (!isSubsequence(starterKept, refLines))
        errors.push(`${loc}/${id} ${l.id}: starterCode scaffold lines are not a subsequence of referenceSolution (a driver/include line was altered?)`);
      if (!/\/\/\s*твой код/i.test(ch.starterCode))
        errors.push(`${loc}/${id} ${l.id}: starterCode has no \`// твой код\` stub`);
    }
  }
}
if (errors.length) { console.error("starter scaffold check FAILED:\n" + errors.join("\n")); process.exit(1); }
console.log("starter scaffold check OK");
