export default function NewsLoading() {
  return (
    <div className="min-h-screen bg-[#F8FAFC] animate-pulse">
      {/* Header Skeleton */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-slate-200" />
            <div className="space-y-2">
              <div className="h-8 w-56 bg-slate-200 rounded-lg" />
              <div className="h-4 w-80 bg-slate-200 rounded-md" />
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          <div className="lg:col-span-3 space-y-6">
            {/* Category pills */}
            <div className="flex gap-2 overflow-hidden">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-9 w-24 bg-slate-200 rounded-full flex-shrink-0" />
              ))}
            </div>

            {/* Articles Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden space-y-3 pb-4">
                  <div className="h-44 bg-slate-200 w-full" />
                  <div className="px-4 space-y-2">
                    <div className="h-3 w-16 bg-slate-200 rounded-full" />
                    <div className="h-5 w-full bg-slate-200 rounded" />
                    <div className="h-4 w-3/4 bg-slate-200 rounded" />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <div className="h-64 bg-white rounded-2xl border border-slate-200" />
            <div className="h-56 bg-white rounded-2xl border border-slate-200" />
          </div>
        </div>
      </div>
    </div>
  );
}
