export function CardSkeleton() {
  return (
    <div
      aria-hidden="true"
      className="relative h-[min(520px,calc(100dvh-250px))] w-[min(360px,90vw)] animate-pulse overflow-hidden rounded-[20px] bg-white shadow-card"
    >
      <div className="h-[60%] w-full bg-[#EDE9FE]" />
      <div className="space-y-3 p-4">
        <div className="h-5 w-2/3 rounded-full bg-[#EDE9FE]" />
        <div className="h-3 w-1/3 rounded-full bg-[#F3EEFF]" />
        <div className="h-3 w-full rounded-full bg-[#F3EEFF]" />
        <div className="h-3 w-4/5 rounded-full bg-[#F3EEFF]" />
        <div className="flex gap-2 pt-1">
          <div className="h-6 w-16 rounded-full bg-[#EDE9FE]" />
          <div className="h-6 w-20 rounded-full bg-[#EDE9FE]" />
        </div>
      </div>
    </div>
  );
}

export function MatchesSkeleton() {
  return (
    <div className="grid grid-cols-2 gap-3" aria-hidden="true">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="animate-pulse overflow-hidden rounded-2xl bg-white p-2 shadow-soft"
        >
          <div className="aspect-square rounded-xl bg-[#EDE9FE]" />
          <div className="mt-2 h-3.5 w-3/4 rounded-full bg-[#F3EEFF]" />
          <div className="mt-1.5 h-3 w-1/2 rounded-full bg-[#F3EEFF]" />
        </div>
      ))}
    </div>
  );
}
