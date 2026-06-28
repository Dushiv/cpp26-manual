#!/usr/bin/env node
// Verifies that content/modules/ru/*.json and content/modules/en/*.json
// stay structurally in sync: same modules, same lessons, same exercise/
// mastery-check shapes. Prose strings are intentionally NOT compared (that's
// the part that's supposed to differ between locales).
// Usage: node prototype/check-i18n-parity.js

const fs = require("fs");
const path = require("path");

const CONTENT_DIR = path.join(__dirname, "..", "content", "modules");
const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];

let errors = [];

function load(locale, id) {
  const file = path.join(CONTENT_DIR, locale, `${id}.json`);
  return JSON.parse(fs.readFileSync(file, "utf8"));
}

function describeExercise(ex) {
  return {
    id: ex.id,
    level: ex.level,
    type: ex.type,
    answerIndex: ex.answerIndex,
    answerLine: ex.answerLine,
    answer: ex.answer,
    optionCount: ex.options ? ex.options.length : null,
  };
}

function describeQuestion(q) {
  return { type: q.type, answerIndex: q.answerIndex, optionCount: q.options ? q.options.length : null };
}

function describeLesson(l) {
  if (l.stub) return { id: l.id, stub: true };
  return {
    id: l.id,
    stub: false,
    exampleCount: (l.examples || []).length,
    exercises: (l.exercises || []).map(describeExercise),
    hasChallenge: !!l.challenge,
    challengeHasStarter: !!(l.challenge && l.challenge.starterCode),
    masteryQuestions: l.masteryCheck.questions.map(describeQuestion),
  };
}

for (const id of MODULE_IDS) {
  const ru = load("ru", id);
  const en = load("en", id);

  if (ru.id !== en.id || ru.moduleNumber !== en.moduleNumber) {
    errors.push(`${id}: module id/number mismatch (ru=${ru.id}/${ru.moduleNumber}, en=${en.id}/${en.moduleNumber})`);
  }

  const ruLessons = (ru.lessons || []).map(describeLesson);
  const enLessons = (en.lessons || []).map(describeLesson);

  if (ruLessons.length !== enLessons.length) {
    errors.push(`${id}: lesson count mismatch (ru=${ruLessons.length}, en=${enLessons.length})`);
    continue;
  }

  for (let i = 0; i < ruLessons.length; i++) {
    const a = JSON.stringify(ruLessons[i]);
    const b = JSON.stringify(enLessons[i]);
    if (a !== b) {
      errors.push(`${id}: lesson #${i} (${ruLessons[i].id} vs ${enLessons[i].id}) shape mismatch:\n  ru: ${a}\n  en: ${b}`);
    }
  }
}

if (errors.length > 0) {
  console.error("i18n parity check FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
console.log(`i18n parity check OK (${MODULE_IDS.length} modules)`);
