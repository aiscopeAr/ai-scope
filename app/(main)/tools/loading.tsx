import { CardSkeletonGrid } from "@/components/CardSkeleton";

export default function ToolsLoading() {
  return (
    <div className="container mx-auto px-4 py-14" dir="rtl">
      {/* Hero skeleton */}
      <div className="mb-16 text-center space-y-4">
        <div className="h-8 w-40 animate-shimmer rounded-full mx-auto" />
        <div className="h-14 w-72 animate-shimmer rounded-xl mx-auto" />
        <div className="h-5 w-96 animate-shimmer rounded-lg mx-auto" />
      </div>
      {/* Category grid skeleton */}
      <div className="mb-16 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-2xl border border-white/5 bg-white/3 p-5">
            <div className="h-8 w-8 animate-shimmer rounded-xl mx-auto mb-2" />
            <div className="h-3 w-16 animate-shimmer rounded mx-auto" />
          </div>
        ))}
      </div>
      {/* Prompts grid skeleton */}
      <CardSkeletonGrid count={6} />
    </div>
  );
}
