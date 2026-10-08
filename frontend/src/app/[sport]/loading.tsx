export default function SportLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Sport Header Skeleton */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-slate-200" />
            <div className="space-y-2">
              <div className="h-8 w-40 bg-slate-200 rounded-lg" />
              <div className="h-4 w-64 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-6">
        {/* Ad Skeleton */}
        <div className="h-20 bg-white rounded-2xl border border-slate-200" />

        {/* Tabs Skeleton */}
        <div className="h-10 w-72 bg-slate-200 rounded-xl mb-6" />

        {/* Match Cards Grid Skeleton */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-44 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
              <div className="flex justify-between items-center">
                <div className="h-4 w-20 bg-slate-200 rounded-full" />
                <div className="h-4 w-12 bg-slate-200 rounded-full" />
              </div>
              <div className="space-y-2 py-2">
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-8 bg-slate-200 rounded" />
                </div>
                <div className="flex justify-between">
                  <div className="h-4 w-32 bg-slate-200 rounded" />
                  <div className="h-4 w-8 bg-slate-200 rounded" />
                </div>
              </div>
              <div className="h-3 w-full bg-slate-100 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
