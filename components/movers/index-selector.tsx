"use client";

import { useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INDEX_CONFIG, IndexType } from "@/lib/indices";

export function IndexSelector() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentIndex = (searchParams.get("index") || "sp500") as IndexType;

  const handleChange = (value: string) => {
    router.push(`/movers?index=${value}`);
  };

  return (
    <Select value={currentIndex} onValueChange={handleChange}>
      <SelectTrigger className="w-[180px]">
        <SelectValue placeholder="Select index" />
      </SelectTrigger>
      <SelectContent>
        {(Object.entries(INDEX_CONFIG) as [IndexType, { name: string }][]).map(
          ([key, { name }]) => (
            <SelectItem key={key} value={key}>
              {name}
            </SelectItem>
          )
        )}
      </SelectContent>
    </Select>
  );
}
