import AppLink from './AppLink';
import {
  formatCompactNumber,
  formatRating,
  resolveAssetUrl,
} from '../lib/format';
import { paths } from '../lib/router';

export default function StoreCard({ router, store }) {
  return (
    <AppLink
      router={router}
      to={paths.store(store.id)}
      className="overflow-hidden rounded-[1.8rem] border border-black/5 bg-white shadow-[0_24px_65px_rgba(15,23,42,0.06)] transition hover:-translate-y-1 hover:shadow-[0_32px_90px_rgba(15,23,42,0.11)]"
    >
      <div className="relative h-44 overflow-hidden bg-[linear-gradient(135deg,_#1d4ed8,_#60a5fa)]">
        <img
          alt={store.name}
          className="h-full w-full object-cover opacity-70"
          src={resolveAssetUrl(store.banner || store.logo, store.name)}
        />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,transparent,rgba(15,23,42,0.55))]" />
        <div className="absolute bottom-4 left-4 flex items-center gap-3">
          <img
            alt={`${store.name} logo`}
            className="h-14 w-14 rounded-2xl border border-white/40 object-cover shadow-lg"
            src={resolveAssetUrl(store.logo || store.banner, store.name)}
          />
          <div className="text-white">
            <div className="text-lg font-semibold">{store.name}</div>
            <div className="text-sm text-white/80">
              {store.city || 'Marketplace seller'}
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-4 p-5 text-sm text-slate-600">
        <div>
          <div className="text-lg font-bold text-slate-950">
            {formatRating(store.rating_avg)}
          </div>
          <div>rating</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-950">
            {formatCompactNumber(store.products_count)}
          </div>
          <div>products</div>
        </div>
        <div>
          <div className="text-lg font-bold text-slate-950">
            {formatCompactNumber(store.followers_count)}
          </div>
          <div>followers</div>
        </div>
      </div>
    </AppLink>
  );
}
