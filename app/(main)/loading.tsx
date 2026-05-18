import { FeaturedSkeleton, CardSkeletonGrid } from "@/components/CardSkeleton";

export default function Loading() {
  return (
    <div className="container mx-auto px-4 pb-16">
      <div className="py-20 text-center">
        <div className="mb-4 h-8 w-48 animate-shimmer rounded-full mx-auto" />
        <div className="mb-2 h-14 w-80 animate-shimmer rounded-xl mx-auto" />
        <div className="h-14 w-64 animate-shimmer rounded-xl mx-auto" />
      </div>
      <div className="mb-10">
        <FeaturedSkeleton />
      </div>
      <CardSkeletonGrid count={6} />
    </div>
  );
}
