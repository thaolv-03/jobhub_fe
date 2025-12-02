#!/bin/bash

# Kịch bản tự động tạo lịch sử commit cho dự án JobHub
# Hướng dẫn:
# - Đối với macOS/Linux:
#   1. Mở terminal, chạy lệnh: chmod +x create_git_history.sh
#   2. Chạy kịch bản: ./create_git_history.sh
# - Đối với Windows (với Git Bash):
#   1. Mở Git Bash (chuột phải vào thư mục dự án -> Git Bash Here).
#   2. Chạy kịch bản: bash create_git_history.sh

# =================================================================
# Commit 1: Core Project Setup
# =================================================================
echo "Commit 1: Core Project Setup"
git add package.json package-lock.json next.config.ts tailwind.config.ts tsconfig.json postcss.config.js components.json README.md apphosting.yaml
git add src/app/globals.css
git add src/lib/utils.ts
git add src/components/ui/
git commit -m "feat(core): initialize project with Next.js, TailwindCSS, and base UI components"

# =================================================================
# Commit 2: Main Layout and Theme
# =================================================================
echo "Commit 2: Main Layout and Theme"
git add src/app/layout.tsx
git add src/components/layout/
git add src/components/providers/
git add src/components/theme-toggle.tsx
git add src/hooks/use-toast.ts
git commit -m "feat(layout): implement main layout with Navbar, Footer, and Theme Toggle"

# =================================================================
# Commit 3: Public Pages UI
# =================================================================
echo "Commit 3: Public Pages UI"
git add src/app/page.tsx
git add src/app/jobs/page.tsx
git add src/app/jobs/[id]/page.tsx
git add src/lib/placeholder-images.json
git add src/lib/placeholder-images.ts
git commit -m "feat(pages): create static UI for Home, Jobs, and Job Detail pages"

# =================================================================
# Commit 4: Authentication Pages
# =================================_
echo "Commit 4: Authentication Pages"
git add src/app/login/page.tsx
git commit -m "feat(auth): implement static UI and form logic for Login/Register pages"

# =================================================================
# Commit 5: Candidate Dashboard
# =================================================================
echo "Commit 5: Candidate Dashboard"
git add src/app/candidate/dashboard/layout.tsx
git add src/app/candidate/dashboard/page.tsx
git commit -m "feat(candidate): build Candidate Dashboard with Profile and CV Management"

# =================================================================
# Commit 6: Employer Dashboard
# =================================================================
echo "Commit 6: Employer Dashboard"
git add src/app/employer/dashboard/layout.tsx
git add src/app/employer/dashboard/page.tsx
git add src/app/employer/dashboard/post-job/page.tsx
git add src/app/employer/dashboard/applicants/[id]/page.tsx
git commit -m "feat(employer): build Employer Dashboard for job and applicant management"

# =================================================================
# Commit 7: Genkit AI Setup
# =================================================================
echo "Commit 7: Genkit AI Setup"
git add src/ai/
git commit -m "feat(ai): configure Genkit for AI functionalities"


# =================================================================
# Commit 8: Final Refinements
# =================================================================
echo "Commit 8: Final Refinements"
git add .
git commit -m "refactor: align UI with db schema and apply final fixes"

