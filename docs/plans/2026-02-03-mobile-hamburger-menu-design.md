# Mobile Hamburger Menu Design

## Overview

The current mobile header is cramped with the logo, search bar, and navigation elements getting cut off. This design introduces a hamburger menu with a slide-in drawer to provide clean mobile navigation.

## Problem

- Header elements overflow on mobile screens
- Navigation links are hidden (`hidden md:flex`) with no mobile alternative
- Users cannot access the 8 navigation pages on mobile devices

## Solution

A left-sliding drawer containing all navigation, search, and user controls. The mobile header shows only the hamburger icon and logo for a clean appearance.

## Design Details

### Mobile Header (< md breakpoint)

| Position | Element |
|----------|---------|
| Left | Hamburger icon (Menu) |
| Center | StockPulse logo + text |
| Right | Empty |

### Desktop Header (>= md breakpoint)

No changes - current layout remains exactly as-is.

### Drawer Contents (top to bottom)

1. **Header row**: StockPulse logo + X close button
2. **Search bar**: Full width stock search
3. **Navigation links**: 8 items in vertical list with icons
   - Dashboard
   - Watchlist
   - Alerts
   - Compare
   - Undervalued
   - Overvalued
   - Sectors
   - Screener
4. **Divider**
5. **Theme toggle**
6. **User menu / Sign in button**

### Visual Styling

| Property | Value |
|----------|-------|
| Drawer width | 280px |
| Drawer background | `glass-strong` (matches header) |
| Drawer height | Full viewport |
| Drawer z-index | 60 |
| Backdrop | `black/50` (semi-transparent) |
| Backdrop z-index | 55 |
| Nav link height | 48px minimum (accessibility) |
| Icon size | 24x24px |
| Touch target | 44x44px minimum |

### Behavior

- Tap hamburger → drawer slides in from left (300ms ease-out)
- Dark backdrop fades in simultaneously
- Tap backdrop OR X button → drawer closes
- Tap navigation link → navigate + auto-close drawer
- Body scroll locked while drawer is open
- Escape key closes drawer
- Close on route change

## Implementation Approach

### New Component

`components/layout/mobile-drawer.tsx`
- Drawer container with slide animation
- Backdrop with fade animation
- Search bar
- Navigation links (reuse from nav-links)
- Theme toggle
- User menu

### Modified Files

`components/layout/header.tsx`
- Add mobile header layout: hamburger + logo
- Use `flex md:hidden` for mobile elements
- Use `hidden md:flex` for desktop elements (existing)

`components/layout/nav-links.tsx`
- Export the `links` array for reuse in drawer

### State Management

- Local `useState` for open/close state
- `useEffect` to lock body scroll when open
- `useEffect` with `usePathname` to close on route change

### Accessibility

- `aria-label="Open menu"` on hamburger button
- `aria-label="Close menu"` on X button
- Focus trap inside drawer when open
- `Escape` key closes drawer
- `aria-hidden` on backdrop

## File Structure

```
components/layout/
├── header.tsx          # Modified - add mobile layout
├── nav-links.tsx       # Modified - export links array
├── mobile-drawer.tsx   # New - drawer component
├── user-menu-client.tsx
└── user-menu-server.tsx
```

## Dependencies

No new dependencies required. Uses existing:
- Lucide icons (`Menu`, `X`)
- Tailwind CSS for animations
- Next.js `usePathname` for route detection
