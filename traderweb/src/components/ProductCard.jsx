import { Heart, ShoppingCart } from 'lucide-react';
import AppLink from './AppLink';
import { useShopStore } from '../lib/shop-store';
import {
  formatPrice,
  formatRating,
  formatStockMessage,
  resolveAssetUrl,
} from '../lib/format';
import { paths } from '../lib/router';

export default function ProductCard({ product, router }) {
  const { addToCart, isInWishlist, toggleWishlist } = useShopStore();
  const sellingPrice = product.discountedPrice ?? product.price;
  const hasDiscount =
    product.discount_percent && Number(product.discount_percent) > 0;
  const saved = isInWishlist(product.id);

  return (
    <article className="group overflow-hidden rounded-[1rem] border border-black/8 bg-white shadow-sm transition hover:-translate-y-1 hover:shadow-[0_20px_40px_rgba(15,23,42,0.08)]">
      <div className="relative aspect-[4/3] overflow-hidden bg-[#f8fafc]">
        <AppLink router={router} to={paths.product(product.id)}>
          <img
            alt={product.name}
            className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
            src={resolveAssetUrl(product.thumb || product.feature_image, product.name)}
          />
        </AppLink>
        {hasDiscount ? (
          <div className="absolute left-3 top-3 rounded-sm bg-[#ff3a3d] px-2.5 py-1 text-xs font-semibold text-white">
            -{product.discount_percent}%
          </div>
        ) : null}
        <button
          className={`absolute right-3 top-3 inline-flex h-9 w-9 items-center justify-center rounded-sm border transition ${
            saved
              ? 'border-[#ff3a3d] bg-[#fff1f1] text-[#ff3a3d]'
              : 'border-white/70 bg-white/90 text-slate-600 hover:border-[#ff3a3d] hover:text-[#ff3a3d]'
          }`}
          type="button"
          onClick={() => toggleWishlist(product)}
        >
          <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
        </button>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
          <span className="rounded-sm bg-slate-100 px-2.5 py-1">
            {product.category?.name || 'Marketplace'}
          </span>
          <span>{product.store?.name || 'General seller'}</span>
        </div>

        <div>
          <AppLink router={router} to={paths.product(product.id)}>
            <h3 className="line-clamp-2 text-base font-semibold leading-6 text-slate-950 transition hover:text-[#ff3a3d]">
              {product.name}
            </h3>
          </AppLink>
          <p className="mt-1 line-clamp-2 text-sm leading-6 text-slate-600">
            {product.short_description || product.description || 'Detailed specs available on the product page.'}
          </p>
        </div>

        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-lg font-bold text-[#ff3a3d]">
              {formatPrice(sellingPrice)}
            </div>
            {hasDiscount ? (
              <div className="text-sm text-slate-400 line-through">
                {formatPrice(product.price)}
              </div>
            ) : null}
          </div>
          <div className="text-right text-xs text-slate-500">
            <div className="font-semibold text-slate-800">
              {formatRating(product.rating_avg)} / 5
            </div>
            <div>{formatStockMessage(product.stock_status)}</div>
          </div>
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_auto]">
          <button
            className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#ff3a3d] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
            type="button"
            onClick={() => addToCart(product, 1)}
          >
            <ShoppingCart className="h-4 w-4" />
            Add to Cart
          </button>
          <button
            className={`inline-flex items-center justify-center rounded-sm border px-3 py-3 text-sm font-medium transition ${
              saved
                ? 'border-[#ff3a3d] text-[#ff3a3d]'
                : 'border-black/10 text-slate-700 hover:border-[#1d4ed8] hover:text-[#1d4ed8]'
            }`}
            type="button"
            onClick={() => toggleWishlist(product)}
          >
            Wishlist
          </button>
        </div>
      </div>
    </article>
  );
}
