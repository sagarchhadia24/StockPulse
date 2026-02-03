# Mobile Hamburger Menu Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Add a responsive hamburger menu with left-sliding drawer for mobile navigation.

**Architecture:** Create a `MobileDrawer` component that manages drawer state, animations, and body scroll locking. Modify `Header` to show hamburger + logo on mobile, existing layout on desktop. Export `links` array from `NavLinks` for reuse.

**Tech Stack:** React, Next.js, Tailwind CSS, Lucide icons, next-themes

---

## Task 1: Export links array from NavLinks

**Files:**
- Modify: `components/layout/nav-links.tsx`

**Step 1: Export the links array**

Change line 17 from `const links = [` to `export const links = [`:

```tsx
export const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/compare", label: "Compare", icon: GitCompare },
  { href: "/undervalued", label: "Undervalued", icon: TrendingUp },
  { href: "/overvalued", label: "Overvalued", icon: TrendingDown },
  { href: "/sectors", label: "Sectors", icon: PieChart },
  { href: "/screener", label: "Screener", icon: SlidersHorizontal },
];
```

**Step 2: Verify build passes**

Run: `npm run build 2>&1 | head -20`
Expected: No errors

**Step 3: Commit**

```bash
git add components/layout/nav-links.tsx
git commit -m "refactor(nav): export links array for reuse"
```

---

## Task 2: Create MobileDrawer component - Basic structure

**Files:**
- Create: `components/layout/mobile-drawer.tsx`

**Step 1: Create the drawer component with open/close state**

```tsx
"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, X, Activity } from "lucide-react";
import { cn } from "@/lib/utils";
import { links } from "./nav-links";
import { StockSearch } from "@/components/stock/stock-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { UserMenuClient } from "./user-menu-client";

export function MobileDrawer() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  // Close drawer on route change
  useEffect(() => {
    setIsOpen(false);
  }, [pathname]);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, []);

  return (
    <>
      {/* Mobile Header */}
      <div className="flex md:hidden items-center justify-between w-full">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 -ml-2 rounded-lg hover:bg-white/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="h-6 w-6" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <Activity className="h-6 w-6 text-primary" />
          <span className="text-lg font-bold text-primary">StockPulse</span>
        </Link>

        {/* Empty div to balance flexbox */}
        <div className="w-10" />
      </div>

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[55] bg-black/50 md:hidden"
          onClick={() => setIsOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Drawer */}
      <div
        className={cn(
          "fixed top-0 left-0 z-[60] h-full w-[280px] glass-strong border-r border-border",
          "transform transition-transform duration-300 ease-out md:hidden",
          isOpen ? "translate-x-0" : "-translate-x-full"
        )}
      >
        {/* Drawer Header */}
        <div className="flex items-center justify-between p-4 border-b border-border">
          <Link href="/" className="flex items-center gap-2" onClick={() => setIsOpen(false)}>
            <Activity className="h-6 w-6 text-primary" />
            <span className="text-lg font-bold text-primary">StockPulse</span>
          </Link>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 rounded-lg hover:bg-white/10 transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Search */}
        <div className="p-4 border-b border-border">
          <StockSearch />
        </div>

        {/* Navigation Links */}
        <nav className="p-2">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-foreground hover:bg-white/5"
                )}
              >
                <Icon className="h-5 w-5" />
                <span className="font-medium">{link.label}</span>
              </Link>
            );
          })}
        </nav>

        {/* Footer: Theme + User */}
        <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-border">
          <div className="flex items-center justify-between">
            <ThemeToggle />
            <UserMenuClient />
          </div>
        </div>
      </div>
    </>
  );
}
```

**Step 2: Verify TypeScript compiles**

Run: `npx tsc --noEmit 2>&1 | head -20`
Expected: No errors (or only unrelated warnings)

**Step 3: Commit**

```bash
git add components/layout/mobile-drawer.tsx
git commit -m "feat(mobile): add MobileDrawer component with slide-in navigation"
```

---

## Task 3: Update Header to use MobileDrawer

**Files:**
- Modify: `components/layout/header.tsx`

**Step 1: Import and add MobileDrawer, wrap desktop content**

Replace the entire file with:

```tsx
"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { NavLinks } from "./nav-links";
import { UserMenuClient } from "./user-menu-client";
import { StockSearch } from "@/components/stock/stock-search";
import { ThemeToggle } from "@/components/theme-toggle";
import { MobileDrawer } from "./mobile-drawer";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-b border-border">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Mobile: Hamburger + Logo */}
        <MobileDrawer />

        {/* Desktop: Full navigation */}
        <div className="hidden md:flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Activity className="h-7 w-7 text-primary transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 blur-lg bg-primary/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold text-primary tracking-tight">
              StockPulse
            </span>
          </Link>
          <NavLinks />
        </div>
        <div className="hidden md:flex items-center gap-4">
          <StockSearch />
          <ThemeToggle />
          <UserMenuClient />
        </div>
      </div>
    </header>
  );
}
```

**Step 2: Verify build passes**

Run: `npm run build 2>&1 | head -30`
Expected: Build succeeds

**Step 3: Commit**

```bash
git add components/layout/header.tsx
git commit -m "feat(header): integrate MobileDrawer for responsive navigation"
```

---

## Task 4: Test manually and fix any issues

**Step 1: Start dev server**

Run: `npm run dev`

**Step 2: Test in browser**

Open http://localhost:3000 and test:
1. Resize window to mobile width (< 768px)
2. Verify hamburger icon appears
3. Click hamburger - drawer slides in from left
4. Click a nav link - navigates and drawer closes
5. Click backdrop - drawer closes
6. Press Escape - drawer closes
7. Resize to desktop (>= 768px) - normal header appears

**Step 3: Fix any visual issues if needed**

If drawer search bar overflows, may need to adjust StockSearch width for mobile context.

---

## Task 5: Write test for MobileDrawer

**Files:**
- Create: `__tests__/components/layout/mobile-drawer.test.tsx`

**Step 1: Write the test file**

```tsx
import { render, screen, fireEvent } from "@testing-library/react";
import { MobileDrawer } from "@/components/layout/mobile-drawer";

// Mock next/navigation
jest.mock("next/navigation", () => ({
  usePathname: () => "/",
  useRouter: () => ({
    push: jest.fn(),
    refresh: jest.fn(),
  }),
}));

// Mock next/link
jest.mock("next/link", () => {
  return function MockLink({
    children,
    href,
    onClick,
  }: {
    children: React.ReactNode;
    href: string;
    onClick?: () => void;
  }) {
    return (
      <a href={href} onClick={onClick}>
        {children}
      </a>
    );
  };
});

// Mock Supabase client
jest.mock("@/lib/supabase/client", () => ({
  createClient: () => ({
    auth: {
      getUser: jest.fn().mockResolvedValue({ data: { user: null } }),
      onAuthStateChange: jest.fn().mockReturnValue({
        data: { subscription: { unsubscribe: jest.fn() } },
      }),
    },
  }),
}));

describe("MobileDrawer", () => {
  it("renders hamburger button", () => {
    render(<MobileDrawer />);
    expect(screen.getByLabelText("Open menu")).toBeInTheDocument();
  });

  it("opens drawer when hamburger is clicked", () => {
    render(<MobileDrawer />);

    const hamburger = screen.getByLabelText("Open menu");
    fireEvent.click(hamburger);

    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();
  });

  it("closes drawer when X is clicked", () => {
    render(<MobileDrawer />);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Open menu"));

    // Close drawer
    fireEvent.click(screen.getByLabelText("Close menu"));

    // Drawer should be closed (translate-x applied)
    const drawer = screen.getByLabelText("Close menu").closest("div");
    expect(drawer).toHaveClass("-translate-x-full");
  });

  it("renders all navigation links", () => {
    render(<MobileDrawer />);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Open menu"));

    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("Watchlist")).toBeInTheDocument();
    expect(screen.getByText("Alerts")).toBeInTheDocument();
    expect(screen.getByText("Compare")).toBeInTheDocument();
    expect(screen.getByText("Undervalued")).toBeInTheDocument();
    expect(screen.getByText("Overvalued")).toBeInTheDocument();
    expect(screen.getByText("Sectors")).toBeInTheDocument();
    expect(screen.getByText("Screener")).toBeInTheDocument();
  });

  it("closes drawer when Escape is pressed", () => {
    render(<MobileDrawer />);

    // Open drawer
    fireEvent.click(screen.getByLabelText("Open menu"));
    expect(screen.getByLabelText("Close menu")).toBeInTheDocument();

    // Press Escape
    fireEvent.keyDown(document, { key: "Escape" });

    // Check drawer moved off-screen
    const drawer = screen.getByLabelText("Close menu").closest("div");
    expect(drawer).toHaveClass("-translate-x-full");
  });
});
```

**Step 2: Run tests**

Run: `npm test -- --testPathPattern=mobile-drawer`
Expected: All tests pass

**Step 3: Commit**

```bash
git add __tests__/components/layout/mobile-drawer.test.tsx
git commit -m "test(mobile): add MobileDrawer component tests"
```

---

## Task 6: Final verification and commit

**Step 1: Run all tests**

Run: `npm test`
Expected: All tests pass

**Step 2: Run lint**

Run: `npm run lint`
Expected: No errors

**Step 3: Final commit if any fixes were needed**

```bash
git add -A
git commit -m "fix: address lint/test issues in mobile drawer"
```

---

## Summary

| Task | Description | Files |
|------|-------------|-------|
| 1 | Export links array | `nav-links.tsx` |
| 2 | Create MobileDrawer component | `mobile-drawer.tsx` (new) |
| 3 | Update Header to use MobileDrawer | `header.tsx` |
| 4 | Manual testing | - |
| 5 | Write tests | `mobile-drawer.test.tsx` (new) |
| 6 | Final verification | - |
