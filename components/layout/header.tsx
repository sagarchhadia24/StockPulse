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
