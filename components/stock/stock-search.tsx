"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
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

  return (
    <div className="relative">
      <Input
        ref={inputRef}
        type="text"
        placeholder="Search stocks..."
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        className="w-64"
        onFocus={() => results.length > 0 && setIsOpen(true)}
      />
      {isOpen && (
        <div
          ref={dropdownRef}
          className="absolute top-full mt-1 w-full bg-popover border rounded-md shadow-lg z-50"
        >
          {results.map((symbol) => (
            <button
              key={symbol}
              onClick={() => handleSelect(symbol)}
              className="w-full px-4 py-2 text-left hover:bg-accent flex justify-between items-center"
            >
              <span className="font-medium">{symbol}</span>
              <span className="text-sm text-muted-foreground">
                {SYMBOL_NAMES[symbol] || ""}
              </span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
