export default function Loading() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 w-56 rounded-lg bg-slate-200" />
      <div className="h-4 w-80 rounded bg-slate-200" />
      <div className="mt-6 space-y-2 rounded-xl border border-slate-200 bg-white p-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-10 rounded-lg bg-slate-100" />
        ))}
      </div>
    </div>
  );
}
