const Skeleton = ({ className, style }: { className?: string; style?: React.CSSProperties }) => (
  <div className={`skeleton rounded-xl ${className}`} style={style} />
);

export const PropertyCardSkeleton = () => (
  <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-100 p-4 space-y-4">
    <Skeleton className="h-48 w-full" />
    <Skeleton className="h-6 w-3/4" />
    <Skeleton className="h-4 w-1/2" />
    <div className="flex justify-between pt-4">
      <Skeleton className="h-4 w-1/4" />
      <Skeleton className="h-4 w-1/4" />
    </div>
  </div>
);

const CHART_BAR_HEIGHTS_PCT = [52, 71, 48, 65, 58, 44] as const;

export const ChartSkeleton = () => (
  <div className="space-y-4">
    <div className="flex justify-between items-end h-64 space-x-2">
      {CHART_BAR_HEIGHTS_PCT.map((pct, i) => (
        <Skeleton key={i} className="flex-1" style={{ height: `${pct}%` }} />
      ))}
    </div>
    <div className="flex justify-between">
      {[...Array(6)].map((_, i) => (
        <Skeleton key={i} className="h-3 w-8" />
      ))}
    </div>
  </div>
);

export default Skeleton;
