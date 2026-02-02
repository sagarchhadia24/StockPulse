import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";

export function StockCardSkeleton() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <Skeleton className="h-6 w-16" />
          <Skeleton className="h-5 w-10" />
        </div>
        <Skeleton className="h-4 w-32 mt-1" />
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-24" />
            <Skeleton className="h-4 w-20 mt-1" />
          </div>
          <div className="text-right">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-4 w-20 mt-1" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
