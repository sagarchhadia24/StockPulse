import Link from "next/link";
import { ArrowRight, TrendingUp, TrendingDown } from "lucide-react";
import { StockCard } from "@/components/stock/stock-card";
import { StockWithScore } from "@/types";

interface TopStocksSectionProps {
  title: string;
  stocks: StockWithScore[];
  href: string;
  description?: string;
  variant?: "undervalued" | "overvalued" | "default";
}

export function TopStocksSection({
  title,
  stocks,
  href,
  description,
  variant = "default",
}: TopStocksSectionProps) {
  const Icon = variant === "undervalued" ? TrendingUp : variant === "overvalued" ? TrendingDown : null;
  const accentColor = variant === "undervalued" ? "#00FF88" : variant === "overvalued" ? "#FF6B6B" : "#8B5CF6";

  return (
    <section className="relative">
      {/* Subtle gradient overlay for section */}
      {variant !== "default" && (
        <div
          className="absolute -inset-4 rounded-3xl opacity-5 pointer-events-none"
          style={{
            background: `radial-gradient(ellipse at top, ${accentColor} 0%, transparent 70%)`,
          }}
        />
      )}

      <div className="relative">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            {Icon && (
              <div
                className="flex items-center justify-center w-10 h-10 rounded-xl"
                style={{ backgroundColor: `${accentColor}15` }}
              >
                <Icon className="h-5 w-5" style={{ color: accentColor }} />
              </div>
            )}
            <div>
              <h2 className="text-2xl font-bold tracking-tight">{title}</h2>
              {description && (
                <p className="text-sm text-white/50 mt-0.5">{description}</p>
              )}
            </div>
          </div>

          <Link
            href={href}
            className="group flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white/60 hover:text-white hover:bg-white/5 transition-all"
          >
            View All
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
        </div>

        {/* Stock Cards Grid */}
        <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {stocks.map((stock, index) => (
            <div
              key={stock.symbol}
              className="animate-in fade-in slide-in-from-bottom-4"
              style={{ animationDelay: `${index * 50}ms`, animationFillMode: "both" }}
            >
              <StockCard stock={stock} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
