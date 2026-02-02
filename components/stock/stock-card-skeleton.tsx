export function StockCardSkeleton() {
  return (
    <div className="rounded-2xl glass p-6 h-full">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <div className="h-6 w-16 rounded-lg skeleton-shimmer" />
          <div className="h-4 w-32 rounded-lg skeleton-shimmer mt-2" />
        </div>
        <div className="h-12 w-12 rounded-full skeleton-shimmer" />
      </div>

      {/* Price */}
      <div className="space-y-3">
        <div>
          <div className="h-9 w-28 rounded-lg skeleton-shimmer" />
          <div className="h-6 w-24 rounded-full skeleton-shimmer mt-2" />
        </div>

        {/* Metrics */}
        <div className="flex items-center gap-4">
          <div className="h-4 w-16 rounded skeleton-shimmer" />
          <div className="h-4 w-16 rounded skeleton-shimmer" />
        </div>

        {/* Range Bar */}
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <div className="h-3 w-10 rounded skeleton-shimmer" />
            <div className="h-3 w-16 rounded skeleton-shimmer" />
            <div className="h-3 w-10 rounded skeleton-shimmer" />
          </div>
          <div className="h-1.5 w-full rounded-full skeleton-shimmer" />
        </div>
      </div>
    </div>
  );
}
