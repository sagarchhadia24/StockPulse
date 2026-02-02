"use client";

import { useState } from "react";
import Link from "next/link";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { StockWithScore } from "@/types";
import { classifyStock } from "@/lib/valuation";
import { cn } from "@/lib/utils";
import { WatchlistButton } from "./watchlist-button";

interface StockTableProps {
  stocks: StockWithScore[];
  showWatchlistButton?: boolean;
}

type SortKey = "symbol" | "price" | "change" | "valueScore" | "peRatio" | "sector";
type SortOrder = "asc" | "desc";

export function StockTable({ stocks, showWatchlistButton = true }: StockTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>("valueScore");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortOrder("desc");
    }
  };

  const sortedStocks = [...stocks].sort((a, b) => {
    let aVal: number | string = 0;
    let bVal: number | string = 0;

    switch (sortKey) {
      case "symbol":
        aVal = a.symbol;
        bVal = b.symbol;
        break;
      case "price":
        aVal = a.price;
        bVal = b.price;
        break;
      case "change":
        aVal = a.changePercent;
        bVal = b.changePercent;
        break;
      case "valueScore":
        aVal = a.valueScore;
        bVal = b.valueScore;
        break;
      case "peRatio":
        aVal = a.peRatio || 0;
        bVal = b.peRatio || 0;
        break;
      case "sector":
        aVal = a.sector;
        bVal = b.sector;
        break;
    }

    if (typeof aVal === "string") {
      return sortOrder === "asc"
        ? aVal.localeCompare(bVal as string)
        : (bVal as string).localeCompare(aVal);
    }

    return sortOrder === "asc" ? aVal - (bVal as number) : (bVal as number) - aVal;
  });

  const SortableHeader = ({ column, label }: { column: SortKey; label: string }) => (
    <TableHead>
      <Button
        variant="ghost"
        onClick={() => handleSort(column)}
        className="h-8 px-2 font-semibold"
      >
        {label}
        {sortKey === column && (sortOrder === "asc" ? " ↑" : " ↓")}
      </Button>
    </TableHead>
  );

  return (
    <div className="rounded-md border">
      <Table>
        <TableHeader>
          <TableRow>
            <SortableHeader column="symbol" label="Symbol" />
            <TableHead>Name</TableHead>
            <SortableHeader column="sector" label="Sector" />
            <SortableHeader column="price" label="Price" />
            <SortableHeader column="change" label="Change" />
            <SortableHeader column="valueScore" label="Score" />
            <SortableHeader column="peRatio" label="P/E" />
            <TableHead>52W Range</TableHead>
            {showWatchlistButton && <TableHead></TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {sortedStocks.map((stock) => {
            const classification = classifyStock(stock.valueScore);
            return (
              <TableRow key={stock.symbol}>
                <TableCell>
                  <Link
                    href={`/stock/${stock.symbol}`}
                    className="font-medium hover:underline"
                  >
                    {stock.symbol}
                  </Link>
                </TableCell>
                <TableCell className="max-w-[200px] truncate">
                  {stock.name}
                </TableCell>
                <TableCell>
                  <Badge variant="outline">{stock.sector}</Badge>
                </TableCell>
                <TableCell>${stock.price.toFixed(2)}</TableCell>
                <TableCell
                  className={cn(
                    stock.change >= 0 ? "text-green-500" : "text-red-500"
                  )}
                >
                  {stock.change >= 0 ? "+" : ""}
                  {stock.changePercent.toFixed(2)}%
                </TableCell>
                <TableCell>
                  <Badge
                    variant={
                      classification === "undervalued"
                        ? "default"
                        : classification === "overvalued"
                        ? "destructive"
                        : "secondary"
                    }
                  >
                    {stock.valueScore}
                  </Badge>
                </TableCell>
                <TableCell>{stock.peRatio?.toFixed(1) || "N/A"}</TableCell>
                <TableCell className="text-sm text-muted-foreground">
                  ${stock.week52Low.toFixed(0)} - ${stock.week52High.toFixed(0)}
                </TableCell>
                {showWatchlistButton && (
                  <TableCell>
                    <WatchlistButton symbol={stock.symbol} />
                  </TableCell>
                )}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
