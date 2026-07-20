# План курса: C++20 для разработчиков на C++17

**Статус:** черновик (исследовательский документ)
**Дата:** июль 2026
**Автор:** архитектурный анализ для расширения проекта

> Этот документ — исследование и план, не реализация. Совместим с уже принятыми решениями проекта (движок `cpp26-engine.jsx`, контент-директория `content/courses/`, схема уроков из `CONTENT_GUIDE.md`). Инфраструктура курсов уже готова — добавить C++20 означает создать контент, не переделывать движок.

---

# ЧАСТЬ A. Обзор фич C++20

## A1. Целевая аудитория и базовая планка

**Базовая планка входа:** уверенный C++17.

Что «уверенный C++17» означает конкретно — читатель знаком с:
- Structured bindings, `if` с инициализатором, `std::optional`, `std::variant`, `std::string_view`
- `std::filesystem`, parallel algorithms (базово)
- Fold-expressions, CTAD, `if constexpr`
- `std::invoke`, `std::apply`, политики аллокаторов
- Шаблоны C++14 (variable templates, generic lambdas) — само собой

Что из C++17 **не** предполагается глубоким:
- Детали parallel algorithms — только знакомство
- PMR (polymorphic memory resource) — не требуется

**Следствия для плана:**
- C++14/17: не объясняем с нуля.
- Фоновые блоки (`background`) — только там, где C++17-деталь нетривиальна и без неё C++20-фича непонятна.
- C++20: изучаем полностью, от мотивации до продвинутых нюансов.

**Педагогическая логика:** фоновая врезка описывает *ограничение*, которое C++20 снимает — не повторяет курс C++17.

---

## A2. Четыре флагмана C++20

C++20 — крупнейший мажорный релиз после C++11. Он принёс **четыре** флагманских фичи, каждая из которых сопоставима по масштабу с целым предыдущим стандартом:

| Флагман | Proposal | Масштаб |
|---------|----------|---------|
| **Concepts** | P0734 + ~30 смежных | Системная реформа шаблонной метапрограммирования |
| **Ranges** | P0896 | Системная реформа алгоритмов и итераторов |
| **Coroutines** | P0912 | Новый механизм выполнения (без готовых типов) |
| **Modules** | P1103 | Системная реформа единиц трансляции |

В отличие от C++23 (три флагмана, относительно компактные), C++20 — реформа сразу в четырёх направлениях. Это делает курс C++20 крупнее и требует больше уроков на флагманы.

---

## A3. Языковые фичи C++20

| Фича | Proposal | Размер | Фоновый блок |
|------|----------|--------|--------------|
| **Concepts** (`concept`, `requires`) | P0734 | флагманская | SFINAE/enable_if (C++14/17) |
| **Coroutines** (`co_yield`, `co_return`, `co_await`) | P0912 | флагманская | нет |
| **Modules** (`module`, `import`, `export`) | P1103 | флагманская | нет |
| Three-way comparison `<=>` (spaceship) | P0515 | средняя | comparison operators (C++17) |
| Designated initializers | P0329 | мелкая | aggregate init (C++11) |
| `consteval` / `constinit` | P1073, P1143 | средняя | `constexpr` (C++14) |
| `std::is_constant_evaluated` | P0595 | мелкая | `constexpr` (C++14) |
| Template lambdas `[]<typename T>(...)` | P0428 | мелкая | lambdas (C++14) |
| Lambda `[=, this]` capture fix | P0409 | мелкая | lambdas (C++11) |
| Non-type template parameters: strings, classes | P0732, P1907 | средняя | NTTP (C++17) |
| Abbreviated function templates (`auto`) | P1141 | мелкая | function templates |
| `[[likely]]` / `[[unlikely]]` | P0479 | мелкая | нет |
| `[[no_unique_address]]` | P0840 | мелкая | EBO (C++11 idiom) |
| `using enum` | P1099 | мелкая | нет |
| `char8_t` | P0482 | мелкая | char encoding |
| Aggregate initialization with base classes | P1946 | мелкая | нет |
| `volatile` deprecation (первая волна) | P1764 | мелкая | нет |
| Spaceship for standard library types | P1614 | мелкая | нет |
| `concept` в `requires`-выражениях | P0734 | (входит в Concepts) | — |

---

## A4. Стандартная библиотека — утилиты

| Фича | Proposal | Размер | Фоновый блок |
|------|----------|--------|--------------|
| **`std::format`** | P0645 | флагман-adjacent | `printf`, `std::to_string` |
| **`std::span`** | P0122 | средняя | `T*` + size pairing idiom |
| **Ranges library** | P0896 | флагманская | STL algorithms (C++17) |
| `std::jthread` / `std::stop_token` | P0660 | средняя | `std::thread` (C++11) |
| `std::counting_semaphore`, `std::latch`, `std::barrier` | P1135 | средняя | `std::mutex`/`condition_variable` |
| `std::atomic_ref<T>` | P0019 | средняя | `std::atomic<T>` (C++11) |
| Calendar types в `<chrono>` | P0355 | большая | `std::chrono::duration` |
| Timezones: `std::chrono::time_zone` | P0355 | средняя | Calendar (C++20) |
| `std::source_location` | P1208 | мелкая | `__FILE__`/`__LINE__` |
| `std::bit_cast<T>` | P0476 | мелкая | `memcpy`-reinterpret idiom |
| `std::endian` | P0463 | мелкая | нет |
| Bit operations (`popcount`, `countl_zero`, etc.) | P0553 | мелкая | нет |
| `std::has_single_bit`, `std::bit_ceil/floor` | P0556 | мелкая | нет |
| `std::numbers` (π, e, √2, …) | P0631 | мелкая | нет |
| `std::midpoint`, `std::lerp` | P0811 | мелкая | нет |
| `std::erase` / `std::erase_if` | P1209 | мелкая | erase-remove idiom |
| `std::to_address` | P0653 | мелкая | `std::addressof` |
| `std::assume_aligned<N>` | P1007 | мелкая | `__builtin_assume_aligned` |
| `std::ssize` | P1227 | мелкая | `.size()` sign-compare |
| `starts_with` / `ends_with` для string | P0457 | мелкая | нет |
| `std::make_shared_for_overwrite` | P1020 | мелкая | `std::make_shared` |
| `std::remove_cvref_t` | P0550 | мелкая | type traits |
| `std::is_constant_evaluated` | P0595 | мелкая | `constexpr` |
| `std::identity` | P0777 | мелкая | нет |

---

## A5. Ranges — детализация

Ranges C++20 — самая широкая по охвату фича в части стандартной библиотеки. Фактически это замена всей системы алгоритмов + новый уровень абстракции (views).

| Категория | Что входит |
|-----------|-----------|
| **Концепты ranges** | `std::ranges::range`, `sized_range`, `view`, `viewable_range`, `input_range`, `forward_range`, `bidirectional_range`, `random_access_range`, `contiguous_range`, `common_range` |
| **Ranges-алгоритмы** | Все 100+ алгоритмов из `<algorithm>` в namespace `std::ranges`: `sort`, `find`, `for_each`, `transform`, `copy_if` и т.д. Поддерживают проекции и сентинелы |
| **Views (адаптеры)** | `views::filter`, `views::transform`, `views::take`, `views::drop`, `views::take_while`, `views::drop_while`, `views::reverse`, `views::join`, `views::split`, `views::keys`, `views::values`, `views::elements`, `views::iota`, `views::istream`, `views::counted`, `views::common`, `views::all`, `views::ref` |
| **Range factories** | `views::empty`, `views::single`, `views::iota`, `views::istream` |
| **Pipe syntax** | `range \| views::filter(f) \| views::transform(g)` |
| **Проекции** | `std::ranges::sort(v, {}, &Person::name)` — алгоритм с извлекателем поля |
| **Сентинелы** | Разделение типов итератора и конца диапазона |
| **`std::span`** | Non-owning contiguous range |

---

## A6. Coroutines — детализация

C++20 добавил механизм корутин, но **не** готовые типы для их использования. Это создаёт педагогическую сложность: корутины без стандартной поддерживающей библиотеки (как `std::generator`, который появился только в C++23) требуют написания `promise_type` вручную.

| Что есть в C++20 | Что НЕТ в C++20 (появилось позже) |
|------------------|-----------------------------------|
| `co_yield`, `co_return`, `co_await` — ключевые слова | `std::generator<T>` (C++23) |
| `std::coroutine_handle<T>` | `std::task<T>` (нет даже в C++26) |
| `std::coroutine_traits<T>` | `std::async_generator` |
| `std::suspend_always`, `std::suspend_never` | Любой готовый executor |
| Механизм promise_type | |

**Педагогическая стратегия:** обучать механизму корутин на примере написания минимального generator вручную (50-100 строк). Это единственный способ — стандартная библиотека C++20 не предоставляет готовых корутинных типов. После прохождения C++20-курса студент будет понимать, почему `std::generator` в C++23 — это такое облегчение.

---

## A7. Modules — особый статус

Modules — самая спорная фича C++20 с точки зрения практического преподавания:

**Сильные стороны:**
- Радикально ускоряют компиляцию при правильном использовании
- Устраняют проблемы с `#include` (ODR violations, macros leakage)
- Будущее C++: C++23/26 продолжают развивать модули

**Проблемы для курса:**
- Compiler Explorer поддержка нестабильна — не все примеры верифицируемы через Godbolt API
- Build system интеграция (CMake/Ninja/MSVC) критична, но недоступна в браузере
- Adoption rate в реальных проектах: по состоянию на 2026 год большинство open-source проектов всё ещё используют `#include`

**Решение:** модуль по Modules включён, но:
- Упор на синтаксис и концепции, а не на build system setup
- Примеры — самодостаточные однофайловые `module`-блоки, верифицируемые на Clang trunk (`-std=c++20`)
- Честная оговорка: full modules workflow требует build system поддержки, не рассматриваемой в курсе

---

## A8. Concurrency — что нового в C++20

| Фича | Что решает |
|------|-----------|
| `std::jthread` | `std::thread` без риска terminate() при забытом join/detach |
| `std::stop_token` + `std::stop_source` | Стандартизированная кооперативная отмена |
| `std::counting_semaphore<N>` | Семафор с compile-time максимумом (или runtime через `std::binary_semaphore`) |
| `std::latch` | Одноразовый счётчик до нуля — синхронизировать N завершений |
| `std::barrier` | Многоразовый barrer — синхронизировать фазы parallel алгоритма |
| `std::atomic_ref<T>` | Атомарный доступ к **не**-атомарной переменной по ссылке |
| `std::atomic<shared_ptr<T>>` | Атомарный `shared_ptr` без отдельного mutex |
| `std::atomic<weak_ptr<T>>` | Аналогично для `weak_ptr` |
| Waiting на atomic (`wait`/`notify_one`/`notify_all`) | Futex-like API без condition_variable |

---

## A9. `<chrono>` Calendar и Timezones

C++20 расширил `<chrono>` почти до полноценной библиотеки работы с датой/временем:

| Что добавлено | Пример |
|---------------|--------|
| `std::chrono::year_month_day` | `2026y/July/20d` |
| `std::chrono::month_day`, `year_month` | `January/1d`, `2026y/March` |
| `std::chrono::weekday` | `Monday`, `std::chrono::Sunday` |
| `std::chrono::last` | `2026y/January/last` — последний день месяца |
| `std::chrono::hh_mm_ss` | Разбивка duration на часы/минуты/секунды |
| `std::chrono::time_zone` | IANA timezone database |
| `std::chrono::zoned_time` | Время с привязкой к timezone |
| `std::chrono::clock_cast` | Конвертация между clock типами |
| `std::chrono::is_clock` | Concept для clock |
| Форматирование через `std::format` | `std::format("{:%Y-%m-%d}", ymd)` |

Это одна из самых обширных добавок стандартной библиотеки — достаточно для 2-3 уроков.

---

# ЧАСТЬ B. Модульный план курса C++20

## B1. Карта модулей

| # | Модуль | Уровень | Зависит от | Уроков |
|---|--------|---------|------------|--------|
| 0 | Контекст C++20 | вводный | — | 1 |
| 1 | Языковые улучшения | базовый | 0 | 5 |
| 2 | **Concepts** | флагманский #1 | 1 | 4 |
| 3 | **Ranges** | флагманский #2 | 1, 2 | 5 |
| 4 | **Coroutines** | флагманский #3 | 1 | 3 |
| 5 | **Modules** | флагманский #4 | 1 | 2 |
| 6 | `std::format` и `std::span` | важный | 1 | 2 |
| 7 | Concurrency C++20 | важный | 1 | 3 |
| 8 | `<chrono>`: календарь и timezones | специальный | 1 | 3 |
| 9 | Низкоуровневые утилиты | специальный | 1 | 3 |
| 10 | Удалённое, устаревшее, итог | завершающий | 1–9 | 2 |

**Итого: 11 модулей, 33 урока.**

---

## B2. Детальный план по модулям

---

### Модуль 0 — Контекст C++20 (вводный)

**Зависимости:** нет  
**Уроков:** 1

#### m0-l1 — «Контекст C++20»
- **Что изучается:** История C++20 — ратифицирован в 2020 году (ISO/IEC 14882:2020), работа началась в 2017-м. Четыре флагмана и почему каждый из них системный. Как C++20 соотносится с C++17 и C++23. Базовая планка курса. Структура модулей и порядок изучения.
- **Особенность:** Нет кода, ориентационный урок.
- **Ожидаемый выход:** Студент понимает масштаб C++20 и план курса.

---

### Модуль 1 — Языковые улучшения

**Зависимости:** модуль 0  
**Уроков:** 5  
**Значимость:** базовый

#### m1-l1 — «Трёхстороннее сравнение: оператор `<=>`»
- **Что изучается:**
  - Spaceship-оператор `<=>` (P0515): вместо 6 операторов — один `<=>`; компилятор выводит остальные.
  - `std::strong_ordering`, `std::weak_ordering`, `std::partial_ordering` — что означает каждый, когда какой выбирать.
  - `= default` для `<=>` — автоматическое поочерёдное сравнение всех полей.
  - `<=>` в стандартной библиотеке: теперь все стандартные типы его поддерживают.
  - Правила heterogeneous comparison: `operator==` vs `operator<=>`.
- **Фоновый блок:** нет (операторы сравнения C++17 — базовая планка).
- **Размер:** средняя → 3 примера + 3 задачи.

#### m1-l2 — «Designated initializers, aggregate improvements, `using enum`»
- **Что изучается:**
  - Designated initializers (P0329): `Point p{.x=1, .y=2}`. Правила: по порядку, не смешивать с позиционными.
  - Aggregate initialization с базовыми классами (P1946): раньше — нельзя, теперь — можно.
  - `using enum` (P1099): `using enum Color; auto c = Red;` — убирает префикс в switch/if.
  - `std::ssize` (P1227): `std::ssize(v)` возвращает знаковый размер — конец `-Wsign-compare` предупреждениям.
- **Фоновый блок:** нет.
- **Размер:** 4 мелких → 2 примера + 3 задачи.

#### m1-l3 — «`consteval`, `constinit`, `std::is_constant_evaluated`»
- **Что изучается:**
  - `consteval` (P1073): функция, вызываемая **только** во время компиляции. Отличие от `constexpr` (может выполняться в runtime).
  - `constinit` (P1143): переменная, **инициализируемая** только константным выражением, но изменяемая в runtime. Решает static initialization order fiasco.
  - `std::is_constant_evaluated()` (P0595): ветвление внутри `constexpr`-функции — «сейчас компиляция или runtime?» Предшественник C++23's `if consteval`.
  - Связь между тремя механизмами: когда что применять.
- **Фоновый блок:** краткое напоминание `constexpr` C++14/17 (1-2 предложения).
- **Размер:** средняя → 3 примера + 3 задачи.

#### m1-l4 — «Lambda improvements: template lambdas, `[=, this]`»
- **Что изучается:**
  - Template lambdas (P0428): `[]<typename T>(T x) { ... }` — явный параметр типа в лямбде. До C++20: только `auto` (нет имени типа).
  - `[=, this]` (P0409): явный захват `this` при `[=]`. В C++20 `[=]` deprecates implicit `this` capture — нужно писать `[=, this]`.
  - `[=, this]` vs `[=]` vs `[&, this]` — чёткие различия.
  - Stateless lambdas как NTTP: лямбда без capture может быть шаблонным параметром.
- **Фоновый блок:** нет (lambdas C++11/14 — базовая планка).
- **Размер:** средняя → 2 примера + 3 задачи.

#### m1-l5 — «`[[likely]]`/`[[unlikely]]`, `[[no_unique_address]]`, bit operations»
- **Что изучается:**
  - `[[likely]]` / `[[unlikely]]` (P0479): подсказка компилятору для оптимизации ветвления. Применение: hot path, холодная ветка обработки ошибок.
  - `[[no_unique_address]]` (P0840): поле с этим атрибутом может разделять адрес с другим полем (EBO для не-базовых классов). Экономия памяти в generic типах.
  - Bit operations в `<bit>`: `std::popcount`, `std::countl_zero`, `std::countr_zero`, `std::has_single_bit`, `std::bit_ceil`, `std::bit_floor`, `std::bit_width`, `std::rotl`, `std::rotr`.
  - `std::endian`: `std::endian::little`, `std::endian::big`, `std::endian::native` — compile-time определение порядка байт платформы.
- **Фоновый блок:** нет.
- **Размер:** 4 мелких/средних → 2 примера + 3 задачи.

---

### Модуль 2 — Concepts *(флагман #1)*

**Зависимости:** модуль 1  
**Уроков:** 4  
**Значимость:** флагманский

Concepts — самая революционная реформа шаблонного программирования с момента появления шаблонов в C++98. До Concepts: SFINAE, `std::enable_if`, `void_t`, `detected_t` — 20 лет сложных идиом. После: читаемые ограничения, понятные ошибки компиляции.

#### m2-l1 — «Синтаксис: `concept`, `requires`, стандартные концепты»
- **Что изучается:**
  - `concept C = requires-expression`: определение концепта.
  - `requires`-выражение: simple, type, compound, nested — четыре вида требований.
  - Использование концепта как ограничения: `template<C T>`, `void f(C auto x)`, `requires C<T>` в конце.
  - Стандартные концепты из `<concepts>`: `std::integral`, `std::floating_point`, `std::same_as`, `std::derived_from`, `std::convertible_to`, `std::constructible_from`, `std::copyable`, `std::movable`, `std::regular`.
  - Концепты из `<iterator>` и `<ranges>`.
- **Фоновый блок:** SFINAE / `std::enable_if` — краткое «вот какой была жизнь до», чтобы мотивировать концепты.
- **Размер:** средняя → 3 примера + 3 задачи.

#### m2-l2 — «Ограниченные шаблоны: requires-clause, abbreviated function templates»
- **Что изучается:**
  - Четыре синтаксиса ограничения: `template<concept T>`, `requires clause` в конце, `auto` с концептом, `concept auto`.
  - Abbreviated function templates: `void f(std::integral auto x)` — эквивалент `template<std::integral T> void f(T x)`.
  - `requires`-clause vs концепт в параметре: семантика одинакова, синтаксис разный.
  - Ограничения на методы класса: `void method() requires SomeConcept<T>`.
  - Non-type template parameters с концептами: `template<std::integral auto N>`.
- **Фоновый блок:** нет (шаблоны C++17 — базовая планка).
- **Размер:** средняя → 3 примера + 4 задачи.

#### m2-l3 — «Subsumption, conjunction, disjunction и перегрузка»
- **Что изучается:**
  - Subsumption: если концепт A включает требования концепта B, то A «сильнее» B. Компилятор выбирает более constrained перегрузку автоматически.
  - `&&` и `||` в концептах: `concept C = A && B` — conjunction; `concept C = A || B` — disjunction.
  - Почему subsumption работает только через концепты, не через произвольные requires-выражения (неатомарные requires не частично упорядочены).
  - Перегрузка по концепту: замена SFINAE-перегрузок читаемым кодом.
  - Diagnostics: что показывает компилятор при нарушении концепта.
- **Фоновый блок:** нет.
- **Размер:** средняя → 3 примера + 4 задачи + challenge.

#### m2-l4 — «Продвинутые паттерны: концепты в классах, ranges-концепты, пользовательские концепты»
- **Что изучается:**
  - Концепты в параметрах класса: `template<std::regular T> class Container`.
  - CRTP-альтернативы через концепты (preview того, что `deducing this` завершит в C++23).
  - Ranges-концепты: `std::ranges::range`, `std::ranges::sized_range`, `std::ranges::input_range` и т.д. — система концептов, описывающая итерируемость.
  - Написание пользовательского концепта с проверкой интерфейса: `Hashable`, `Printable`, `Container`.
  - Ограничения и взаимодействие с `auto`-возвратом функций.
- **Фоновый блок:** нет.
- **Размер:** средняя+ → 4 примера + 4 задачи + challenge.

---

### Модуль 3 — Ranges *(флагман #2)*

**Зависимости:** модули 1, 2 (концепты нужны для понимания ranges-концептов)  
**Уроков:** 5  
**Значимость:** флагманский

Ranges C++20 — полная замена системы алгоритмов STL: новый namespace `std::ranges`, проекции, сентинелы, lazy views. C++23 расширит ranges (20+ новых views), поэтому C++20-курс закладывает фундамент.

#### m3-l1 — «Ranges concepts: range, view, range algorithms»
- **Что изучается:**
  - Что такое range: пара `begin()`/`end()` или range concept. Отличие от контейнера.
  - Иерархия range-концептов: `input_range` → `forward_range` → `bidirectional_range` → `random_access_range` → `contiguous_range`.
  - `std::ranges` алгоритмы vs `std::` алгоритмы: принимают range целиком, поддерживают проекции, возвращают итератор или subrange.
  - Проекции: `std::ranges::sort(v, {}, &Person::age)` — сортировка без `.` + лямбды.
  - Сентинелы: тип `end()` может отличаться от типа `begin()` (раньше — обязательно одинаковые).
- **Фоновый блок:** STL алгоритмы (C++17) — 1 абзац напоминания о проблеме «передать begin/end явно».
- **Размер:** средняя → 3 примера + 3 задачи.

#### m3-l2 — «Views: `filter`, `transform`, `take`, `drop`, pipe syntax»
- **Что изучается:**
  - `views::filter(pred)` — lazy фильтрация.
  - `views::transform(f)` — lazy маппинг.
  - `views::take(n)` / `views::drop(n)` — ограничение range.
  - `views::take_while(pred)` / `views::drop_while(pred)`.
  - Pipe-синтаксис `range | view1 | view2`: как это работает (каждый view — не трансформация данных, а обёртка итератора).
  - Ленивость: view не выполняет работу до итерации. Когда это преимущество, когда — ловушка.
- **Фоновый блок:** нет.
- **Размер:** средняя → 3 примера + 4 задачи.

#### m3-l3 — «Составные views: `join`, `split`, `reverse`, `keys`/`values`/`elements`»
- **Что изучается:**
  - `views::join` — flatten вложенных ranges в один.
  - `views::split(delim)` — разбить range по разделителю (возвращает range of ranges).
  - `views::reverse` — обратный итератор.
  - `views::keys` / `views::values` — представления ключей/значений `map`-like контейнеров.
  - `views::elements<N>` — N-й элемент tuple-like диапазона.
  - `views::counted(it, n)` — range из итератора + количество.
  - `views::iota(a, b)` — генерация последовательности чисел.
  - `views::istream<T>(stream)` — range поверх `istream`.
- **Фоновый блок:** нет.
- **Размер:** средняя → 3 примера + 4 задачи + challenge.

#### m3-l4 — «`std::span`: non-owning contiguous view»
- **Что изучается:**
  - `std::span<T>` и `std::span<T, N>` — ненулевое владение нет, contiguous_range.
  - Статический (`std::span<T, 5>`) vs динамический (`std::span<T>`) extent.
  - Конвертация из `T[]`, `std::array`, `std::vector`, `std::string`.
  - `first(n)`, `last(n)`, `subspan(offset, count)`.
  - `as_bytes` / `as_writable_bytes` — работа с raw памятью.
  - Зачем нужен: замена `T* data, size_t size` парам в API. Безопаснее и выразительнее.
  - `std::span` как `contiguous_range` — работает со всеми ranges-алгоритмами.
- **Фоновый блок:** нет (`T*` + size — базовая планка).
- **Размер:** средняя → 3 примера + 3 задачи.

#### m3-l5 — «Ranges deep dive: custom ranges, sentinels, `std::ranges::subrange`»
- **Что изучается:**
  - Создание пользовательского range: `begin()`, `end()`, iterator + sentinel.
  - `std::ranges::subrange`: обёртка над парой итератор+сентинел, представляющая range.
  - Cached views: почему некоторые views кешируют `begin()` и что это значит для const-correctness.
  - `views::ref` vs владеющий range.
  - `std::ranges::dangling` — защита от возврата dangling итератора из алгоритма.
  - `std::ranges::borrowed_range` — концепт, гарантирующий безопасность заимствования.
  - Практика: написать range-адаптор с нуля.
- **Фоновый блок:** нет.
- **Размер:** средняя+ → 4 примера + 4 задачи + challenge.

---

### Модуль 4 — Coroutines *(флагман #3)*

**Зависимости:** модуль 1  
**Уроков:** 3  
**Значимость:** флагманский

C++20 coroutines — механизм без готовых типов. Этот модуль обучает механизму: `promise_type`, `coroutine_handle`, кастомные генераторы. `std::generator` (C++23) — прямой потомок того, что студент напишет здесь.

#### m4-l1 — «Механика корутин: `co_yield`, `co_return`, `co_await`»
- **Что изучается:**
  - Что такое корутина: функция с приостановкой и возобновлением. Отличие от обычной функции и от `std::thread`.
  - `co_yield expr` — приостановить и произвести значение.
  - `co_return expr` — завершить корутину.
  - `co_await awaitable` — приостановить до завершения асинхронной операции.
  - Coroutine frame: где хранятся локальные переменные корутины (heap).
  - Функция — корутина если содержит любое из трёх ключевых слов.
  - `std::coroutine_handle<Promise>`: handle для управления жизнью корутины.
  - `std::suspend_always`, `std::suspend_never` — простейшие awaitable.
- **Фоновый блок:** нет (корутины — принципиально новый механизм).
- **Размер:** средняя → 3 примера + 3 задачи.

#### m4-l2 — «`promise_type`: пишем генератор с нуля»
- **Что изучается:**
  - `promise_type` — что это: структура, задающая поведение корутины. Обязательные методы: `get_return_object`, `initial_suspend`, `final_suspend`, `return_void`/`return_value`, `yield_value`, `unhandled_exception`.
  - Написать минимальный `Generator<T>` с нуля: 50-70 строк boilerplate, превращающих механику в удобный тип.
  - `coroutine_handle<>::resume()` и `coroutine_handle<>::done()`.
  - Как range-for работает с пользовательским генератором (через `begin()`/`end()`).
  - Lifetime: когда уничтожается coroutine frame.
  - RAII wrapper над `coroutine_handle` для безопасного владения.
- **Фоновый блок:** нет (m4-l1 уже объяснил механику).
- **Размер:** средняя+ → 3 примера + 4 задачи + challenge (написать Generator<T> с нуля).

#### m4-l3 — «Awaitables и async task: `co_await` на практике»
- **Что изучается:**
  - Что делает `co_await expr`: вызывает `operator co_await` или метод `await_transform` у promise. Цепочка: `await_ready`, `await_suspend`, `await_resume`.
  - Пользовательский awaitable: написать простой `Task<T>` для «синхронной» демонстрации.
  - `std::coroutine_handle<void>` — type-erased handle, используется в awaitable для возобновления.
  - Паттерн «symmetric transfer»: возобновление другой корутины из `await_suspend`.
  - Ограничения: нет стандартного executor в C++20/23 (появится в C++26 через `std::execution`). Как эмулировать простой single-threaded executor для учебных целей.
  - Почему C++23 добавил `std::generator` а не `std::task`: разные awaitable-паттерны.
- **Фоновый блок:** нет.
- **Размер:** средняя+ → 3 примера + 4 задачи.

---

### Модуль 5 — Modules *(флагман #4)*

**Зависимости:** модуль 1  
**Уроков:** 2  
**Значимость:** флагманский (с оговорками — см. A7)

#### m5-l1 — «Синтаксис модулей: `module`, `export`, `import`»
- **Что изучается:**
  - Module declaration: `module mylib;` — файл объявляет себя частью модуля.
  - `export` — что экспортировать: функции, классы, шаблоны, `export namespace`.
  - `import mylib;` — импортировать модуль.
  - Module interface unit vs module implementation unit: раздел на файлы.
  - Что модули дают: нет утечки макросов, нет повторного разбора headers, явный интерфейс.
  - Global module fragment `module;` — место для legacy `#include`.
  - Отличие от `#include`: компиляция единожды, не при каждом `#include`.
- **Фоновый блок:** нет (знакомство с `#include` guard / pragma once — базовая планка).
- **Компиляционная сложность:** высокая — примеры только для Clang trunk с `-std=c++20`.
- **Размер:** средняя → 3 примера + 3 задачи.

#### m5-l2 — «Module partitions, header units, практика»
- **Что изучается:**
  - Module partitions: `module mylib:impl;` — разбить большой модуль на части. `export import :impl;`.
  - Header units: `import <vector>;` — импорт стандартных заголовков как модуля (не везде поддержано).
  - `module :private;` — приватная часть модуля (не видна импортёрам даже на уровне имён).
  - Practical limitations: почему большинство проектов ещё на `#include`. Build system requirements.
  - `std` module (C++23 addition): `import std;` — вся стандартная библиотека как один модуль.
  - Миграционный путь: смешанный `#include` + `import`.
- **Фоновый блок:** нет.
- **Компиляционная сложность:** высокая.
- **Размер:** средняя → 2 примера + 3 задачи.

---

### Модуль 6 — `std::format` и `std::span`

**Зависимости:** модуль 1  
**Уроков:** 2  
**Значимость:** важный

> `std::format` — один из наиболее запрошенных добавок C++20. `std::span` уже рассмотрен в модуле 3 (как ranges), но здесь раскрывается его практическое использование как API-типа.

#### m6-l1 — «`std::format`: типобезопасный форматированный вывод»
- **Что изучается:**
  - `std::format(fmt, args...)` — возвращает `std::string`. `std::format_to(it, fmt, args...)` — пишет в итератор.
  - Синтаксис format-строк: `{}`, `{0}`, `{:.2f}`, `{:>10}`, `{:08x}`, `{:b}` и т.д.
  - Пользовательский `std::formatter<T>`: специализация для форматирования собственных типов.
  - `std::format_to_n` — ограничение длины вывода.
  - `std::formatted_size` — узнать размер без форматирования.
  - `std::vformat` / `std::make_format_args` — runtime format string (не compile-time checked).
  - Compile-time проверка format-строк (C++20 начало, C++23 улучшило).
  - Сравнение с `printf` (UB при ошибках типов), `std::to_string` (ограничено), `std::ostringstream` (медленно).
- **Фоновый блок:** нет (printf и ostringstream — базовая планка).
- **Размер:** средняя → 3 примера + 4 задачи.

#### m6-l2 — «`std::span` в API: практические паттерны»
- **Что изучается:**
  - Паттерн «span как параметр функции»: `void process(std::span<const int> data)` — принимает массив, вектор, std::array без копирования.
  - `span<const T>` vs `span<T>` — readonly vs мutable view.
  - `std::span<std::byte>` как типобезопасный буфер для сериализации.
  - Конвертация `span<T>` → `span<const std::byte>` через `std::as_bytes`.
  - Статический extent `span<T, N>` — compile-time гарантия размера.
  - `std::span` vs `std::string_view`: оба non-owning view, но разные типы.
  - Ловушки: `span` не владеет данными — dangling span если владелец уничтожен.
- **Фоновый блок:** нет (m3-l4 уже ввёл `std::span`; этот урок — практика).
- **Размер:** средняя → 3 примера + 3 задачи.

---

### Модуль 7 — Concurrency C++20

**Зависимости:** модуль 1  
**Уроков:** 3  
**Значимость:** важный

#### m7-l1 — «`std::jthread` и кооперативная отмена»
- **Что изучается:**
  - `std::jthread`: `std::thread` + автоматический `join` в деструкторе. Конец `terminate()` при забытом join.
  - `std::stop_token` / `std::stop_source` / `std::stop_callback`: стандартный механизм кооперативной отмены.
  - Паттерн: функция потока принимает `std::stop_token` и периодически проверяет `stop_requested()`.
  - `std::stop_callback`: вызывается при запросе отмены — для оповещения condition_variable.
  - `jthread` с stop_token: `std::jthread t(fn, arg)` — если fn принимает `stop_token` первым аргументом, jthread передаёт его автоматически.
- **Фоновый блок:** `std::thread` и `std::mutex` (C++11) — 1 абзац о проблеме «забытый join».
- **Размер:** средняя → 3 примера + 3 задачи.

#### m7-l2 — «`std::latch`, `std::barrier`, `std::counting_semaphore`»
- **Что изучается:**
  - `std::latch(n)`: одноразовый «обратный счётчик» — N потоков вызывают `count_down()`, все ждут на `wait()`. После обнуления — уже не сбрасывается.
  - `std::barrier(n, callback)`: многоразовый barrer — синхронизирует фазы parallel алгоритма. После того как все N потоков дошли до `arrive_and_wait()` — выполняется callback, затем начинается следующая фаза.
  - `std::counting_semaphore<Max>` и `std::binary_semaphore`: `acquire()` / `release()`. Ограничение конкурентного доступа к ресурсу.
  - Когда какой примитив: latch для «дождаться всех стартовых событий», barrier для итеративных алгоритмов, semaphore для ограничения параллелизма.
- **Фоновый блок:** `std::condition_variable` (C++11) — 1 абзац о том, что всё это раньше реализовывалось вручную.
- **Размер:** средняя → 3 примера + 3 задачи.

#### m7-l3 — «`std::atomic_ref`, `std::atomic<shared_ptr>`, atomic wait»
- **Что изучается:**
  - `std::atomic_ref<T>`: атомарный доступ к **неатомарной** переменной. Полезно когда переменная нужна и атомарно, и не-атомарно в зависимости от контекста.
  - `std::atomic<std::shared_ptr<T>>` (C++20 стандартизировал): lock-free счётчик ссылок. До C++20: `std::atomic_load(&sp)` (deprecated).
  - Atomic wait: `atomic<T>::wait(expected)` — блокировать поток пока значение не изменится. `notify_one()` / `notify_all()`. Эффективнее чем spin-wait.
  - `std::atomic_flag::test()` — теперь возвращает значение (C++20, раньше только `test_and_set`).
  - Memory ordering recap: acquire/release/seq_cst — краткое напоминание, не полный курс.
- **Фоновый блок:** `std::atomic<T>` (C++11) — 1 абзац о базовых атомарных операциях.
- **Размер:** средняя → 3 примера + 3 задачи.

---

### Модуль 8 — `<chrono>`: Календарь и Timezones

**Зависимости:** модуль 1  
**Уроков:** 3  
**Значимость:** специальный

C++20 превратил `<chrono>` из библиотеки duration/time_point в полноценную date-time библиотеку.

#### m8-l1 — «Типы дат: `year_month_day`, арифметика, `hh_mm_ss`»
- **Что изучается:**
  - Литеральный синтаксис: `2026y`, `July`, `20d`, `2026y/July/20d`.
  - `std::chrono::year_month_day` — тип даты. Конвертация в `std::chrono::sys_days` и обратно.
  - Арифметика дат: `ymd + std::chrono::months{3}`, `ymd + std::chrono::years{1}`.
  - `std::chrono::last`: `2026y/February/last` — последний день месяца.
  - `std::chrono::weekday`: `std::chrono::Monday`, проверка `ymd.weekday()`.
  - `std::chrono::hh_mm_ss<Duration>`: разбивка duration на часы, минуты, секунды, субсекунды.
  - Форматирование через `std::format`: `std::format("{:%Y-%m-%d}", ymd)`.
  - Валидация: `ymd.ok()` — проверить корректность даты (например, 2026-02-30 невалидна).
- **Фоновый блок:** `std::chrono::duration` и `time_point` (C++11) — 1 абзац.
- **Размер:** средняя → 3 примера + 3 задачи.

#### m8-l2 — «Timezones: `time_zone`, `zoned_time`, конвертация»
- **Что изучается:**
  - `std::chrono::get_tzdb()` — доступ к IANA timezone database.
  - `std::chrono::locate_zone("America/New_York")` — найти timezone по имени.
  - `std::chrono::zoned_time<Duration>`: пара time_point + timezone. Хранит local time в конкретной зоне.
  - Конвертация: `std::chrono::zoned_time zt{zone, sys_time}` и `zt.get_local_time()`.
  - `std::chrono::clock_cast`: конвертация между `system_clock`, `utc_clock`, `tai_clock`, `gps_clock`.
  - Летнее время (DST): `std::chrono::zoned_time` автоматически учитывает переходы.
  - Форматирование: `std::format("{:%Z %Y-%m-%d %H:%M}", zt)`.
- **Фоновый блок:** нет (m8-l1 уже ввёл новые date типы).
- **Размер:** средняя → 3 примера + 3 задачи.

#### m8-l3 — «`<chrono>` в практике: измерение, сравнение, сериализация»
- **Что изучается:**
  - `std::chrono::system_clock::now()` и работа с `sys_time<Duration>`.
  - `std::chrono::steady_clock` vs `system_clock` — когда что использовать.
  - `std::chrono::duration_cast` и `std::chrono::round`, `floor`, `ceil` для duration.
  - Сериализация дат: парсинг через `std::chrono::parse` (C++20).
  - Практика: написать функцию «сколько дней до события» и «в каком часовом поясе сейчас полночь».
- **Фоновый блок:** нет.
- **Размер:** средняя → 3 примера + 3 задачи.

---

### Модуль 9 — Низкоуровневые утилиты

**Зависимости:** модуль 1  
**Уроков:** 3  
**Значимость:** специальный

#### m9-l1 — «`std::bit_cast`, `std::source_location`, `std::numbers`»
- **Что изучается:**
  - `std::bit_cast<To>(from)` (P0476): reinterpret данных без UB. `memcpy`-семантика, но типобезопасно и `constexpr`. Применение: работа с IEEE 754 битами float, сетевые протоколы.
  - `std::source_location` (P1208): замена `__FILE__`/`__LINE__`/`__FUNCTION__`. Используется по умолчанию в сигнатуре: `void log(std::string_view msg, std::source_location loc = std::source_location::current())`.
  - `std::numbers`: математические константы — `std::numbers::pi`, `std::numbers::e`, `std::numbers::sqrt2`, `std::numbers::phi`, `std::numbers::log2e` и др. Все — `double` и `long double` варианты.
- **Фоновый блок:** нет.
- **Размер:** 3 мелких → 2 примера + 3 задачи.

#### m9-l2 — «`std::midpoint`, `std::lerp`, `std::erase`/`erase_if`, `std::to_address`»
- **Что изучается:**
  - `std::midpoint(a, b)` (P0811): среднее без переполнения — правильно для целых и указателей. Классическая ошибка `(a + b) / 2` при больших значениях.
  - `std::lerp(a, b, t)` (P0811): линейная интерполяция. Гарантировано не выходит за [a, b] при t ∈ [0, 1]. Нет UB при `a == b`.
  - `std::erase(container, value)` / `std::erase_if(container, pred)` (P1209): замена erase-remove idiom. `v.erase(std::remove_if(...))` → `std::erase_if(v, pred)`.
  - `std::to_address(ptr)` (P0653): получить raw pointer из умного указателя или fancy pointer. Нужно для generic кода, работающего с любым Pointer-концептом.
  - `std::assume_aligned<N>(ptr)` (P1007): подсказка компилятору об выравнивании указателя.
- **Фоновый блок:** нет.
- **Размер:** 5 мелких → 2 примера + 3 задачи.

#### m9-l3 — «String/container improvements и прочие мелочи»
- **Что изучается:**
  - `std::string::starts_with` / `ends_with` (P0457): появились в C++20, не C++23. Проверка префикса/суффикса.
  - `std::make_shared_for_overwrite<T>()` (P1020): не инициализирует память — для случаев, когда объект будет немедленно перезаписан.
  - `std::remove_cvref_t<T>` (P0550): комбинированный trait — убирает const, volatile и ссылку.
  - `std::is_bounded_array`, `std::is_unbounded_array` (P1357): различение `T[N]` и `T[]`.
  - `std::identity` (P0777): identity-функтор `std::identity{}(x) == x`. Дефолтный проектор в ranges-алгоритмах.
  - Стандартная библиотека: `<=>` для всех контейнеров, `std::map::contains`, `std::set::contains`.
- **Фоновый блок:** нет.
- **Размер:** 6 мелких → 2 примера + 2 задачи.

---

### Модуль 10 — Удалённое, устаревшее, итог

**Зависимости:** модули 1–9  
**Уроков:** 2  
**Значимость:** завершающий

#### m10-l1 — «Deprecated и removed в C++20»
- **Что изучается:**
  - `volatile` первая волна deprecation (P1764): deprecated в параметрах функций, возвращаемых типах, составных присваиваниях (`volatile int i; i += 1;` — deprecated).
  - `std::iterator` base class — deprecated. Теперь достаточно определить нужные типы напрямую.
  - Raw string и `char*` literals: конкатенация с `auto` — ill-formed в некоторых контекстах.
  - `std::allocator<T>::construct`/`destroy` — deprecated (используйте `std::allocator_traits`).
  - `std::result_of<F(Args...)>` — deprecated, заменён на `std::invoke_result`.
  - `std::is_pod` — deprecated (слишком широкая категория, бесполезная на практике).
  - Удалены: `std::random_shuffle` (было deprecated в C++14), `std::binary_function`, `std::unary_function`.
- **Ожидаемый выход:** студент знает что убрать при миграции на C++20.
- **Размер:** средняя → 2 примера + 3 задачи.

#### m10-l2 — «C++20 в контексте: что это изменило и путь к C++23/26»
- **Что изучается:**
  - Итоговая таблица: 4 флагмана + ключевые библиотечные добавки.
  - Что C++20 изменил структурно (concepts → шаблонное программирование, ranges → алгоритмы, coroutines → async).
  - Что C++23 добавил поверх C++20: `std::generator` (поверх coroutines), `ranges::to` и 14 views (поверх ranges), `std::expected`, `std::print` (поверх format).
  - Что C++26 добавит поверх C++23: рефлексия, контракты, `std::execution` (поверх coroutines).
  - Adoption guide: GCC 10+, Clang 10+, MSVC 19.28+; compiler feature table.
  - Порядок изучения для практика: concepts → ranges → format/span → concurrency → chrono → coroutines → modules (последними — из-за toolchain requirements).
- **Ожидаемый выход:** чёткое понимание эволюции C++ и куда двигаться дальше.
- **Сложность компиляции:** нет кода, ориентационный урок.

---

# ЧАСТЬ C. Оценка объёма работ

## C1. Подсчёт уроков

| Модуль | Уроков |
|--------|--------|
| 0 — Контекст | 1 |
| 1 — Языковые улучшения | 5 |
| 2 — Concepts | 4 |
| 3 — Ranges | 5 |
| 4 — Coroutines | 3 |
| 5 — Modules | 2 |
| 6 — std::format + span | 2 |
| 7 — Concurrency | 3 |
| 8 — Chrono | 3 |
| 9 — Утилиты | 3 |
| 10 — Итог | 2 |
| **Итого** | **33** |

Для сравнения: C++23-курс — 30 уроков; C++26-курс — ~33 урока.

---

## C2. Сложность верификации примеров

| Модуль | Compiler | Особенности |
|--------|----------|-------------|
| 0, 10 | — | нет кода |
| 1 | `gsnapshot -std=c++20 -O2` | стандартная |
| 2 (Concepts) | `gsnapshot -std=c++20 -O2` | хорошая поддержка GCC 10+ |
| 3 (Ranges) | `gsnapshot -std=c++20 -O2` | хорошая поддержка |
| 4 (Coroutines) | `gsnapshot -std=c++20 -O2` | требуется `-fcoroutines` на старых GCC; gsnapshot не требует |
| 5 (Modules) | `clang_trunk -std=c++20` | modules через GCC Godbolt нестабильны; Clang лучше |
| 6–9 | `gsnapshot -std=c++20 -O2` | стандартная |
| 8 (Chrono) | `gsnapshot -std=c++20 -O2` | timezone DB может быть недоступна на Godbolt; эмулировать где нужно |

**Потенциальные проблемы:**
- **Modules (m5):** Godbolt поддерживает modules, но multi-file демонстрации ограничены однофайловыми `module;` блоками. Примеры нужно адаптировать к этому ограничению.
- **Coroutines (m4):** написание `promise_type` с нуля — самый сложный материал в курсе. Примеры нужно проверять особенно тщательно, т.к. ошибки в `promise_type` дают загадочные сообщения компилятора.
- **Chrono timezone (m8-l2):** IANA timezone database на Godbolt может быть недоступна в sandbox; нужно проверить заранее или использовать UTC в примерах.

---

## C3. Сравнение с C++23-курсом

| Критерий | C++23-курс | C++20-курс |
|----------|------------|------------|
| Уроков | 30 | 33 |
| Флагманских модулей | 3 | 4 (включая coroutines без готовых типов) |
| Сложность верификации кода | средняя | средняя+ (modules, coroutines promise_type) |
| Фоновых блоков | мало (базовая планка C++20) | умеренно (базовая планка C++17) |
| Bleeding-edge API | нет | нет |
| Самый сложный урок для авторинга | m8-l1 (std::generator) | m4-l2 (promise_type с нуля) |

---

## C4. Приоритет написания контента (рекомендуемый порядок)

1. **m0-l1** — контекст (нет кода, ориентация)
2. **m2-l1, m2-l2** — Concepts базово (флагман, наибольшая ценность для C++17 разработчика)
3. **m3-l1, m3-l2, m3-l4** — Ranges + span (второй флагман, широко применим)
4. **m6-l1** — std::format (нужен как `#include <format>` для примеров в других модулях)
5. **m1-l1..m1-l5** — языковые улучшения
6. **m2-l3, m2-l4** — Concepts продвинутые
7. **m3-l3, m3-l5** — Ranges продвинутые
8. **m4-l1, m4-l2, m4-l3** — Coroutines (флагман, но сложный — писать после освоения других)
9. **m7-l1..m7-l3** — Concurrency
10. **m8-l1..m8-l3** — Chrono
11. **m9-l1..m9-l3** — Утилиты
12. **m5-l1, m5-l2** — Modules (последними из-за toolchain ограничений на Godbolt)
13. **m6-l2** — span практика
14. **m10-l1, m10-l2** — финал

---

## C5. Открытые вопросы (калибровки)

1. **Exercises vs theory-only**: C++23-курс выбрал «только теория + примеры» (по решению после написания плана). C++20 — сохранить тот же подход или добавить упражнения?

2. **Modules через однофайловые примеры**: достаточно ли это для реального понимания? Или добавить блок «как запустить у себя» без Godbolt?

3. **Coroutines глубина**: m4-l2 (написание `promise_type`) — сложнейший урок курса. Возможно, он слишком глубокий для курса «от нуля»? Альтернатива: использовать библиотеку cppcoro для примеров, не объясняя promise_type.

4. **`<chrono>` timezone на Godbolt**: нужно проверить доступность IANA DB до начала авторинга m8-l2.

5. **Глубина concurrency**: atomic memory orders — полный разбор? Или «используйте seq_cst пока не профилировали»?

---

*Конец документа. Статус: исследовательский черновик, готов к рецензии.*
