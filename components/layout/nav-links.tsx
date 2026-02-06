"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  TrendingDown,
  PieChart,
  SlidersHorizontal,
  Star,
  GitCompare,
  Bell,
  Briefcase,
  Zap,
  ChevronDown,
  Compass,
  BarChart3,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

interface NavLink {
  href: string;
  label: string;
  icon: LucideIcon;
}

interface NavGroup {
  label: string;
  icon: LucideIcon;
  links: NavLink[];
}

// Primary links (always visible)
const primaryLinks: NavLink[] = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/alerts", label: "Alerts", icon: Bell },
  { href: "/portfolio", label: "Portfolio", icon: Briefcase },
];

// Grouped links for dropdowns
const navGroups: NavGroup[] = [
  {
    label: "Discover",
    icon: Compass,
    links: [
      { href: "/movers", label: "Movers", icon: Zap },
      { href: "/sectors", label: "Sectors", icon: PieChart },
    ],
  },
  {
    label: "Analysis",
    icon: BarChart3,
    links: [
      { href: "/compare", label: "Compare", icon: GitCompare },
      { href: "/screener", label: "Screener", icon: SlidersHorizontal },
      { href: "/undervalued", label: "Undervalued", icon: TrendingUp },
      { href: "/overvalued", label: "Overvalued", icon: TrendingDown },
    ],
  },
];

// Export all links for mobile drawer
export const links: NavLink[] = [
  ...primaryLinks,
  ...navGroups.flatMap((group) => group.links),
];

function NavDropdown({ group }: { group: NavGroup }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const hasActiveLink = group.links.some((link) => pathname === link.href);
  const GroupIcon = group.icon;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "nav-link relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
          hasActiveLink
            ? "text-primary bg-primary/10"
            : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
        )}
      >
        <GroupIcon className="h-4 w-4" />
        <span>{group.label}</span>
        <ChevronDown
          className={cn("h-3 w-3 transition-transform", isOpen && "rotate-180")}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 mt-1 py-1 min-w-[180px] rounded-lg border border-border bg-background/95 backdrop-blur-xl shadow-lg z-50">
          {group.links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href;

            return (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setIsOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                  isActive
                    ? "text-primary bg-primary/10"
                    : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5"
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{link.label}</span>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {primaryLinks.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "nav-link relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "text-primary bg-primary/10"
                : "text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/10"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-primary rounded-full" />
            )}
          </Link>
        );
      })}

      {navGroups.map((group) => (
        <NavDropdown key={group.label} group={group} />
      ))}
    </nav>
  );
}
