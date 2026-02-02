"use client";

import Link from "next/link";
import { NavLinks } from "./nav-links";
import { UserMenuClient } from "./user-menu-client";
import { StockSearch } from "@/components/stock/stock-search";

export function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between">
        <div className="flex items-center space-x-8">
          <Link href="/" className="flex items-center space-x-2">
            <span className="text-xl font-bold text-primary">StockPulse</span>
          </Link>
          <NavLinks />
        </div>
        <div className="flex items-center space-x-4">
          <StockSearch />
          <UserMenuClient />
        </div>
      </div>
    </header>
  );
}
