"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { SECTORS, Sector } from "@/types";

interface ScreenerFiltersProps {
  filters: {
    minScore: number;
    maxScore: number;
    sector: string;
    marketCap: string;
  };
  onFiltersChange: (filters: ScreenerFiltersProps["filters"]) => void;
}

export function ScreenerFilters({ filters, onFiltersChange }: ScreenerFiltersProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Filters</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Value Score Range */}
        <div className="space-y-2">
          <Label>Value Score: {filters.minScore} - {filters.maxScore}</Label>
          <Slider
            min={0}
            max={100}
            step={5}
            value={[filters.minScore, filters.maxScore]}
            onValueChange={([min, max]) =>
              onFiltersChange({ ...filters, minScore: min, maxScore: max })
            }
          />
        </div>

        {/* Sector Filter */}
        <div className="space-y-2">
          <Label>Sector</Label>
          <Select
            value={filters.sector}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, sector: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All Sectors" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Sectors</SelectItem>
              {SECTORS.map((sector) => (
                <SelectItem key={sector} value={sector}>
                  {sector}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Market Cap Filter */}
        <div className="space-y-2">
          <Label>Market Cap</Label>
          <Select
            value={filters.marketCap}
            onValueChange={(value) =>
              onFiltersChange({ ...filters, marketCap: value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="All" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All</SelectItem>
              <SelectItem value="large">Large Cap ($10B+)</SelectItem>
              <SelectItem value="mid">Mid Cap ($2B-$10B)</SelectItem>
              <SelectItem value="small">Small Cap (&lt;$2B)</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}
