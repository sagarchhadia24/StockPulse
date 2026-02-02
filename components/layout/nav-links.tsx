"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

const links = [
  { href: "/", label: "Home" },
  { href: "/undervalued", label: "Undervalued" },
  { href: "/overvalued", label: "Overvalued" },
  { href: "/sectors", label: "Sectors" },
  { href: "/screener", label: "Screener" },
];

export function NavLinks() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center space-x-6">
      {links.map((link) => (
        <Link
          key={link.href}
          href={link.href}
          className={cn(
            "text-sm font-medium transition-colors hover:text-primary",
            pathname === link.href
              ? "text-foreground"
              : "text-muted-foreground"
          )}
        >
          {link.label}
        </Link>
      ))}
    </nav>
  );
}
