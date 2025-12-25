# Refactor Audit (Phase A)

## Tech stack
- Framework: Next.js 15.3.3 (App Router in `src/app`).
- Language: TypeScript (tsconfig paths: `@/*` -> `src/*`).
- Styling: Tailwind CSS + tailwindcss-animate; shadcn/ui (Radix UI).
- State management: React Context (`src/contexts/auth-context.tsx`, `src/contexts/job-seeker-profile-context.tsx`).
- Data fetching: native `fetch` with custom `apiRequest` + `fetchWithAuth` wrapper.
- Auth: custom (`src/lib/auth.ts`, `src/lib/auth-storage.ts`, `src/lib/fetchWithAuth.ts`).
- Forms & validation: react-hook-form + zod.
- Other notable deps: lucide-react, recharts, embla-carousel, firebase, genkit.

## Current structure (top-level)
- `docs/`, `src/`, `next.config.ts`, `tailwind.config.ts`, `tsconfig.json`, `package.json`.

## Current structure (`src/`)
- `app/` (App Router)
- `components/` (admin, dashboard, home, layout, providers, ui)
- `contexts/` (auth, job seeker profile)
- `hooks/` (auth, debounced value, toast, mobile)
- `lib/` (api, auth, utils, constants)
- `middleware.ts`
- `ai/`

## Job seeker/Recruiter routes (current)
- Job seeker: `/job-seeker/dashboard`, `/job-seeker/dashboard/applied-jobs`, `/job-seeker/dashboard/saved-jobs`, `/job-seeker/dashboard/settings`, `/job-seeker/dashboard/cv`.
- Recruiter: `/recruiter` (public page), `/recruiter/dashboard`, `/recruiter/dashboard/jobs`, `/recruiter/dashboard/post-job`, `/recruiter/dashboard/applicants`, `/recruiter/dashboard/applicants/[id]`, `/recruiter/dashboard/ai-cv`, `/recruiter/dashboard/consulting-need`, `/recruiter/dashboard/pending-approval`, `/recruiter/dashboard/upgrade-recruiter`.
- Middleware-protected: `/job-seeker/dashboard/:path*`, `/recruiter/dashboard/:path*`.

## API clients and base URL
- Base URL: `process.env.NEXT_PUBLIC_API_BASE_URL` (used in `src/lib/api-client.ts`, `src/lib/fetchWithAuth.ts`).
- Client modules:
  - `src/lib/api-client.ts` (generic request wrapper)
  - `src/lib/fetchWithAuth.ts` (auth refresh + retry)
  - `src/lib/auth.ts`
  - `src/lib/job-seeker-profile.ts`
  - `src/lib/admin-recruiter.ts`
  - `src/lib/admin-users.ts`
  - `src/lib/recruiter-search.ts`

## Possible duplicates
- No obvious component duplicates found from file listing.
- Potential overlap to revisit later: job seeker/recruiter dashboard layouts and navigation patterns.

