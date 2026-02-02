"use client";

import Link from "next/link";
import { Activity } from "lucide-react";
import { NavLinks } from "./nav-links";
import { UserMenuClient } from "./user-menu-client";
import { StockSearch } from "@/components/stock/stock-search";
import { ThemeToggle } from "@/components/theme-toggle";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full glass-strong border-b border-white/5">
      <div className="container mx-auto flex h-16 items-center justify-between">
        <div className="flex items-center gap-10">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="relative">
              <Activity className="h-7 w-7 text-[#00FF88] transition-transform group-hover:scale-110" />
              <div className="absolute inset-0 blur-lg bg-[#00FF88]/30 opacity-0 group-hover:opacity-100 transition-opacity" />
            </div>
            <span className="text-xl font-bold gradient-text tracking-tight">
              StockPulse
            </span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center gap-4">
          <StockSearch />
          <ThemeToggle />
          <UserMenuClient />
        </div>
      </div>
    </header>
  );
}
