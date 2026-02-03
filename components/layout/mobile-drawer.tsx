"use client";

import { useState, useEffect, useRef } from "react";
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
  const prevPathnameRef = useRef(pathname);

  // Close drawer on route change - intentional setState in effect for navigation sync
  useEffect(() => {
    if (prevPathnameRef.current !== pathname) {
      prevPathnameRef.current = pathname;
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setIsOpen(false);
    }
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
