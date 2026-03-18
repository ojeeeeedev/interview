# GEMINI.md - Cohort Booking System

## Project Overview
This is a **Cohort Booking System (Sistem Reservasi Wawancara)** designed to manage interview schedules and registrations for specific groups or cohorts. The system features a public-facing booking flow restricted by a whitelist of allowed names, and an administrative dashboard for managing events, schedules, participants, and generating PDF reports.

### Key Technologies & Libraries
- **Frontend Core**: React 19 (using `useActionState` and `useTransition`), TypeScript, Vite.
- **Routing**: React Router DOM v7 (`react-router-dom`) with lazy-loaded routes and navigation state management.
- **UI/UX**: 
  - Material UI (MUI) v7 with a custom, highly optimized Dark Theme and Glassmorphism effects.
  - Framer Motion for sophisticated entrance/exit animations and button-glow effects.
  - Lucide React for modern, clean iconography.
- **Date Handling**: `date-fns` for parsing, formatting, and localized (id) date manipulation.
- **Backend/Database**: Supabase (PostgreSQL) with Row Level Security (RLS).
- **State & Form Management**: Modern React 19 Hooks (`useActionState`, `useTransition`, `Suspense`), Context API (`AuthContext`), and controlled MUI components.
- **Utilities**:
  - `html-to-image`: Used in `SuccessTicket.tsx` to generate downloadable PNG tickets with a custom background and QR-style look.
  - `jspdf` & `jspdf-autotable`: Used in `Admin.tsx` to generate clean, professional PDF recap reports with tabular attendee data.
  - `papaparse`: Used for bulk participant data parsing from CSV/Excel files.
  - `src/lib/calendar.ts`: Shared utility for generating cross-platform calendar deep-links (Google, Outlook) and RFC 5545 compliant `.ics` files.

---

## Application Architecture & Data Model

### Database Schema (Supabase)
1. **`cohorts`**: Represents a group or event (e.g., "Kelompok A"). Contains title, description, unique URL slug, and optional `start_at`/`end_at` timestamps for countdowns and auto-closing.
2. **`slots`**: Represents available interview dates for a specific cohort. Includes the date, maximum `quota`, and current booking `count`.
3. **`allowed_names`**: A whitelist of full names per cohort. A user can only book if their name matches (case-insensitive) an entry in this table.
4. **`reservations`**: Links a user's name to a specific `slot`. Includes an auto-generated 6-character `access_code` (unique) used for modifying bookings.

### Concurrency & Integrity
- **Atomic Transactions**: Booking logic is offloaded to the database via PL/pgSQL RPC functions to prevent race conditions:
  - `book_reservation`: Locks the slot row (`FOR UPDATE`), checks quota, inserts the reservation, and increments the count in a single atomic operation.
  - `change_reservation`: Atomically handles rescheduling by decrementing the old slot, incrementing the new slot (with quota check), and updating the reservation record.
  - `decrement_slot_count`: Safely handles slot count reduction when admins delete reservations.

---

## Features

### User Facing (Public)
- **Home / Dashboard**: 
  - Displays all available cohorts grouped by status (Scheduled, Unscheduled, Past).
  - **Search Widget**: Real-time validation of 6-digit access codes with immediate redirect to the booking page in "Edit Mode".
- **Event/Landing Page**: 
  - **Countdown Timer**: Displays if the event `start_at` time is in the future.
  - **Booking Form**: 
    - **Step 1 (Whitelist Verification)**: Autocomplete field with "Smart Verification". Starts checking after 1 character; suppresses "Not Found" errors until 4+ characters or a 10-second timeout to improve UX.
    - **Step 2 (Calendar Selection)**: Custom-built `Calendar.tsx` component with visual feedback for full dates (disabled) and selected dates.
  - **Success Ticket**: Displays after booking or search.
    - **Download PNG**: Uses `html-to-image` to capture the ticket component.
    - **Add to Calendar**: One-click integration for Google, Outlook, and Apple iCal.
  - **Edit Booking**: Full rescheduling support using the `change_reservation` RPC, accessible only via access code.

### Admin Dashboard (Protected)
- **Authentication**: Admin password-based authentication (`VITE_ADMIN_PASSWORD`) stored in `sessionStorage` and managed via a global `useAuth` hook and `ProtectedRoute` component.
- **Panel Tabs**:
  1. **Atur Event**: Create/Update/Delete cohorts. Manages metadata like `nama_kelompok` and countdown times.
  2. **Atur Jadwal**: Manage slots and quotas. Features individual and bulk deletion.
  3. **Atur Peserta**: 
     - **Import Data**: Supports pasting directly from Excel or CSV (parsing via newlines and PapaParse). 
     - Bulk selection and deletion of participant names.
  4. **Rekap**: 
     - Accordion-based view of all attendees grouped by date.
     - Individual reservation deletion.
     - **Export PDF**: Generates reports with `jspdf-autotable`.

---

## Building and Running

### Prerequisites
- Node.js (v18+)
- A Supabase project with the schema from `supabase/schema.sql` applied.

### Environment Variables
Create a `.env` file in the root directory:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
VITE_ADMIN_PASSWORD=your_admin_password
```

### Commands
- **Install Dependencies**: `npm install`
- **Development Server**: `npm run dev`
- **Build for Production**: `npm run build`
- **Linting**: `npm run lint`

### Development Conventions
- **Styling**: Stick to the dark theme defined in `src/App.tsx`. Use `rgba(255,255,255, X)` for varying text and border opacities to maintain the glass/refined look.
- **Mobile First**: Always ensure UI components (especially tables and forms) use MUI's responsive grid/stack layouts or `TableContainer` for horizontal scrolling on mobile devices.

## Gemini Added Memories
- Always run 'npm run build' after making code changes to verify that the changes introduced no errors.
- Run 'npm run build' to verify integrity ONLY after all requested modifications for a task are complete, immediately before the final summary. Execute 'npm' commands (build, install, etc.) directly as part of the workflow without asking for permission first.
- Always allow git and gh commands.
