import AppLink from '../components/AppLink';
import EmptyState from '../components/EmptyState';
import { useShopStore } from '../lib/shop-store';
import { formatPrice, resolveAssetUrl } from '../lib/format';
import { paths } from '../lib/router';

export default function WishlistPage({ router }) {
  const { wishlistItems, toggleWishlist, addToCart } = useShopStore();

  if (!wishlistItems.length) {
    return (
      <EmptyState
        title="Your wishlist is empty"
        description="Save products here while you compare options or plan a larger order."
        action={
          <AppLink
            className="inline-flex rounded-sm bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white"
            router={router}
            to={paths.products()}
          >
            Browse products
          </AppLink>
        }
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff3a3d]">
            Wishlist
          </div>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
            Saved products
          </h1>
        </div>
        <div className="text-sm text-slate-500">
          {wishlistItems.length} item{wishlistItems.length === 1 ? '' : 's'}
        </div>
      </div>

      <div className="space-y-4">
        {wishlistItems.map((item) => (
          <article
            key={item.id}
            className="grid gap-4 rounded-[1.4rem] border border-black/8 bg-white p-4 shadow-sm md:grid-cols-[8rem_1fr_auto]"
          >
            <AppLink router={router} to={paths.product(item.id)}>
              <img
                alt={item.name}
                className="h-32 w-full rounded-[1rem] object-cover"
                src={resolveAssetUrl(item.thumb || item.feature_image, item.name)}
              />
            </AppLink>

            <div>
              <AppLink
                className="text-lg font-semibold text-slate-950 transition hover:text-[#ff3a3d]"
                router={router}
                to={paths.product(item.id)}
              >
                {item.name}
              </AppLink>
              <div className="mt-2 text-sm text-slate-500">
                {item.category?.name || 'Marketplace'} · {item.store?.name || 'General seller'}
              </div>
              <div className="mt-4 text-2xl font-semibold text-[#ff3a3d]">
                {formatPrice(item.discountedPrice ?? item.price)}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 md:items-end">
              <button
                className="rounded-sm border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                type="button"
                onClick={() => toggleWishlist(item)}
              >
                Remove
              </button>
              <button
                className="rounded-sm bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
                type="button"
                onClick={() => addToCart(item, 1)}
              >
                Add to Cart
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
