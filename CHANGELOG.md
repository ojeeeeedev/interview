# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-06-08T15:36:00+07:00
### Refactored
- **Project Cleanup & Code Separation** (major maintenance release):
  - **`Admin.tsx` monolith split** (2,075 → 192 lines): Broke the single 84KB admin page into a clean `src/pages/admin/` feature folder:
    - `Admin.tsx` — slim shell (tabs layout + snackbar only)
    - `hooks/useAdminData.ts` — all data fetching & shared state
    - `tabs/CohortTab.tsx` — "Atur Event" CRUD
    - `tabs/SlotTab.tsx` — "Atur Jadwal" CRUD
    - `tabs/ParticipantTab.tsx` — "Atur Peserta" + bulk import + dialogs
    - `tabs/RecapTab.tsx` — reservation recap + PDF export
    - `components/TableSkeleton.tsx` — shared loading skeleton
  - **`CohortCard` extracted** from `Home.tsx` into `src/components/CohortCard.tsx`.
  - **`src/lib/utils.ts` created**: Centralises `formatDateForInput` and `generateSlug` helpers.
  - **`Home.tsx` trimmed**: Removed `CohortCard` inline definition; cleaned unused imports.
  - **`EditBooking.tsx` fixed**: Removed duplicate `Menu`/`MenuItem`/`ListItemIcon`/`ListItemText` import.
  - **`Landing.tsx` cleaned**: Removed stale A11y scanner banner comment.
  - **`App.tsx` updated**: Routing now points to `pages/admin/Admin.tsx`.
### Removed
  - `src/App.css` — Vite boilerplate, never imported or used
  - `Onboarding WA.txt` — WhatsApp message draft
  - `conductor/` — empty directory
  - `plan/` — dev planning notes
  - `config/` — empty directory
  - `REVIEW.md` — superseded by GEMINI.md
  - `STYLE.md` — superseded by GEMINI.md
  - `opencode.json` — config for a different AI tool

## [Unreleased] - 2026-06-08T15:34:00+07:00
### Changed
- **Admin panel refactored into feature-separated folder structure** (`src/pages/admin/`):
  - Extracted `useAdminData.ts` hook: centralises all shared state, Supabase data fetching, `groupedNames`, `reportData` memos, and `showToast`/`handleCloseSnackbar` helpers.
  - Extracted `components/TableSkeleton.tsx`: reusable loading skeleton for MUI tables.
  - Extracted `tabs/CohortTab.tsx`: full "Atur Event" CRUD panel (cohort create/edit/delete, copy link, invite participants).
  - Extracted `tabs/SlotTab.tsx`: full "Atur Jadwal" CRUD panel (slot create/edit/delete with two-column form/table layout).
  - Extracted `tabs/ParticipantTab.tsx`: full "Atur Peserta" panel (bulk selection, delete, Excel paste dialog, edit-name dialog).
  - Extracted `tabs/RecapTab.tsx`: full "Rekap" panel (accordion recap view, PDF export, individual reservation deletion).
  - Created `admin/Admin.tsx` shell: thin orchestration layer that wires the hook and tabs, manages tab state, lifted paste-dialog state, and global Snackbar.
  - The original `src/pages/Admin.tsx` (2075 lines) is preserved unchanged.
- **Pre-existing lint fixes**: Removed unused `CircularProgress` import from `CohortCard.tsx`; removed unused `Stack`, `useTheme`, `useMediaQuery`, `theme`, and `isMobile` from `Home.tsx`.

## [1.8.1] - 2026-06-08T14:06:00+07:00

### Added
- **Accessibility & Performance Best Practices**:
  - Implemented semantic `<main>` and `<nav>` landmarks, and added keyboard-navigable "Skip to content" link ("Langsung ke konten utama") for screen readers.
  - Added unique `aria-label` attributes to tables (`Daftar Event`, `Daftar Jadwal`, etc.) and injected static comments (`{/* <th> */}`) for screen reader compliance.
  - Optimized font rendering performance by replacing CSS `@import` with parallel preconnect `<link>` elements.
  - Configured language localization to Indonesian (`lang="id"`).

## [1.8.0] - 2026-06-08T13:24:00+07:00
### Changed
- **Onboarding Guide Button Label**: Converted the desktop help icon button in the top navigation header into a clearly labeled `"Panduan"` button next to the help icon to improve usability and feature awareness.
- **Accent Color Redesign**: Replaced the previous Action Blue accent colors with a premium and elegant Gold/Amber color system (`#d4af37`, `#aa8010`, and `rgba(212, 175, 55, X)`) across all pages, components, calendar pickers, dialogs, buttons, and PDF templates.
- **Cohort Card Layout Refactor**: 
  - Restructured typography hierarchy by swapping font weights and sizes so the group name (`Kelompok {nama_kelompok}`) is prominently displayed as the main heading in gold, and the event title (`{title}`) is secondary in a softer off-white color.
  - Replaced the left vertical "fingernail" border stripe with a clean, fully-enclosed gold border outline that glows and scales on card hover.

## [1.7.1] - 2026-06-08T12:47:00+07:00
### Fixed
- **Atur Peserta grouping bug**: Fixed an issue where whitelisted names from different cohorts with the same event title were combined under the same group. Now, names are grouped by their unique `cohort_id` rather than their event title.

## [1.7.0] - 2026-06-07T21:35:00+07:00
### Added
- **Enter/Return Key validation**: Instantly queries the database to verify the name when Enter/Return is pressed on the keyboard, bypassing the 600ms debounce timer.
- **Spelling Error Hint**: Added `"Periksa ejaan nama anda"` to the validation error message when validation fails (e.g. `"Nama tidak terdaftar. Periksa ejaan nama anda"`).
- **Dynamic Version display**: Imported `package.json` into [Footer.tsx](file:///Users/andarpartogi/repo/interview/src/components/Footer.tsx) to automatically render the current app version in the UI.

### Fixed
- **UX Warning Bug**: Suppressed the `"Nama tidak terdaftar"` warning from showing up while the user is typing search queries that have partial string matches in the local allowed names whitelist.
- **ESLint `no-explicit-any` Error**: Typed `timerRef` properly as `ReturnType<typeof setTimeout> | null` to resolve compilation/linter checks during production build.
