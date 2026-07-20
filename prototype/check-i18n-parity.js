#!/usr/bin/env node
// Verifies that content/courses/{courseId}/ru/*.json and content/courses/{courseId}/en/*.json
// stay structurally in sync: same modules, same lessons, same exercise/
// mastery-check shapes. Prose strings are intentionally NOT compared (that's
// the part that's supposed to differ between locales).
// Usage: node prototype/check-i18n-parity.js [--course cpp26|cpp23|all]

const fs = require("fs");
const path = require("path");

// Parse --course argument
let courseArg = "cpp26"; // default
const courseIdx = process.argv.indexOf("--course");
if (courseIdx !== -1 && courseIdx + 1 < process.argv.length) {
  courseArg = process.argv[courseIdx + 1];
}

const validCourses = ["cpp20", "cpp26", "cpp23"];
const coursesToCheck = courseArg === "all" ? validCourses : [courseArg];

if (!validCourses.includes(courseArg) && courseArg !== "all") {
  console.error(`Invalid course: ${courseArg}. Must be: cpp20, cpp26, cpp23, or all`);
  process.exit(1);
}

const MODULE_IDS = ["m0", "m1", "m2", "m3", "m4", "m5", "m6", "m7", "m8", "m9", "m10"];

let errors = [];

function load(courseId, locale, id) {
  const file = path.join(__dirname, "..", "content", "courses", courseId, locale, `${id}.json`);
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
    masteryQuestions: l.masteryCheck ? l.masteryCheck.questions.map(describeQuestion) : null,
  };
}

for (const courseId of coursesToCheck) {
  for (const id of MODULE_IDS) {
    const ru = load(courseId, "ru", id);
    const en = load(courseId, "en", id);

    if (ru.id !== en.id || ru.moduleNumber !== en.moduleNumber) {
      errors.push(`[${courseId}] ${id}: module id/number mismatch (ru=${ru.id}/${ru.moduleNumber}, en=${en.id}/${en.moduleNumber})`);
    }

    const ruLessons = (ru.lessons || []).map(describeLesson);
    const enLessons = (en.lessons || []).map(describeLesson);

    if (ruLessons.length !== enLessons.length) {
      errors.push(`[${courseId}] ${id}: lesson count mismatch (ru=${ruLessons.length}, en=${enLessons.length})`);
      continue;
    }

    for (let i = 0; i < ruLessons.length; i++) {
      const a = JSON.stringify(ruLessons[i]);
      const b = JSON.stringify(enLessons[i]);
      if (a !== b) {
        errors.push(`[${courseId}] ${id}: lesson #${i} (${ruLessons[i].id} vs ${enLessons[i].id}) shape mismatch:\n  ru: ${a}\n  en: ${b}`);
      }
    }
  }

  if (errors.length === 0) {
    console.log(`[${courseId}] i18n parity OK (${MODULE_IDS.length} modules)`);
  }
}

if (errors.length > 0) {
  console.error("i18n parity check FAILED:\n" + errors.join("\n"));
  process.exit(1);
}
