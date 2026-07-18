#!/usr/bin/env node

/**
 * Create C++23 course stub files (11 modules × 2 locales = 22 JSON files)
 *
 * Module structure (30 lessons total):
 *  - m0: 1 lesson  (Context)
 *  - m1: 5 lessons (Language improvements)
 *  - m2: 3 lessons (Deducing this)
 *  - m3: 2 lessons (std::expected)
 *  - m4: 4 lessons (Ranges C++23)
 *  - m5: 2 lessons (std::mdspan)
 *  - m6: 2 lessons (Formatting)
 *  - m7: 4 lessons (Containers and utilities)
 *  - m8: 2 lessons (std::generator)
 *  - m9: 3 lessons (Numbers and low-level)
 *  - m10: 2 lessons (Removed/deprecated, conclusion)
 */

const fs = require('fs');
const path = require('path');

// Module metadata: { lessons: N, title_en: string, title_ru: string, significance: string }
const MODULES = [
  { lessons: 1, title_en: "C++23 Context", title_ru: "Контекст C++23", significance: "intro" },
  { lessons: 5, title_en: "Language improvements", title_ru: "Языковые улучшения", significance: "basic" },
  { lessons: 3, title_en: "Deducing this", title_ru: "Deducing this", significance: "flagship" },
  { lessons: 2, title_en: "std::expected", title_ru: "std::expected", significance: "flagship" },
  { lessons: 4, title_en: "Ranges C++23", title_ru: "Ranges C++23", significance: "important" },
  { lessons: 2, title_en: "std::mdspan", title_ru: "std::mdspan", significance: "important" },
  { lessons: 2, title_en: "Formatting and output", title_ru: "Форматирование и вывод", significance: "basic" },
  { lessons: 4, title_en: "Containers and utilities", title_ru: "Контейнеры и утилиты", significance: "important" },
  { lessons: 2, title_en: "std::generator", title_ru: "std::generator", significance: "flagship" },
  { lessons: 3, title_en: "Numbers and low-level", title_ru: "Числа и низкоуровневое", significance: "special" },
  { lessons: 2, title_en: "Removed and deprecated", title_ru: "Удалённое и устаревшее", significance: "closing" }
];

/**
 * Generate a stub module JSON object
 */
function generateModuleStub(moduleNumber, moduleData, locale) {
  const isEn = locale === 'en';
  const title = isEn ? moduleData.title_en : moduleData.title_ru;

  const lessons = [];
  for (let lessonNum = 1; lessonNum <= moduleData.lessons; lessonNum++) {
    lessons.push({
      id: `m${moduleNumber}-l${lessonNum}`,
      title: `${title} - Lesson ${lessonNum}`,
      stub: true
    });
  }

  return {
    id: `m${moduleNumber}`,
    moduleNumber: moduleNumber,
    title: title,
    significance: moduleData.significance,
    prerequisites: moduleNumber > 0 ? [`m${moduleNumber - 1}`] : [],
    lessons: lessons
  };
}

/**
 * Ensure directory exists
 */
function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

/**
 * Main script
 */
async function main() {
  const baseDir = path.join(__dirname, '..', 'content', 'courses', 'cpp23');

  ensureDir(baseDir);

  let count = 0;
  const locales = ['ru', 'en'];

  for (let moduleNum = 0; moduleNum < MODULES.length; moduleNum++) {
    const moduleData = MODULES[moduleNum];

    for (const locale of locales) {
      const moduleStub = generateModuleStub(moduleNum, moduleData, locale);

      const localeDir = path.join(baseDir, locale);
      ensureDir(localeDir);

      const filePath = path.join(localeDir, `m${moduleNum}.json`);
      const content = JSON.stringify(moduleStub, null, 2) + '\n';

      fs.writeFileSync(filePath, content, 'utf8');
      console.log(`created ${path.relative(process.cwd(), filePath)}`);

      count++;
    }
  }

  console.log(`\ndone — ${count} stub files created`);
}

main().catch(err => {
  console.error('Error:', err);
  process.exit(1);
});
