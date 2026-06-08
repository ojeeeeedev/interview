# Changelog

All notable changes to this project will be documented in this file.

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
