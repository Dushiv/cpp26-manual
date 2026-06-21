# Plan: Module 8 — Числа и производительность (4 lessons)

## Compiler status (verified 2026-06-21)

| Lesson | Feature | Compiler | Status |
|--------|---------|----------|--------|
| m8-l1 | `std::simd` (P1928) | `gsnapshot` via `<experimental/simd>` | ✅ verified — use `std::experimental` namespace |
| m8-l2 | `std::linalg` (P1673) | — | ❌ not implemented — theory-only |
| m8-l3 | Saturating arithmetic (P0543) | `gsnapshot` partial | ⚠️ mixed: `saturating_cast` ✅; `add_sat/sub_sat/mul_sat/div_sat` ❌ |
| m8-l4 | `<stdbit.h>` (P1956) | `gsnapshot` via `<bit>` | ⚠️ `<stdbit.h>` generics ❌ in C++ mode; `<bit>` (C++20) ✅ for examples |

### Probe details

**m8-l1 simd**: `<simd>` (C++26 final header) → `No such file or directory`. `<experimental/simd>` works. Element access `v[0]` returns a proxy — must explicitly cast to value type before `std::println`. Example that works:
```cpp
#include <experimental/simd>
namespace stdx = std::experimental;
stdx::fixed_size_simd<float, 4> v(2.5f);
float val = v[0];  // explicit extraction required
```

**m8-l2 linalg**: `#include <linalg>` → `No such file or directory` on gsnapshot.

**m8-l3 saturating**: `std::add_sat`, `std::sub_sat`, `std::mul_sat`, `std::div_sat` → not a member of `std` on both gsnapshot and clang_trunk. `std::saturating_cast<T>(x)` from `<numeric>` → ✅ works (`saturating_cast`, NOT `saturate_cast`).

**m8-l4 stdbit**: `<stdbit.h>` includes without error but generic `stdc_popcount(x)` and type-specific `stdc_popcount_ui(x)` both → not declared. `<bit>` (C++20) with `std::popcount`, `std::countl_zero`, etc. → ✅ works.

---

## Wave 1 (2 agents in parallel)

### m8-l1 — `std::simd` — *средняя*

**Header**: `#include <experimental/simd>`  
**Namespace**: `std::experimental` (alias to `stdx` is conventional)  
**Compiler**: `gsnapshot`, flags `-std=c++26 -O2`  
**`outputsVerified: true`** — compile all examples.

> **IMPORTANT for agent**: The C++26 standardized header is `<simd>` and namespace `std::simd<T,Abi>`. GCC trunk only has the pre-standard `<experimental/simd>` version. Write the lesson around the experimental API, but clearly note in the theory that C++26 standardizes this as `std::simd<T,Abi>` in `<simd>` — the experimental version is a preview. Learners using GCC 14+ or compilers with full C++26 support will see the standardized API.

> **CRITICAL**: `v[i]` returns a `_SmartReference` proxy, NOT a raw `T`. Always extract to a local variable `T val = v[i]` before passing to `std::println` or other functions.

Theory must cover:
- Motivation: modern CPUs have SIMD registers (SSE/AVX/NEON) that process multiple values in one instruction. Manual intrinsics are non-portable (`_mm256_add_ps` is x86-only). `std::simd` provides a portable, type-safe SIMD abstraction that the compiler maps to the best available instructions.
- `stdx::simd<T, Abi>` — a vector of N values of type T; the Abi tag determines width and storage
- Key Abi tags:
  - `stdx::simd_abi::native<T>` — best native width for T on this CPU (use for maximum performance)
  - `stdx::fixed_size_simd<T, N>` / `stdx::simd_abi::fixed_size<N>` — exactly N lanes, portable
  - `stdx::simd_abi::scalar` — N=1, no vectorization (useful for generic code)
- Construction: broadcast `simd<float>(0.0f)`, element-by-element generator `simd<float>([](int i){ return float(i); })`
- Arithmetic: `+`, `-`, `*`, `/` work element-wise, optimized to SIMD instructions
- Reduction: `stdx::reduce(v, std::plus<>{})`, `stdx::hmin(v)`, `stdx::hmax(v)`
- Element access: `v[i]` → proxy (extract with `T val = v[i]`)
- Masking: `stdx::where(mask, v)` — conditional operations; `v[0] > 0` produces a `simd_mask`
- Loading from array: `v.copy_from(ptr, stdx::element_aligned)` / storing: `v.copy_to(ptr, ...)`
- `stdx::simd_size_v<float, Abi>` — compile-time lane count
- The C++26 standardized names (for theory completeness): `std::simd<T>` in `<simd>`, `std::simd_mask<T>`

Examples to compile:
1. Basic — broadcast + element-wise add + sum reduction
2. Advanced — generator constructor + masking + copy_to array

### m8-l2 — `std::linalg` — *средняя*

**Compiler**: ❌ NO implementation (gsnapshot, clang_trunk both fail `#include <linalg>`).  
**`outputsVerified: false`**, **`challenge: null`**.

> Include a note: "`std::linalg` (P1673) was added to C++26 but has not yet been implemented by GCC or Clang as of 2026-06-21. Code examples follow the C++26 specification."

> Include a brief `background` callout for `std::mdspan` (C++23) — linalg builds on mdspan as its span type. Don't teach mdspan in depth, just show its role.

Theory must cover:
- Motivation: C++ lacked a standard linear algebra library. Code used Eigen/BLAS/LAPACK (non-standard, varying APIs). P1673 adds a standard BLAS-level interface using `std::mdspan` as the matrix type.
- Core concept: `std::linalg` is NOT a matrix class — it's a set of free functions that operate on `std::mdspan<T, extents, layout, accessor>` views.
- Key functions (spec-based):
  - `std::linalg::matrix_vector_product(A, x, y)` — y = A·x (BLAS gemv)
  - `std::linalg::matrix_product(A, B, C)` — C = A·B (BLAS gemm)
  - `std::linalg::inner_product(x, y)` — dot product
  - `std::linalg::vector_norm2(x)` — Euclidean norm
  - `std::linalg::transposed(A)` — lazy transpose view
  - `std::linalg::conjugate_transposed(A)` — for complex matrices
  - `std::linalg::triangular_matrix_vector_product(...)` — triangular solve
- Layout policies: `std::layout_right` (row-major, C order), `std::layout_left` (column-major, Fortran/BLAS order)
- Accessor policies: `std::linalg::scaled_accessor`, `std::linalg::conjugated_accessor`
- Performance model: implementations are allowed to call system BLAS (MKL, OpenBLAS) under the hood — the standard provides the interface, not the algorithm
- When to use: numerical code, ML preprocessing, scientific computing — when you need portability without vendoring Eigen

Spec-based code examples (unverified, no `expectedOutput`):
1. `std::mdspan` setup + `matrix_vector_product`
2. `transposed` + `inner_product`

Exercises: all `choice` or `find-bug`. No `predict-output`.

---

## Wave 2 (2 agents in parallel) — after Wave 1

### m8-l3 — Saturating arithmetic — *мелкая*

**Header**: `#include <numeric>`  
**Compiler**: `gsnapshot`, flags `-std=c++26 -O2`  
**`outputsVerified: true`** (for `saturating_cast` examples; `add_sat/sub_sat/mul_sat/div_sat` are theory-covered with spec-based code, no `predict-output` for them)

> **IMPORTANT for agent**: In GCC trunk, ONLY `std::saturating_cast<T>(x)` is implemented. `std::add_sat`, `std::sub_sat`, `std::mul_sat`, `std::div_sat` are NOT yet in GCC trunk (or clang_trunk). Write all compileable examples using `saturating_cast`. Cover `add_sat/sub_sat/mul_sat/div_sat` in theory with spec-based snippets (clearly marked). Use `choice`/`find-bug` exercises for the sat functions; `predict-output` only for `saturating_cast`.

> Note: The C++26 name IS `std::saturating_cast` (NOT `std::saturate_cast`). GCC trunk confirmed this name.

Theory must cover:
- Motivation: integer overflow is undefined behavior for signed types, wraps around for unsigned. Audio, image, signal processing code needs "clamp at max/min instead of wrap". Before C++26: manual `std::clamp(a + b, min, max)` is error-prone (overflow before clamping). C++26 adds four arithmetic functions and one cast that saturate instead.
- `std::add_sat(a, b)` — a + b, saturated at T's min/max if overflow
- `std::sub_sat(a, b)` — a - b, saturated
- `std::mul_sat(a, b)` — a * b, saturated
- `std::div_sat(a, b)` — a / b, saturated (handles INT_MIN / -1 for signed)
- **Saturation rule**: if the mathematical result exceeds the representable range, clamp to `std::numeric_limits<T>::max()` (overflow) or `min()` (underflow). No UB, no wrap.
- `std::saturating_cast<T>(x)` — convert x to type T, saturating if out of range. Example: `saturating_cast<uint8_t>(300)` → 255; `saturating_cast<int8_t>(-200)` → -128.
- Works for any integer type (signed and unsigned)
- All four sat-arithmetic functions require both operands to be the same type T
- Contrast with `std::clamp`: `clamp(a+b, lo, hi)` — the addition may already overflow before clamping; `add_sat` prevents this.
- Contrast with unsigned wrap-around: `0u - 1u` wraps to UINT_MAX; `sub_sat(0u, 1u)` → 0.
- Use cases: audio mixing, image compositing, fixed-point arithmetic, network packet counters

Spec-based theory snippet for add_sat/sub_sat (clearly marked unverified):
```cpp
// spec-based — not yet in GCC trunk
int8_t x = std::add_sat(int8_t(120), int8_t(20)); // = 127 (saturated)
uint8_t y = std::sub_sat(uint8_t(0), uint8_t(1)); // = 0 (saturated)
```

Compileable examples using saturating_cast (all verified):
1. Basic: `saturating_cast<uint8_t>` with various inputs
2. Advanced: use saturating_cast in a pixel-clamping scenario

Exercises:
- e1 (basic, predict-output using saturating_cast): `saturating_cast<unsigned char>(300)` → ?
- e2 (basic, choice): What does `add_sat(INT_MAX, 1)` return for `int`?
- e3 (advanced, choice): Why is `std::clamp(a + b, INT_MIN, INT_MAX)` wrong as a substitute for `add_sat`?
- e4 (advanced, find-bug): code that mixes `saturating_cast` with UB-prone arithmetic

Mastery check: 3 questions.

### m8-l4 — `<stdbit.h>` — *мелкая*

**Header**: `#include <bit>` (C++20, verified) for examples; `#include <stdbit.h>` covered in theory (not compileable in C++ mode on GCC trunk).  
**Compiler**: `gsnapshot`, flags `-std=c++26 -O2`  
**`outputsVerified: true`** (all examples use `<bit>`, which works)

> **IMPORTANT for agent**: `<stdbit.h>` is a C++26 addition for C compatibility — it brings C23's bit-manipulation functions into C++. However, GCC trunk does not implement it in C++ mode yet (the generic `stdc_popcount(x)` and type-specific `stdc_popcount_ui(x)` are both undefined). Write the theory covering `<stdbit.h>` functions per the spec, but use `<bit>` (C++20) for all compileable examples. Frame the lesson as: "C++26 adds `<stdbit.h>` for code that needs to be portable to C. For pure C++ code, `<bit>` (C++20) is the right choice." This is actually the correct pedagogical point for this feature.

> **VERIFIED WORKING in `<bit>`**: `std::popcount(x)`, `std::countl_zero(x)`, `std::countl_one(x)`, `std::countr_zero(x)`, `std::countr_one(x)`, `std::has_single_bit(x)`, `std::bit_ceil(x)`, `std::bit_floor(x)`, `std::bit_width(x)`, `std::rotl(x, n)`, `std::rotr(x, n)`.

Theory must cover:
- Motivation: `<bit>` (C++20) added bit manipulation to C++ but C code has its own C23 `<stdbit.h>`. Mixed C/C++ codebases need a way to share the same function names. P1956 adds `<stdbit.h>` to C++26 as a C-compatibility header.
- C++20 `<bit>` functions (the C++ native way, PRIMARY coverage):
  - `std::popcount(x)` — count set bits
  - `std::countl_zero(x)` / `std::countl_one(x)` — count leading zeros/ones
  - `std::countr_zero(x)` / `std::countr_one(x)` — count trailing zeros/ones
  - `std::has_single_bit(x)` — is x a power of 2?
  - `std::bit_ceil(x)` / `std::bit_floor(x)` — round up/down to power of 2
  - `std::bit_width(x)` — minimum bits needed to represent x
  - `std::rotl(x, n)` / `std::rotr(x, n)` — rotate left/right
  - All require unsigned integer types.
- C++26 `<stdbit.h>` (C compatibility layer):
  - Generic macros/functions: `stdc_popcount(x)`, `stdc_leading_zeros(x)`, `stdc_trailing_zeros(x)`, `stdc_leading_ones(x)`, `stdc_trailing_ones(x)`, `stdc_bit_ceil(x)`, `stdc_bit_floor(x)`, `stdc_bit_width(x)`, `stdc_has_single_bit(x)`, `stdc_rotate_left(x, n)`, `stdc_rotate_right(x, n)`
  - These mirror the C++20 `<bit>` API but in the C naming convention
  - In C: type-generic using `_Generic` macros. In C++: function templates.
  - Use when: writing code that must compile in both C23 and C++26

Examples (all using `<bit>`, all compiled and verified):
1. Basic: popcount, countl_zero, has_single_bit
2. Advanced: bit_ceil/floor, bit_width, rotl

Exercises:
- e1 (basic, predict-output): `std::popcount(0b10110101u)` → ?
- e2 (basic, choice): `std::countl_zero` for what value?
- e3 (advanced, find-bug): using a signed integer with `std::popcount` (requires unsigned — compile error)
- e4 (advanced, predict-output): `std::bit_ceil(5u)` → ?

Mastery check: 3 questions.

---

## Launch order

```
Launch agents: m8-l1, m8-l2  (parallel, Wave 1)
  ↓ wait for both
Launch agents: m8-l3, m8-l4  (parallel, Wave 2)
  ↓ wait for both
Merge temp files → m8.json (both locales), parity check, e2e (update stub → m9-l1), commit+push
```

---

## Field name discipline (mandatory)
- Mastery questions: `"type": "choice"`, `"prompt"`, `"answerIndex"`, NO `"id"` field
- Choice exercises: `"prompt"`, `"answerIndex"`
- find-bug: `"code"`, `"answerLine"` (1-based), `"explanation"`
- predict-output: `"code"`, `"expectedOutput"`
- `background`: null unless C++20/23 prerequisite is load-bearing (mdspan for linalg needs a callout)

## Risks

- **simd experimental namespace**: Agents must NOT use `std::simd<>` from `<simd>` — use `std::experimental` from `<experimental/simd>`. Element access proxy: always `T val = v[i]` before printing.
- **saturating functions split**: `saturating_cast` is verified; `add_sat` etc. are theory-only. Agents must not write predict-output exercises for `add_sat` since it won't compile.
- **stdbit.h in C++ mode**: Agents must not try to compile `<stdbit.h>` examples — use `<bit>` for all compileable code.
- **linalg**: Pure theory. No predict-output, no challenge. Background callout for mdspan (C++23).
- **m8-l4 "small" depth**: Only 3 exercises + 3 mastery questions. Don't pad.
