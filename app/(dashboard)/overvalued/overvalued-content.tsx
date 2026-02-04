"use client";

import { Suspense, useMemo } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { StockTable } from "@/components/stock/stock-table";
import { StockTableFilters } from "@/components/stock/stock-table-filters";
import type { StockWithScore } from "@/types/stock";

const ITEMS_PER_PAGE = 25;

interface OvervaluedContentProps {
  stocks: StockWithScore[];
}

function OvervaluedContentInner({ stocks }: OvervaluedContentProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const currentSector = searchParams.get("sector") || "all";
  const currentPage = parseInt(searchParams.get("page") || "1", 10);

  // Filter stocks by sector
  const filteredStocks = useMemo(() => {
    if (currentSector === "all") {
      return stocks;
    }
    return stocks.filter((stock) => stock.sector === currentSector);
  }, [stocks, currentSector]);

  // Paginate filtered stocks
  const paginatedStocks = useMemo(() => {
    const start = (currentPage - 1) * ITEMS_PER_PAGE;
    const end = start + ITEMS_PER_PAGE;
    return filteredStocks.slice(start, end);
  }, [filteredStocks, currentPage]);

  const updateParams = (sector: string, page: number) => {
    const params = new URLSearchParams();
    if (sector !== "all") {
      params.set("sector", sector);
    }
    if (page > 1) {
      params.set("page", page.toString());
    }
    const queryString = params.toString();
    router.push(queryString ? `?${queryString}` : "/overvalued", { scroll: false });
  };

  const handleSectorChange = (sector: string) => {
    // Reset to page 1 when sector changes
    updateParams(sector, 1);
  };

  const handlePageChange = (page: number) => {
    updateParams(currentSector, page);
  };

  return (
    <>
      <StockTableFilters
        totalCount={filteredStocks.length}
        currentSector={currentSector}
        currentPage={currentPage}
        itemsPerPage={ITEMS_PER_PAGE}
        onSectorChange={handleSectorChange}
        onPageChange={handlePageChange}
      />
      <StockTable stocks={paginatedStocks} />
    </>
  );
}

export function OvervaluedContent({ stocks }: OvervaluedContentProps) {
  return (
    <Suspense fallback={<StockTable stocks={stocks.slice(0, ITEMS_PER_PAGE)} />}>
      <OvervaluedContentInner stocks={stocks} />
    </Suspense>
  );
}
