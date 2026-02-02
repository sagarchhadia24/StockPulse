import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { NavLinks } from "./nav-links";
import { UserMenu } from "./user-menu";
import { StockSearch } from "@/components/stock/stock-search";

export async function Header() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

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
          <UserMenu user={user} />
        </div>
      </div>
    </header>
  );
}
