import AppLink from '../components/AppLink';
import { contactDetails } from '../content/siteContent';
import { paths } from '../lib/router';

export default function ContactPage({ router }) {
  return (
    <div className="space-y-8">
      <section className="overflow-hidden rounded-[2.4rem] border border-black/5 bg-[linear-gradient(135deg,_#111827,_#1d4ed8_55%,_#ff3a3d)] p-8 text-white shadow-[0_32px_90px_rgba(15,23,42,0.18)] md:p-10">
        <div className="max-w-3xl">
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-white/75">
            Customer Care
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight md:text-5xl">
            Contact Us
          </h1>
          <p className="mt-4 text-base leading-7 text-white/80 md:text-lg">
            Keep the contact page direct and operational: key channels first,
            response expectations second, and policy links nearby.
          </p>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[1fr_0.95fr]">
        <div className="grid gap-6 md:grid-cols-2">
          <ContactCard
            label="Phone"
            title={contactDetails.phone}
            description="For urgent order and dispatch questions during business hours."
          />
          <ContactCard
            label="Email"
            title={contactDetails.email}
            description="Best for quotation requests, support history, and detailed issue reporting."
          />
          <ContactCard
            label="Address"
            title={contactDetails.address}
            description="Use this block for warehouse, pickup, or service center details."
          />
          <ContactCard
            label="Working Hours"
            title={contactDetails.hours}
            description="Set realistic response expectations for sales and support teams."
          />
        </div>

        <div className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_65px_rgba(15,23,42,0.06)]">
          <h2 className="text-2xl font-semibold tracking-tight text-slate-950">
            Before you reach out
          </h2>
          <div className="mt-5 space-y-3">
            {[
              'Keep the product name or SKU ready.',
              'Include your order number for delivery or payment questions.',
              'Use clear photos or short videos for damaged or incorrect items.',
              'Check the policy and payment pages if your question is procedural.',
            ].map((item) => (
              <div
                key={item}
                className="rounded-[1.4rem] bg-[#f8fafc] px-4 py-3 text-sm leading-6 text-slate-700"
              >
                {item}
              </div>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <AppLink
              className="rounded-full bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
              router={router}
              to={paths.support()}
            >
              Open support page
            </AppLink>
            <AppLink
              className="rounded-full border border-black/10 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-[#1d4ed8]/30 hover:text-[#1d4ed8]"
              router={router}
              to={paths.paymentMethods()}
            >
              View payment guidance
            </AppLink>
          </div>
        </div>
      </section>
    </div>
  );
}

function ContactCard({ label, title, description }) {
  return (
    <article className="rounded-[2rem] border border-black/5 bg-white p-6 shadow-[0_24px_65px_rgba(15,23,42,0.06)]">
      <div className="text-xs font-semibold uppercase tracking-[0.26em] text-[#1d4ed8]">
        {label}
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-3 text-sm leading-6 text-slate-600">{description}</p>
    </article>
  );
}
