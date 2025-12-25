# Refactor Changelog

## Summary
- Renamed candidate/employer route segments and related identifiers to job-seeker/recruiter.
- Added Next.js redirects for old route segments to preserve bookmarks.
- Normalized API response type-only exports to remove build-time warnings.
- Made build script Windows-safe (`next build`).

## Key path changes
- `src/app/(candidate-dashboard)/candidate` -> `src/app/(job-seeker-dashboard)/job-seeker`
- `src/app/(employer-dashboard)/employer` -> `src/app/(recruiter-dashboard)/recruiter`
- `src/app/(site)/employer` -> `src/app/(site)/recruiter`
- `src/contexts/candidate-profile-context.tsx` -> `src/contexts/job-seeker-profile-context.tsx`
- `src/lib/candidate-profile.ts` -> `src/lib/job-seeker-profile.ts`

## Redirects
- `/candidate/:path*` -> `/job-seeker/:path*` (permanent)
- `/employer/:path*` -> `/recruiter/:path*` (permanent)

## Notable code updates
- Route strings and navigation updated to `/job-seeker/...` and `/recruiter/...`.
- Theme class renamed to `theme-recruiter`.
- Component and function names updated to JobSeeker/Recruiter naming.

## Risks / follow-ups
- Validate redirect order with middleware in runtime (should redirect before auth guard).
- Re-run `npm run build` to confirm build is clean on this environment.
