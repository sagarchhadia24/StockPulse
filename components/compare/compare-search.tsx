"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { Search, TrendingUp, X } from "lucide-react";
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

interface CompareSearchProps {
  selectedSymbols: string[];
  onAddSymbol: (symbol: string) => void;
  onRemoveSymbol: (symbol: string) => void;
  maxSymbols?: number;
}

export function CompareSearch({
  selectedSymbols,
  onAddSymbol,
  onRemoveSymbol,
  maxSymbols = 4,
}: CompareSearchProps) {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const isAtLimit = selectedSymbols.length >= maxSymbols;

  // Compute results using useMemo instead of useEffect + setState
  const results = useMemo(() => {
    if (query.length < 1 || isAtLimit) {
      return [];
    }

    const upperQuery = query.toUpperCase();
    return UNIQUE_SYMBOLS.filter(
      (symbol) =>
        !selectedSymbols.includes(symbol) &&
        (symbol.includes(upperQuery) ||
          SYMBOL_NAMES[symbol]?.toUpperCase().includes(upperQuery))
    ).slice(0, 6);
  }, [query, selectedSymbols, isAtLimit]);

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
    onAddSymbol(symbol);
    setQuery("");
    setIsOpen(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showDropdown) return;

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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    setIsOpen(true);
    setSelectedIndex(-1);
  };

  // Show dropdown if we have results and isOpen is true
  const showDropdown = isOpen && results.length > 0;

  return (
    <div className="space-y-3">
      {/* Selected symbols as chips */}
      {selectedSymbols.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedSymbols.map((symbol) => (
            <span
              key={symbol}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#00dc82]/10 border border-[#00dc82]/20 text-sm font-medium text-[#00dc82]"
            >
              {symbol}
              <button
                onClick={() => onRemoveSymbol(symbol)}
                className="hover:bg-[#00dc82]/20 rounded p-0.5 transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </span>
          ))}
        </div>
      )}

      {/* Search input */}
      <div className="relative">
        <div
          className={cn(
            "relative flex items-center rounded-xl transition-all duration-300",
            "bg-white/5 border border-white/10",
            isAtLimit && "opacity-50 cursor-not-allowed"
          )}
        >
          <Search className="absolute left-3 h-4 w-4 text-white/40" />
          <input
            ref={inputRef}
            type="text"
            placeholder={
              isAtLimit
                ? `Maximum ${maxSymbols} stocks reached`
                : "Search stocks to compare..."
            }
            value={query}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            disabled={isAtLimit}
            className={cn(
              "w-full bg-transparent py-3 pl-10 pr-4 text-sm text-white placeholder:text-white/40",
              "focus:outline-none transition-all duration-300",
              isAtLimit && "cursor-not-allowed"
            )}
          />
        </div>

        {showDropdown && (
          <div
            ref={dropdownRef}
            className="absolute top-full mt-2 w-full glass rounded-xl border border-white/10 shadow-2xl z-50 overflow-hidden"
          >
            {results.map((symbol, index) => (
              <button
                key={symbol}
                onClick={() => handleSelect(symbol)}
                className={cn(
                  "w-full px-4 py-3 text-left flex items-center justify-between gap-4 transition-colors",
                  "hover:bg-white/5",
                  selectedIndex === index && "bg-[#00dc82]/10"
                )}
              >
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-white/5">
                    <TrendingUp className="h-4 w-4 text-[#00dc82]" />
                  </div>
                  <div>
                    <span className="font-semibold text-white">{symbol}</span>
                    {SYMBOL_NAMES[symbol] && (
                      <p className="text-xs text-white/50">{SYMBOL_NAMES[symbol]}</p>
                    )}
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Helper text */}
      <p className="text-xs text-white/40">
        {selectedSymbols.length} of {maxSymbols} stocks selected
      </p>
    </div>
  );
}
