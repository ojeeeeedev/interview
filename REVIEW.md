# Code Audit & Technical Review - Cohort Booking System

This document provides a comprehensive overview of the application architecture, component responsibilities, and technical standards.

## 1. Project Architecture
The application is built with **React 19**, **TypeScript**, and **Vite**. It follows a standard modular React structure with concerns separated into:
- **Pages**: Top-level route components.
- **Components**: Reusable UI blocks.
- **Context**: Global state management (Auth).
- **Lib**: Singleton instances and shared utilities.
- **Hooks**: Custom React hooks for abstracted logic.

## 2. Page Reviews

### `Home.tsx`
- **Purpose**: Main portal for users.
- **Key Features**: 
  - Dynamic grouping of events (Active, Unscheduled, Past).
  - Access Code search widget for quick reservation management.
- **Technical Note**: Uses `useMemo` for efficient client-side filtering of cohort categories.

### `Landing.tsx`
- **Purpose**: Specific event registration page.
- **Key Features**:
  - Live countdown timer for future events.
  - Integration with `BookingForm` and `EditBooking`.
  - Post-booking "Success Ticket" generation.

### `Admin.tsx`
- **Purpose**: Internal management dashboard.
- **Key Features**:
  - CRUD operations for Cohorts and Slots.
  - Whitelist management with bulk import functionality.
  - PDF reporting using `jspdf`.
- **Optimization**: This page is **Lazy Loaded** to prevent large dependencies (`jspdf`, `jspdf-autotable`) from bloating the main bundle.

### `AdminLogin.tsx`
- **Purpose**: Simple password-based gateway for administrative access.

## 3. Component Reviews

### `BookingForm.tsx` & `EditBooking.tsx`
- **Logic**: Handles complex validation and interaction.
- **Verification**: Implements a "smart verification" pattern where name checks happen asynchronously, but error messages are delayed to prevent a "noisy" UI while typing.
- **Concurrency**: Operations are handled via React 19 `useActionState` and `useTransition` for smooth loading states.

### `Calendar.tsx`
- **Purpose**: Custom date picker styled for the dark theme.
- **Constraints**: Dynamically disables dates based on slot availability and quota.

### `RegistrationStatus.tsx`
- **Purpose**: Visual indicator of registration windows (Not opened, Open, Closed).

### `SuccessTicket.tsx`
- **Purpose**: Visual summary of a successful booking.
- **Utility**: Uses `html-to-image` to allow users to download their ticket as a PNG.

## 4. Technical Standards & Cleanup

### Cleanup Performed (March 2026):
- **Redundancy Audit**: Removed unused imports and redundant state updates in `Admin.tsx` and `Onboarding.tsx`.
- **Documentation**: Added high-level header comments to all major components and functions to assist future developers.
- **Type Safety**: Audited `src/types.ts` and ensured consistent interface usage across all components.
- **Dependency Audit**:
  - `jspdf` & `html-to-image`: These are heavy dependencies. They are isolated within specific views to minimize impact.
  - `date-fns`: Standardized as the sole date manipulation library.

### Database Integrity:
- All critical booking state changes (incrementing/decrementing slot counts) are performed via **Database RPC functions** using row-level locking (`FOR UPDATE`). This prevents race conditions where multiple users might book the last remaining slot simultaneously.

## 5. Maintenance Recommendations
1. **Dependency Updates**: Periodically run `npm outdated` to keep MUI and Supabase clients secure.
2. **Asset Optimization**: Ensure `public/logo.png` is optimized for web to maintain fast LCP (Largest Contentful Paint) times.
3. **Logs**: Monitor Supabase Edge Function logs (if added later) or Database logs for any failed RPC calls.
