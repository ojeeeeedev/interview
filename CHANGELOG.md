# Changelog

All notable changes to this project will be documented in this file.

## [1.7.0] - 2026-06-07T21:35:00+07:00
### Added
- **Enter/Return Key validation**: Instantly queries the database to verify the name when Enter/Return is pressed on the keyboard, bypassing the 600ms debounce timer.
- **Spelling Error Hint**: Added `"Periksa ejaan nama anda"` to the validation error message when validation fails (e.g. `"Nama tidak terdaftar. Periksa ejaan nama anda"`).
- **Dynamic Version display**: Imported `package.json` into [Footer.tsx](file:///Users/andarpartogi/repo/interview/src/components/Footer.tsx) to automatically render the current app version in the UI.

### Fixed
- **UX Warning Bug**: Suppressed the `"Nama tidak terdaftar"` warning from showing up while the user is typing search queries that have partial string matches in the local allowed names whitelist.
- **ESLint `no-explicit-any` Error**: Typed `timerRef` properly as `ReturnType<typeof setTimeout> | null` to resolve compilation/linter checks during production build.
