export function CardSkeleton() {
  return (
    <div className="overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
      <div className="h-48 w-full animate-shimmer" />
      <div className="p-5 space-y-3">
        <div className="h-4 w-3/4 rounded-[3px] animate-shimmer" />
        <div className="h-3 w-full rounded-[3px] animate-shimmer" />
        <div className="h-3 w-2/3 rounded-[3px] animate-shimmer" />
        <div className="mt-4 h-3 w-1/3 rounded-[3px] animate-shimmer" />
      </div>
    </div>
  );
}

export function CardSkeletonGrid({ count = 6 }: { count?: number }) {
  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <CardSkeleton key={i} />
      ))}
    </div>
  );
}

export function PageLoader() {
  return (
    <div className="flex min-h-[50vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative h-10 w-10">
          <div className="absolute inset-0 rounded-full border-2" style={{ borderColor: "var(--border-medium)" }} />
          <div className="absolute inset-0 rounded-full border-t-2 animate-spin" style={{ borderColor: "var(--accent)" }} />
        </div>
        <p className="text-sm" style={{ color: "var(--text-muted)" }}>جاري التحميل...</p>
      </div>
    </div>
  );
}

export function FeaturedSkeleton() {
  return (
    <div className="overflow-hidden rounded-[6px] border" style={{ borderColor: "var(--border-subtle)", backgroundColor: "var(--bg-surface)" }}>
      <div className="grid md:grid-cols-2">
        <div className="h-64 animate-shimmer md:h-80" />
        <div className="flex flex-col justify-center p-8 space-y-4">
          <div className="h-5 w-24 rounded-[3px] animate-shimmer" />
          <div className="h-8 w-full rounded-[6px] animate-shimmer" />
          <div className="h-8 w-3/4 rounded-[6px] animate-shimmer" />
          <div className="h-4 w-full rounded-[3px] animate-shimmer" />
          <div className="h-4 w-2/3 rounded-[3px] animate-shimmer" />
          <div className="h-3 w-1/3 rounded-[3px] animate-shimmer mt-2" />
        </div>
      </div>
    </div>
  );
}
