"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  TrendingUp,
  TrendingDown,
  PieChart,
  SlidersHorizontal,
  Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Dashboard", icon: Home },
  { href: "/watchlist", label: "Watchlist", icon: Star },
  { href: "/undervalued", label: "Undervalued", icon: TrendingUp },
  { href: "/overvalued", label: "Overvalued", icon: TrendingDown },
  { href: "/sectors", label: "Sectors", icon: PieChart },
  { href: "/screener", label: "Screener", icon: SlidersHorizontal },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="hidden md:flex items-center gap-1">
      {links.map((link) => {
        const Icon = link.icon;
        const isActive = pathname === link.href;

        return (
          <Link
            key={link.href}
            href={link.href}
            className={cn(
              "nav-link relative flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-all duration-200",
              isActive
                ? "text-[#00FF88] bg-[#00FF88]/10"
                : "text-white/60 hover:text-white hover:bg-white/5"
            )}
          >
            <Icon className="h-4 w-4" />
            <span>{link.label}</span>
            {isActive && (
              <span className="absolute bottom-0 left-3 right-3 h-0.5 bg-gradient-to-r from-[#00FF88] to-[#00D4AA] rounded-full" />
            )}
          </Link>
        );
      })}
    </nav>
  );
}
