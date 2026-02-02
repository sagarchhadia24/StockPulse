# StockPulse Color Scheme Redesign

## Overview

Redesign the color scheme to achieve a modern, premium fintech aesthetic with deep ocean/navy dark mode and cohesive soft blue-gray light mode.

## Design Goals

- Premium Bloomberg/Robinhood-style dark mode
- Cohesive light mode that feels connected to dark mode
- Green accent retained for stock gains association
- Better contrast and visual hierarchy

## Color Palette

### Dark Mode

| Token | Value | Purpose |
|-------|-------|---------||
| `--background` | `#0a1628` | Deep navy base |
| `--card` | `#0f1d32` | Elevated surfaces |
| `--popover` | `#142440` | Modals, dropdowns |
| `--foreground` | `#f1f5f9` | Primary text |
| `--muted-foreground` | `#64748b` | Secondary text |
| `--primary` | `#00dc82` | Green accent (brighter for navy) |
| `--primary-foreground` | `#0a1628` | Text on primary |
| `--secondary` | `#1e3a5f` | Secondary surfaces |
| `--secondary-foreground` | `#f1f5f9` | Text on secondary |
| `--accent` | `#6366f1` | Indigo accent |
| `--accent-foreground` | `#f1f5f9` | Text on accent |
| `--muted` | `#1e293b` | Muted backgrounds |
| `--destructive` | `#f87171` | Error/negative |
| `--border` | `rgba(255, 255, 255, 0.1)` | Subtle borders |
| `--input` | `rgba(255, 255, 255, 0.1)` | Input borders |
| `--ring` | `#00dc82` | Focus ring |

**Chart Colors (Dark):**
- Chart 1: `#00dc82` (green)
- Chart 2: `#6366f1` (indigo)
- Chart 3: `#0ea5e9` (sky blue)
- Chart 4: `#f59e0b` (amber)
- Chart 5: `#f87171` (red)

### Light Mode

| Token | Value | Purpose |
|-------|-------|---------||
| `--background` | `#f8fafc` | Soft blue-gray base |
| `--card` | `#ffffff` | White cards |
| `--popover` | `#ffffff` | Modals, dropdowns |
| `--foreground` | `#0f172a` | Deep slate text |
| `--muted-foreground` | `#64748b` | Secondary text |
| `--primary` | `#059669` | Deeper green for contrast |
| `--primary-foreground` | `#ffffff` | Text on primary |
| `--secondary` | `#f1f5f9` | Secondary surfaces |
| `--secondary-foreground` | `#0f172a` | Text on secondary |
| `--accent` | `#6366f1` | Indigo accent |
| `--accent-foreground` | `#ffffff` | Text on accent |
| `--muted` | `#f1f5f9` | Muted backgrounds |
| `--destructive` | `#dc2626` | Error/negative |
| `--border` | `#e2e8f0` | Blue-gray borders |
| `--input` | `#e2e8f0` | Input borders |
| `--ring` | `#059669` | Focus ring |

**Chart Colors (Light):**
- Chart 1: `#059669` (green)
- Chart 2: `#6366f1` (indigo)
- Chart 3: `#0284c7` (sky blue)
- Chart 4: `#d97706` (amber)
- Chart 5: `#dc2626` (red)

### Accent Colors (Shared)

| Token | Value | Purpose |
|-------|-------|---------||
| `--color-lime` | `#00dc82` | Positive/gains |
| `--color-negative` | `#f87171` | Negative/losses |
| `--color-warning` | `#f59e0b` | Warnings |
| `--color-teal` | `#0ea5e9` | Info/tertiary |
| `--color-purple` | `#6366f1` | Indigo accent |

## Glassmorphism Updates

**Dark Mode Glass:**
```css
.dark .glass {
  background: rgba(15, 29, 50, 0.7);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
}
```

**Light Mode Glass:** (unchanged, works well)

## Implementation

1. Update CSS variables in `globals.css`
2. Adjust glassmorphism utilities for navy tint
3. Update price-up/price-down colors
4. Update glow effects for new palette
5. Test both modes for contrast and readability
