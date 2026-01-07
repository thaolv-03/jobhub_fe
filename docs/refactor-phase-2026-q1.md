# Refactor Phase Summary — Q1 2026

**Project:** Job Hub Frontend  
**Scope:** Client-side incremental refactor  
**Period:** Q1 2026  
**Status:** COMPLETE  
**Principles:** Behavior-preserving, contract-preserving, incremental

---

## Refactors completed

- O(n²) deduplication replaced with Set-based O(n) in:
  - `src/app/(site)/page.tsx`
  - `src/app/(site)/jobs/page.tsx`
  (behavior preserved)

- Skill diff comparison optimized from array `includes` to `Set` lookups in:
  - `src/app/(job-seeker-dashboard)/job-seeker/dashboard/page.tsx`
  (behavior preserved)

- Pagination window logic centralized via `buildPaginationItems`:
  - `src/components/admin/pagination-utils.ts`
  - reused by `admin-table-footer.tsx` and admin dashboard
  (no UI change)

- `use-companies.ts` request coalescing:
  - eliminated duplicate per-id calls
  - public hook contract preserved
  - output ordering preserved

---

## Refactors intentionally not performed (with reason)

- **Cross-dashboard batching / aggregation**
  - Requires backend aggregation endpoints
  - High risk to contracts and data consistency

- **Admin dashboard fetch patterns**
  - No per-row N+1 detected
  - Only user-triggered fetches exist

- **Additional pagination extraction**
  - Already centralized within approved scope

---

## Guardrails for future contributors

### Avoid
- Per-item network calls inside render paths or list loops
- Duplicated pagination window logic
- O(n²) list operations on non-trivial lists

### Acceptable
- User-triggered fetches (e.g. “view details”)
- Set-based lookups preserving order and output
- Contract-preserving internal hook optimizations

---

## “Do not refactor unless…” rules

- Do not refactor list aggregation/counts unless backend batch endpoints exist
- Do not change hooks’ public APIs without explicit sign-off
- Do not centralize UI behavior if rendering semantics change
- Do not introduce shared caches without a defined invalidation strategy
