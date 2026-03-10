# Design System: Glassmorphic Pro (Cohort Booking System)

## 1. Visual Identity
- **Primary Style**: Glassmorphic / Dark Mode
- **Background**: `#000000` (Pure Black) for body, `#121212` (Surface) for secondary layers.
- **Glass Effect**: `rgba(25, 25, 25, 0.6)` background with `backdrop-filter: blur(12px)` and `1px solid rgba(255, 255, 255, 0.08)` border.

## 2. Color Palette
- **Action Blue**: `#3498db` (Primary actions, links, active states)
- **Success Green**: `#2ecc71` (Available slots, success messages)
- **Error Red**: `#e74c3c` (Full slots, error states, delete actions)
- **Neutral White**: `#ffffff` (Primary text)
- **Muted Gray**: `rgba(255, 255, 255, 0.4)` (Secondary text, descriptions)

## 3. Typography
- **Font Family**: 'Plus Jakarta Sans', sans-serif.
- **Scale**:
  - H1: 800 weight, -1px letter-spacing (Hero sections)
  - H6: 700 weight (Card titles)
  - Caption: 800 weight, 0.5px letter-spacing (Status labels)

## 4. Components & Interactions
- **Cards**:
  - Border Radius: `12px` (1.5rem)
  - Hover: `y: -4` transform, `box-shadow: 0 20px 40px rgba(0,0,0,0.4)`
  - Transition: `0.4s cubic-bezier(0.23, 1, 0.32, 1)`
- **Buttons**:
  - Height: `48px`
  - Border Radius: `12px`
  - Weight: `700`
  - Cursor: Always `pointer` for active, `default` for disabled.
- **Icons**:
  - Library: Lucide React
  - Size: `18px` or `20px` standard.

## 5. Redaction & Privacy Guidelines
- **User Names**: Mask names in public autocomplete or success tickets where possible (e.g., "An*** P.***") if privacy is a concern.
- **Access Codes**: Treat 6-character access codes as semi-sensitive; do not log them in client-side analytics.
- **Admin**: Avoid `alert()` calls. Use MUI `Snackbar` or custom toast for error feedback.
- **Environment Variables**: VITE_ADMIN_PASSWORD is a client-side "soft" gate. For higher security, migrate to Supabase Auth.
