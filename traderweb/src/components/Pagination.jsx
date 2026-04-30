export default function Pagination({
  currentPage,
  lastPage,
  onPageChange,
}) {
  if (!lastPage || lastPage <= 1) {
    return null;
  }

  const pages = [];
  const start = Math.max(1, currentPage - 2);
  const end = Math.min(lastPage, currentPage + 2);

  for (let page = start; page <= end; page += 1) {
    pages.push(page);
  }

  return (
    <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
      <button
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ff3a3d]/35 hover:text-[#ff3a3d] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={currentPage <= 1}
        type="button"
        onClick={() => onPageChange(currentPage - 1)}
      >
        Previous
      </button>

      {pages.map((page) => (
        <button
          key={page}
          className={`h-11 w-11 rounded-full text-sm font-semibold transition ${
            page === currentPage
              ? 'bg-[#ff3a3d] text-white shadow-[0_14px_30px_rgba(255,58,61,0.35)]'
              : 'border border-black/10 text-slate-700 hover:border-[#ff3a3d]/35 hover:text-[#ff3a3d]'
          }`}
          type="button"
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      <button
        className="rounded-full border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#ff3a3d]/35 hover:text-[#ff3a3d] disabled:cursor-not-allowed disabled:opacity-45"
        disabled={currentPage >= lastPage}
        type="button"
        onClick={() => onPageChange(currentPage + 1)}
      >
        Next
      </button>
    </div>
  );
}
