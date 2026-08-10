import { Skeleton } from "@/components/ui/skeleton";

// Szkielety odwzorowują układ docelowej treści, a nie generyczny prostokąt —
// dzięki temu przy podmianie nie skacze layout.

export function ProductGridSkeleton({ count = 8 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="space-y-4">
          <Skeleton className="aspect-square w-full rounded-[2rem]" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-6 w-1/3" />
        </div>
      ))}
    </div>
  );
}

export function ProductDetailSkeleton() {
  return (
    <div className="grid lg:grid-cols-2 gap-16">
      <Skeleton className="aspect-square w-full rounded-[3rem]" />
      <div className="space-y-8 py-8">
        <Skeleton className="h-16 w-4/5" />
        <Skeleton className="h-6 w-1/4" />
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
        </div>
        <Skeleton className="h-20 w-full rounded-full" />
      </div>
    </div>
  );
}

export function CategoryStripSkeleton() {
  return (
    <div className="flex gap-6 overflow-hidden py-10">
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="space-y-3 flex-shrink-0">
          <Skeleton className="h-40 w-40 rounded-[2rem]" />
          <Skeleton className="h-3 w-24" />
        </div>
      ))}
    </div>
  );
}

export function BannerSkeleton() {
  return <Skeleton className="h-72 w-full rounded-[3rem]" />;
}

/** Lista wierszy — zamówienia, opinie, składniki. */
export function RowsSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="space-y-4">
      {Array.from({ length: rows }).map((_, i) => (
        <Skeleton key={i} className="h-24 w-full rounded-[2rem]" />
      ))}
    </div>
  );
}

export function FormSkeleton({ fields = 4 }: { fields?: number }) {
  return (
    <div className="space-y-8 max-w-2xl">
      {Array.from({ length: fields }).map((_, i) => (
        <div key={i} className="space-y-3">
          <Skeleton className="h-3 w-32" />
          <Skeleton className="h-14 w-full rounded-full" />
        </div>
      ))}
      <Skeleton className="h-16 w-48 rounded-full" />
    </div>
  );
}

export function HeaderSkeleton() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-secondary bg-background/80 backdrop-blur-md">
      <div className="container mx-auto flex min-h-20 items-center justify-between px-4">
        <Skeleton className="h-8 w-32" />
        <div className="hidden md:flex gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-3 w-20" />
          ))}
        </div>
        <div className="flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </div>
    </header>
  );
}

export function SidebarSkeleton() {
  return (
    <div className="space-y-3 p-6">
      {Array.from({ length: 7 }).map((_, i) => (
        <Skeleton key={i} className="h-12 w-full rounded-full" />
      ))}
    </div>
  );
}
