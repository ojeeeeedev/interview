# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] - 2026-06-09T22:40:00+07:00
### Changed
- **Session Sorting**: Introduced custom slot sorting based on Indonesian session priority: `Pagi > Siang > Sore > Malam` (integrated in homepage lists, landing booking forms, rescheduling pickers, admin panels, and PDF reports).

## [Unreleased] - 2026-06-09T22:11:00+07:00
### Changed
- **Cohort Card Layout**: Render the session name below the date on homepage cohort cards if the session is not the default `"Sesi Utama"`.

## [Unreleased] - 2026-06-09T21:20:00+07:00
### Fixed
- **State Mutation in RecapTab**: Avoided in-place sorting of `slotReservations` array (which mutates props/state) by sorting a shallow copy `[...slotReservations]`.
- **Defensive Comparison**: Added fallback values to `localeCompare` comparisons in `RecapTab.tsx` to prevent crashes on null or undefined cohort names, dates, session names, or usernames.

## [Unreleased] - 2026-06-09T21:17:00+07:00
### Changed
- **Recap Tab Sorting**: Sorted slots by date first, then by session name alphabetically in the Recap accordion slots listing.
- **Recap Tab Slot Headers**: Added the session name to the slot header title if the session name is not the default `"Sesi Utama"`.
- **PDF Export Sorting & Headers**: Updated the PDF download function `downloadCohortPDF` to sort slots by date then session name, and display the session name in the section header text.

## [Unreleased] - 2026-06-09T21:15:00+07:00
### Changed
- **Edit Booking**: Modified `EditBooking.tsx` to support session selection during rescheduling using an MUI `ToggleButtonGroup`.
- **Rescheduling State Management**: Added a React `useEffect` to dynamically resolve the default slot (presetting the original session slot or auto-selecting if only one exists) when changing dates.
- **Rescheduling API Payload**: Updated `handleUpdate` to pass the specific slot ID (`selectedSlot.id`) to the `change_reservation` RPC instead of just searching for the first slot on that date.
- **Save Button Validation**: Restricted the save button to be active only when a valid slot is selected and is different from the original reservation slot.

## [Unreleased] - 2026-06-09T21:12:00+07:00
### Changed
- **Booking Form**: Modified `BookingForm.tsx` to handle session selection using a glass-themed MUI `ToggleButtonGroup`.
- **Session Auto-Selection**: Added a React `useEffect` to automatically pre-select the session slot if a selected date contains exactly one slot.
- **Safety Quota Verification**: Updated the server-side RPC flow in `bookingAction` to verify slot existence and quota availability (`slot.count < slot.quota`) before calling `book_reservation`.
- **Session Labeling**: Appended the session name to the successful reservation date string and the confirmation dialog text if the session is not the default `"Sesi Utama"`.

## [Unreleased] - 2026-06-09T21:10:00+07:00
### Changed
- **Calendar Component**: Updated `Calendar.tsx` to support multiple slots on the same date by aggregating slot quotas and counts, and rendering aggregate status badge colors (red for all slots full, orange for >= 80% occupancy, green otherwise).
- **Calendar UI Cleanup**: Removed the individual slots remaining status information at the bottom of the calendar to keep layout clean, since slot/session selection is handled by the parent booking form.

## [Unreleased] - 2026-06-09T21:09:00+07:00
### Fixed
- **Admin Slot Validation**: Enforce quota validation in `handleCreateSlot` and `handleUpdateSlot` to prevent adding or updating slots with empty/invalid quota (e.g. NaN or <= 0).

## [Unreleased] - 2026-06-09T21:06:53+07:00
### Changed
- **Admin Slot UI**: Added `session_name` form input and table column in `SlotTab.tsx` to support the new optional session name field.

## [Unreleased] - 2026-06-09T21:05:00+07:00
### Changed
- **Database Schema**: Added `session_name` column to the `slots` table, dropped the old `cohort_id` + `date` unique constraint, and added a new unique constraint including `session_name` (`cohort_id`, `date`, `session_name`).
- **Local Schema**: Updated `supabase/schema.sql` to match the new database schema.
- **Types**: Added `session_name` property to the `Slot` interface.

## [Unreleased] - 2026-06-08T16:01:00+07:00
### Changed
- **Global Memory Guidelines Updated**: Added a new instruction to `GEMINI.md` to enforce consulting superpower skills first before other specific skills, and spawning subagents/agents as needed for big, mission-critical problems.

## [1.8.2] - 2026-06-08T15:40:00+07:00
### Refactored
- **Consolidated TypeScript Types**:
  - Moved UI helper and extended interfaces (`ReservationExtended`, `AllowedNameExtended`, `SlotWithCohorts`, `SnackbarState`, `ReservationWithSlot`, `CohortWithSlots`, `ReservationSearch`) from local files to the centralized `src/types.ts` to allow proper type sharing and avoid redundancy.
  - Updated all dependent files (`useAdminData.ts`, `CohortCard.tsx`, `Home.tsx`, `Landing.tsx`, `RecapTab.tsx`, `ParticipantTab.tsx`, `SlotTab.tsx`) to import these unified interfaces directly from `src/types.ts`.
  - Resolved `react-hooks/set-state-in-effect` lint check in `useAdminData.ts` and removed a stale A11y scanner comment in the admin shell `Admin.tsx`.

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
