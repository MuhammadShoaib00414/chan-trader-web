export default function SectionHeading({ eyebrow, title, description, action }) {
  return (
    <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      <div className="max-w-2xl">
        {eyebrow ? (
          <div className="mb-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#ff3a3d]">
            {eyebrow}
          </div>
        ) : null}
        <h2 className="text-2xl font-semibold tracking-tight text-slate-950 md:text-3xl">
          {title}
        </h2>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        ) : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
  );
}
