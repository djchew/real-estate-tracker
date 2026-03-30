import { cn } from "@/lib/utils";

export function Skeleton({ className }: { className?: string }) {
  return (
    <div className={cn("animate-pulse rounded-xl bg-stone-200/60", className)} />
  );
}

export function CardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
      <Skeleton className="h-8 w-8 rounded-xl" />
      <Skeleton className="h-3 w-24" />
      <Skeleton className="h-6 w-32" />
    </div>
  );
}

export function PageSkeleton({ title }: { title: string }) {
  return (
    <div className="p-6 space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-stone-800">{title}</h1>
        <Skeleton className="h-3 w-40" />
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => <CardSkeleton key={i} />)}
      </div>
      <div className="bg-white rounded-2xl border border-stone-100 shadow-sm p-5 space-y-3">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className={`h-4 ${i % 2 === 0 ? "w-3/4" : "w-1/2"}`} />
        ))}
      </div>
    </div>
  );
}
