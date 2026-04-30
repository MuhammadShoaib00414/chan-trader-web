import AppLink from './AppLink';
import { pageQuickLinks } from '../content/siteContent';

export default function InfoPage({
  router,
  eyebrow,
  title,
  description,
  sections,
  sidebarTitle = 'Quick links',
  sidebarDescription = 'Jump to the key customer and company pages from one place.',
}) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.4rem] border border-black/5 bg-[linear-gradient(135deg,_#111827,_#172554_55%,_#ff3a3d)] p-8 text-white shadow-[0_32px_90px_rgba(15,23,42,0.18)] md:p-10">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
            {eyebrow}
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            {title}
          </h1>
          <p className="mt-4 text-base leading-7 text-white/80 md:text-lg">
            {description}
          </p>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_18rem]">
        <div className="space-y-6">
          {sections.map((section) => (
            <article
              key={section.title}
              className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_65px_rgba(15,23,42,0.06)]"
            >
              <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
                {section.title}
              </h2>

              {section.body?.map((paragraph) => (
                <p
                  key={paragraph}
                  className="mt-4 text-sm leading-7 text-slate-600"
                >
                  {paragraph}
                </p>
              ))}

              {section.items?.length ? (
                <ul className="mt-5 space-y-3">
                  {section.items.map((item) => (
                    <li
                      key={item}
                      className="rounded-[1.3rem] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-slate-700"
                    >
                      {item}
                    </li>
                  ))}
                </ul>
              ) : null}

              {section.cards?.length ? (
                <div className="mt-5 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {section.cards.map((card) => (
                    <div
                      key={card.title}
                      className="rounded-[1.5rem] border border-black/5 bg-[#fffdfd] p-5"
                    >
                      <h3 className="text-lg font-semibold text-slate-950">
                        {card.title}
                      </h3>
                      <p className="mt-3 text-sm leading-6 text-slate-600">
                        {card.description}
                      </p>
                    </div>
                  ))}
                </div>
              ) : null}
            </article>
          ))}
        </div>

        <aside className="space-y-4">
          <div className="rounded-[2rem] border border-black/5 bg-white p-5 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
            <h2 className="text-lg font-semibold text-slate-950">
              {sidebarTitle}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {sidebarDescription}
            </p>
            <div className="mt-5 flex flex-col gap-2">
              {pageQuickLinks.map((link) => (
                <AppLink
                  key={link.label}
                  className="rounded-full px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-[#fff1f1] hover:text-[#ff3a3d]"
                  router={router}
                  to={link.href}
                >
                  {link.label}
                </AppLink>
              ))}
            </div>
          </div>
        </aside>
      </section>
    </div>
  );
}
