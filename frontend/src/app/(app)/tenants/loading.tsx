import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-5">
      <Skeleton className="h-7 w-24" />
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="bg-stone-50 border-b border-stone-100 px-4 py-3 flex gap-6">
          {Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-3 w-16" />)}
        </div>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="px-4 py-4 flex gap-6 border-b border-stone-50">
            {Array.from({ length: 6 }).map((_, j) => (
              <Skeleton key={j} className="h-4 flex-1" />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
