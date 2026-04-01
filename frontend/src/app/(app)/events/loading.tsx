import { Skeleton } from "@/components/Skeleton";

export default function Loading() {
  return (
    <div className="p-6 space-y-5">
      <Skeleton className="h-7 w-40" />
      <div className="flex items-center justify-between">
        <Skeleton className="h-9 w-48 rounded-xl" />
        <Skeleton className="h-9 w-28 rounded-xl" />
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 overflow-hidden">
        <div className="px-5 py-3 border-b border-stone-100">
          <Skeleton className="h-4 w-24" />
        </div>
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="px-5 py-4 flex items-center justify-between border-b border-stone-50">
            <div className="flex gap-3 flex-1">
              <Skeleton className="h-4 w-4 rounded-full shrink-0" />
              <div className="space-y-1.5 flex-1">
                <Skeleton className="h-4 w-48" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
        ))}
      </div>
    </div>
  );
}
