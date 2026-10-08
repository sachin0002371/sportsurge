export default function RootLoading() {
  return (
    <div className="min-h-screen animate-pulse">
      {/* Ribbon Skeleton */}
      <div className="bg-slate-100 border-b border-slate-200 py-3">
        <div className="max-w-7xl mx-auto px-4 flex items-center gap-3 overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="h-16 w-60 bg-white rounded-xl flex-shrink-0 border border-slate-200/60 shadow-xs" />
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Leaderboard Ad Skeleton */}
        <div className="h-24 bg-white rounded-2xl border border-slate-200" />

        {/* Hero Article Skeleton */}
        <div className="h-72 md:h-96 bg-white rounded-3xl border border-slate-200 overflow-hidden relative">
          <div className="absolute bottom-6 left-6 right-6 space-y-3">
            <div className="h-6 w-28 bg-slate-200 rounded-full" />
            <div className="h-8 w-3/4 bg-slate-200 rounded-lg" />
            <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
          </div>
        </div>

        {/* Grid of Matches / Content */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-4">
            <div className="h-8 w-48 bg-slate-200 rounded-lg mb-4" />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-36 bg-white rounded-2xl border border-slate-200 p-4 space-y-3">
                  <div className="flex justify-between">
                    <div className="h-4 w-20 bg-slate-200 rounded-full" />
                    <div className="h-4 w-12 bg-slate-200 rounded-full" />
                  </div>
                  <div className="h-5 w-3/4 bg-slate-200 rounded-lg" />
                  <div className="h-4 w-1/2 bg-slate-200 rounded-lg" />
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="h-8 w-36 bg-slate-200 rounded-lg mb-4" />
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
            <div className="h-48 bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
