# Plan: Module 5 — Static Reflection (7 lessons)

## Technical constants (all agents)

| | |
|---|---|
| **Compiler** | `clang_bb_p2996` |
| **Flags** | `-std=c++26 -stdlib=libc++` |
| **Header** | `#include <meta>` |
| **Critical** | All `std::meta::*` names must be verified against cppreference — P2996 was finalized late |

---

## Wave 1 (3 agents in parallel)

### m5-l1 — Оператор `^^` и `std::meta::info` — *средняя*

- What `^^expr` / `^^Type` / `^^ns` gives — a value of type `std::meta::info`
- `std::meta::info` — opaque constexpr-only type, `==` by identity
- Value category of `^^` result — prvalue
- What can be reflected: types, functions, variables, namespaces, templates
- `std::meta::name_of()`, `std::meta::type_of()`, `std::meta::is_type()`, `std::meta::is_function()`
- Unevaluated context: `^^` is unevaluated (like `sizeof`)
- Old alternative: `typeid` + `type_info` (only rtti, only types, runtime-only)

### m5-l2 — Сплайсинг `[: r :]` — *средняя*

- Syntax: `typename [: r :]`, `[: r :]` as value, `template [: r :]<>` as template
- Roundtrip: `^^int` → `[: ^^int :]` ≡ `int`
- `[: r :]` as type in declarations, template parameters, `static_cast`
- Difference: `[: r :]` as type vs as expression
- Constexpr requirement: `r` must be constexpr
- Ill-formed: splicing a non-reflectable entity
- Template interaction: `template <std::meta::info R>` + `typename [: R :]`

### m5-l3 — Запросы: члены, имена, базы — *средняя+*

- `std::meta::members_of(^^T)` — all members of T (returns `std::vector<std::meta::info>`)
- `std::meta::nonstatic_data_members_of(^^T)` — data fields only
- `std::meta::bases_of(^^T)` — base classes
- `std::meta::name_of(r)` → `std::string_view`
- `std::meta::type_of(r)` → `std::meta::info` for the member's type
- Filters: `std::meta::is_public()`, `std::meta::is_static()`, `std::meta::is_data_member()`
- Accessing member value via splice: `obj.[: member_r :]`
- Constexpr iteration over members for generic code

---

## Wave 2 (3 agents in parallel) — after wave 1

### m5-l4 — Рефлексия перечислений, enum→string — *мелкая/средняя*

- `std::meta::enumerators_of(^^E)` — list of all enumerators
- `std::meta::name_of(enumerator_r)` — name as `string_view`
- `std::meta::value_of<E>(enumerator_r)` — value
- Pattern enum→string: `constexpr std::string_view to_string(E e)`
- Pattern string→enum: reverse lookup
- Why `std::meta::is_scoped_enum()` matters
- Old alternative: giant `switch` / `X()` macros

### m5-l5 — Генерация кода: `define_class` — *крупная*

- `std::meta::define_class(info, members_vec)` — define a class from a descriptor list
- `std::meta::data_member_spec(type_r, {.name = "x"})` — field descriptor
- Example: struct-of-arrays from list-of-fields
- Example: auto-generate a "flattened" copy of a struct
- Constraint: `define_class` callable only in consteval context
- Template interaction: reflection parameter → generated class
- ⚠️ **Risk:** most likely to have API churn — compile a basic example first, then write theory

### m5-l6 — Аннотации (P1240/P3385) — *средняя*

- Annotation syntax: `[[=value]]` or whatever `clang_bb_p2996` actually accepts (check first)
- `std::meta::annotations_of(r)` → `std::vector<std::meta::info>`
- Difference from regular attributes `[[attr]]`: annotations are reflectable values, attributes are not
- Pattern: mark fields for serialization/validation via annotations
- Example: `struct User { [[=Serialize{}]] std::string name; };` → auto JSON
- ⚠️ **Risk:** P1240/P3385 may be partially or not yet implemented in `clang_bb_p2996`; if it doesn't compile, document the gap (same approach as m4-l4 for virtual functions)

---

## Wave 3 (1 agent) — after waves 1+2

### m5-l7 — Практические паттерны (итоговый) — *крупная*

Uses everything from l1–l6:
- Example 1: `enum_to_string` + `enum_from_string` via `enumerators_of`
- Example 2: generic JSON serializer for structs (iterate `nonstatic_data_members_of`)
- Example 3: auto-`operator==` via reflection
- Example 4: `visit_members(obj, fn)` — apply a function to each field
- Mastery check covers the entire module

---

## Launch order

```
Launch agents: m5-l1, m5-l2, m5-l3  (parallel)
  ↓ wait for all three
Launch agents: m5-l4, m5-l5, m5-l6  (parallel)
  ↓ wait for all three
Launch agent:  m5-l7
  ↓ wait
Merge temp files → m5.json, parity check, e2e, commit+push
```

---

## Risks

- **m5-l5 (`define_class`)** — highest risk: API may have changed in final P2996. Agent must compile a basic example first, then write the lesson.
- **m5-l6 (annotations)** — P1240/P3385 may not be fully implemented in `clang_bb_p2996`. If it doesn't compile, write the lesson with a documented implementation gap (like m4-l4 for virtual functions).
- **m5-l7 (capstone)** — strictly last; depends on l1–l6 being correct.
- **All agents** — must verify `std::meta::*` function names by actually compiling, not from memory. The API was finalized late and differs between early proposal drafts and the final text.
