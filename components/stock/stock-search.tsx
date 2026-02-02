"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { UNIQUE_SYMBOLS } from "@/data/symbols";

const SYMBOL_NAMES: Record<string, string> = {
  AAPL: "Apple Inc.",
  MSFT: "Microsoft Corporation",
  GOOGL: "Alphabet Inc.",
  AMZN: "Amazon.com Inc.",
  NVDA: "NVIDIA Corporation",
  META: "Meta Platforms Inc.",
  TSLA: "Tesla Inc.",
  JPM: "JPMorgan Chase & Co.",
  V: "Visa Inc.",
  JNJ: "Johnson & Johnson",
};

export function StockSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<string[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.length < 1) {
      setResults([]);
      return;
    }

    const upperQuery = query.toUpperCase();
    const filtered = UNIQUE_SYMBOLS.filter(
      (symbol) =>
        symbol.includes(upperQuery) ||
        SYMBOL_NAMES[symbol]?.toUpperCase().includes(upperQuery)
    ).slice(0, 8);

    setResults(filtered);
    setIsOpen(filtered.length > 0);
    setSelectedIndex(-1);
  }, [query]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSelect = (symbol: string) => {
    setQuery("");
    setIsOpen(false);
    router.push(`/stock/${symbol}`);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) return;

    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : prev));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : prev));
    } else if (e.key === "Enter" && selectedIndex >= 0) {
      e.preventDefault();
      handleSelect(results[selectedIndex]);
    } else if (e.key === "Escape") {
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      <div
        className={cn(
          "relative flex items-center rounded-xl transition-all duration-300",
          "bg-white/5 border border-white/10",
          isFocused && "border-[#00FF88]/50 bg-white/8 shadow-[0_0_20px_rgba(0,255,136,0.15)]"
        )}
      >
        <Search className="absolute left-3 h-4 w-4 text-white/40" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Search stocks..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => {
            setIsFocused(true);
            results.length > 0 && setIsOpen(true);
          }}
          onBlur={() => setIsFocused(false)}
          onKeyDown={handleKeyDown}
          className={cn(
            "w-56 bg-transparent py-2 pl-10 pr-4 text-sm text-white placeholder:text-white/40",
            "focus:outline-none focus:w-72 transition-all duration-300"
          )}
        />
      </div>
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-2 w-full min-w-72 glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
        >
          {results.map((symbol, index) => (
            <button
              key={symbol}
              onClick={() => handleSelect(symbol)}
              className={cn(
                "w-full px-4 py-3 text-left flex items-center justify-between gap-4 transition-colors",
                "hover:bg-white/5",
                selectedIndex === index && "bg-[#00FF88]/10"
              )}
            >
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                  <TrendingUp className="h-4 w-4 text-[#00FF88]" />
                </div>
                <div>
                  <span className="font-semibold text-white">{symbol}</span>
                  {SYMBOL_NAMES[symbol] && (
                    <p className="text-xs text-white/50">{SYMBOL_NAMES[symbol]}</p>
                  )}
                </div>
              </div>
              <span className="text-xs text-white/30 bg-white/5 px-2 py-1 rounded">
                Stock
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
