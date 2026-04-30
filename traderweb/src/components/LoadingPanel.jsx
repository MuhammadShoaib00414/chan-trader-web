export default function LoadingPanel({ label = 'Loading marketplace data...' }) {
  return (
    <div className="rounded-[2rem] border border-black/5 bg-white/90 p-10 shadow-[0_28px_70px_rgba(15,23,42,0.08)]">
      <div className="flex items-center gap-4">
        <div className="h-11 w-11 animate-spin rounded-full border-4 border-[#ff3a3d]/15 border-t-[#ff3a3d]" />
        <div>
          <div className="text-sm font-semibold text-slate-900">{label}</div>
          <div className="text-sm text-slate-500">
            Pulling the latest response from the Laravel API.
          </div>
        </div>
      </div>
    </div>
  );
}
