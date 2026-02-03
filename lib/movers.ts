import { Stock } from "@/types";

export interface MoverStock {
  symbol: string;
  name: string;
  price: number;
  change: number;
  changePercent: number;
}

export interface MoversResult {
  gainers: MoverStock[];
  losers: MoverStock[];
}

export function sortByChange<T extends { changePercent: number }>(stocks: T[]): T[] {
  return [...stocks].sort((a, b) => b.changePercent - a.changePercent);
}

export function getTopMovers(stocks: Stock[], count: number = 10): MoversResult {
  const sorted = sortByChange(stocks);

  const gainers = sorted
    .filter((s) => s.changePercent > 0)
    .slice(0, count)
    .map(toMoverStock);

  const losers = sorted
    .filter((s) => s.changePercent < 0)
    .reverse()
    .slice(0, count)
    .map(toMoverStock);

  return { gainers, losers };
}

function toMoverStock(stock: Stock): MoverStock {
  return {
    symbol: stock.symbol,
    name: stock.name,
    price: stock.price,
    change: stock.change,
    changePercent: stock.changePercent,
  };
}
