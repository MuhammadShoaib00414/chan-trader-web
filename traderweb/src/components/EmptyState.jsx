export default function EmptyState({ title, description, action }) {
  return (
    <div className="rounded-[2rem] border border-dashed border-slate-300 bg-white/85 p-10 text-center shadow-[0_24px_65px_rgba(15,23,42,0.06)]">
      <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-slate-600">
        {description}
      </p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}
