# GEMINI.md - Cohort Booking System

## Project Overview
This is a **Cohort Booking System (Sistem Reservasi Wawancara)** designed to manage interview schedules and registrations for specific groups or cohorts. The system features a public-facing booking flow restricted by a whitelist of allowed names, and an administrative dashboard for managing events, schedules, participants, and generating PDF reports.

### Key Technologies & Libraries
- **Frontend Core**: React 19, TypeScript, Vite.
- **Routing**: React Router DOM v7 (`react-router-dom`).
- **UI/UX**: 
  - Material UI (MUI) v7 with a custom, highly optimized Dark Theme.
  - Framer Motion for smooth, accessible page and component transitions.
  - Lucide React for modern, clean iconography.
- **Date Handling**: `date-fns` for parsing, formatting, and localized date manipulation.
- **Backend/Database**: Supabase (PostgreSQL).
- **State & Form Management**: Modern React 19 Hooks (`useActionState`, `useTransition`), Context API (`AuthContext`), and controlled MUI components.
- **Utilities**:
  - `html-to-image`: For generating downloadable PNG tickets upon successful booking.
  - `jspdf` & `jspdf-autotable`: For generating and downloading PDF recap reports in the Admin dashboard.
  - `src/lib/calendar.ts`: Shared utility for generating cross-platform calendar deep-links and RFC 5545 compliant `.ics` files.

---

## Application Architecture & Data Model

### Database Schema (Supabase)
1. **`cohorts`**: Represents a group or event (e.g., "Kelompok A"). Contains title, description, unique URL slug, and an optional `start_at` timestamp for countdowns.
2. **`slots`**: Represents available interview dates for a specific cohort. Includes the date, maximum `quota`, and current booking `count`.
3. **`allowed_names`**: A whitelist of full names. A user can only book a slot if their name exists in this table for the specific cohort.
4. **`reservations`**: Links a user's name to a specific `slot`. Includes an auto-generated 6-character `access_code` used for modifying bookings.

### Concurrency & Integrity
- **Atomic Transactions**: Booking logic is handled strictly on the database side using a PL/pgSQL RPC function (`book_reservation`). This function uses `FOR UPDATE` row-level locks to ensure that the slot `count` never exceeds the `quota`, preventing race conditions and overbooking.

---

## Features

### User Facing (Public)
- **Home / Dashboard**: 
  - Displays all available cohorts grouped by scheduled and unscheduled events.
  - "Search Widget" allows users to input their 6-digit access code to immediately find and edit their existing reservation.
- **Event/Landing Page**: 
  - If the event `start_at` time is in the future, displays a live **Countdown Timer**.
  - **Booking Form**: 
    - Step 1: User inputs their name using an Autocomplete field that verifies against the `allowed_names` whitelist. **Smart Verification**: Checks start after 1 character with a loading spinner; errors are suppressed until 4 characters or a 10-second timeout.
    - Step 2: User selects an available date using a custom, dark-themed Calendar component. Dates that are full are visually disabled.
  - **Success Ticket**: Upon booking, generates a visual "Ticket" containing the user's name, schedule, and access code. 
    - **Simpan Tiket**: Users can download the ticket as a PNG image.
    - **Add to Calendar**: Integrated support for Google Calendar, Outlook, and Apple iCal (.ics) to save the schedule directly.
  - **Edit Booking**: Users can re-schedule their interview by selecting a new available date if they access the form via their access code. Includes a persistent "Add to Calendar" option for existing reservations.

### Admin Dashboard (Protected)
- **Authentication**: Simple password-based authentication (`VITE_ADMIN_PASSWORD` in `.env`) managed via React Context and stored in `sessionStorage`.
- **Panel Tabs**:
  1. **Atur Event (Manage Events)**: Create, update, or delete entire cohorts. Automatically generates URL slugs. Set optional opening times for countdowns. Copy direct invite links.
  2. **Atur Jadwal (Manage Slots)**: Add specific dates and set quotas (capacity) for existing cohorts.
  3. **Atur Peserta (Manage Participants)**:
     - **Paste from Excel**: Bulk add participant names by pasting a newline-separated list.
     - Edit individual names or perform bulk deletions of selected names.
  4. **Rekap (Reports)**: 
     - View an accordion-style breakdown of all reservations grouped by Cohort and Date.
     - Individual deletion of reservations (automatically decrements the slot count via RPC).
     - **Download PDF**: Generates a formatted PDF report of all attendees for a specific cohort.

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