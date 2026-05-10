export default function PriceHistorySkeletonCard() {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 flex flex-col animate-pulse">
      {/* Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-200" />
          <div>
            <div className="h-4 w-32 bg-slate-200 rounded mb-2" />
            <div className="h-3 w-20 bg-slate-100 rounded" />
          </div>
        </div>
        <div className="h-6 w-16 bg-slate-200 rounded-md" />
      </div>

      {/* Chart bars */}
      <div className="h-32 flex items-end justify-between gap-1.5 mb-2 mt-auto">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-1.5 h-full justify-end">
            <div
              className="w-full rounded-t bg-slate-200"
              style={{ height: `${30 + Math.random() * 60}%` }}
            />
            <div className="h-2 w-3 bg-slate-100 rounded" />
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="pt-4 mt-2 border-t border-slate-100 flex justify-between">
        <div className="h-3 w-20 bg-slate-200 rounded" />
        <div className="h-3 w-16 bg-slate-200 rounded" />
      </div>
    </div>
  );
}