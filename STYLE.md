# STYLE.md - Cohort Booking System Styling & UX Guidelines

This document outlines the visual language, component styles, and interaction patterns used across the Cohort Booking System. The application follows a **Dark Glassmorphic Aesthetic** designed for a refined, modern, and high-contrast user experience.

---

## 1. Visual Foundation

### Color Palette (MUI Dark Mode)
- **Primary (Action Blue)**: `#3498db` (used for primary buttons, highlights, and active states).
- **Secondary (Muted Gray)**: `rgba(255, 255, 255, 0.4)` (used for secondary text and disabled icons).
- **Background (Pure Black)**: `#000000` (the foundation of the entire app).
- **Surface (Paper)**: `rgba(25, 25, 25, 0.6)` with `backdrop-filter: blur(12px)`.
- **Status Colors**:
  - **Success**: `#2ecc71` (Green) - Used for successful bookings and available slots.
  - **Error**: `#e74c3c` (Red) - Used for full slots, errors, and critical alerts.
  - **Warning**: `#f39c12` (Orange) - Used for slots nearing capacity (>= 80% full).

### Typography
- **Primary Font**: `Plus Jakarta Sans` (weights: 400, 500, 600, 700, 800).
- **Fallback Font**: `Inter`, `sans-serif`.
- **Headings**: Heavy weights (700-800) with slight negative letter spacing (`-0.5px` to `-1px`) for a modern look.
- **Captions/Overlines**: Extra bold (800-900) with wide letter spacing (`1px` to `2px`) and uppercase transformation.

---

## 2. Global UI Patterns

### Refined Glassmorphism (`.refined-card`)
The signature look of the application is achieved through:
- **Background**: `rgba(25, 25, 25, 0.6)`.
- **Blur**: `backdrop-filter: blur(12px)`.
- **Border**: `1px solid rgba(255, 255, 255, 0.08)`.
- **Shadow**: `0 20px 40px rgba(0, 0, 0, 0.4)`.
- **Radius**: `12px`.

### Buttons
- **Global Radius**: `12px`.
- **Transition**: `all 0.4s cubic-bezier(0.23, 1, 0.32, 1)`.
- **Hover Effect**: Subtle `translateY(-4px)` with increased border opacity and drop shadow.
- **Glassmorphic Buttons**: Semi-transparent backgrounds with borders that glow on hover.

---

## 3. Core Component Styles

### Home Dashboard
- **Search Widget**: Refined search bar with real-time status indicators (Check/X/Spinner) and a success/error border glow based on validation results.
- **Cohort Card**:
  - Left-accent border (Blue or Gray for past).
  - Hover elevation and background shift to `rgba(35, 35, 35, 0.8)`.
  - Animated "Daftar" button with alternating glow (`glow-alternate` keyframes).

### Booking Flow
- **Smart Verification**: Loading spinner appears during verification; errors are suppressed until 4+ characters or 10s timeout to maintain clean UX.
- **Calendar (`Calendar.tsx`)**:
  - Custom `StaticDatePicker` styling.
  - Interactive day dots colored by status (Green/Orange/Red).
  - Selected date has a primary blue glow (`boxShadow: "0 0 20px rgba(52, 152, 219, 0.4)"`).
- **Confirmation Dialog**: Refined card style with highlighted date box in success green.

### Success Ticket (`SuccessTicket.tsx`)
- **Visuals**: Centered, capturable `Paper` with dashed borders around the Access Code.
- **Action Buttons**: Contrast between primary blue (Save Ticket) and subtle green (Add to Calendar).
- **Download**: Captures at 1.0x scale with `#1a1a1a` background using `html-to-image`.

### Admin Dashboard
- **Layout**: Clean tabs with accordion-style groupings.
- **Tables**: Responsive layouts with `TableContainer` and sticky headers.
- **Zebra Striping**: Subtle `rgba(255,255,255,0.02)` on hover.

---

## 4. UX & Interactions

### Transitions (Framer Motion)
- **Entrance**: `y: 10` or `y: 30` fade-ins with `staggerChildren` for lists.
- **Transitions**: `exit` animations to prevent jarring content shifts.
- **Buttons**: `whileHover: { scale: 1.02 }` and `whileTap: { scale: 0.98 }`.

### Mobile Responsiveness
- **Adaptive Padding**: `p: { xs: 2, md: 5 }`.
- **Stacking**: Grids that collapse from `md: horizontal` to `xs: vertical`.
- **Responsive Tables**: Horizontal scrolling enabled for mobile users with `minWidth` constraints.

### Feedback Mechanisms
- **Snackbars**: High-signal, filled alerts with 4s auto-hide.
- **Skeletons**: Layout-matching skeletons used during page transitions and lazy loading.
- **Conditional Visibility**: Sections like "Past Events" hide irrelevant data (e.g., slot counts) to minimize cognitive load.
