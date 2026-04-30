import { Heart, ShoppingCart } from 'lucide-react';
import { useEffect, useState } from 'react';
import AppLink from '../components/AppLink';
import EmptyState from '../components/EmptyState';
import LoadingPanel from '../components/LoadingPanel';
import ProductCard from '../components/ProductCard';
import SectionHeading from '../components/SectionHeading';
import { marketplaceApi } from '../lib/api';
import { useShopStore } from '../lib/shop-store';
import {
  formatPrice,
  formatRating,
  formatStockMessage,
  resolveAssetUrl,
} from '../lib/format';
import { paths } from '../lib/router';

export default function ProductDetailPage({ router, route }) {
  const { addToCart, isInWishlist, toggleWishlist } = useShopStore();
  const { productId } = route.params;
  const [state, setState] = useState({
    loading: true,
    error: '',
    product: null,
  });
  const [activeImage, setActiveImage] = useState('');

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setState({ loading: true, error: '', product: null });

      try {
        const product = await marketplaceApi.getProduct(productId);

        if (!cancelled) {
          setState({ loading: false, error: '', product });
          const firstImage =
            product.images?.[0]?.path || product.feature_image || product.thumb || '';
          setActiveImage(firstImage);
        }
      } catch (error) {
        if (!cancelled) {
          setState({ loading: false, error: error.message, product: null });
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (state.loading) {
    return <LoadingPanel label="Loading product detail..." />;
  }

  if (state.error || !state.product) {
    return (
      <EmptyState
        title="Product unavailable"
        description={state.error || 'The product could not be loaded from the Laravel API.'}
        action={
          <AppLink
            className="inline-flex rounded-full bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white"
            router={router}
            to={paths.products()}
          >
            Back to catalog
          </AppLink>
        }
      />
    );
  }

  const { product } = state;
  const selectedImage = activeImage || product.feature_image || product.thumb;
  const gallery = [
    ...(product.images || []).map((image) => image.path),
    product.feature_image,
    product.top_image,
  ].filter(Boolean);
  const sellingPrice = product.discountedPrice ?? product.price;
  const saved = isInWishlist(product.id);

  return (
    <div className="space-y-8">
      <section className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.2rem] border border-black/8 bg-white shadow-sm">
            <img
              alt={product.name}
              className="aspect-square w-full object-cover"
              src={resolveAssetUrl(selectedImage, product.name)}
            />
          </div>

          {gallery.length ? (
            <div className="grid grid-cols-4 gap-3">
              {gallery.slice(0, 8).map((image, index) => (
                <button
                  key={`${image}-${index}`}
                  className={`overflow-hidden rounded-[1.2rem] border transition ${
                    selectedImage === image
                      ? 'border-[#ff3a3d] shadow-[0_0_0_2px_rgba(255,58,61,0.14)]'
                      : 'border-black/8 hover:border-[#1d4ed8]/30'
                  }`}
                  type="button"
                  onClick={() => setActiveImage(image)}
                >
                  <img
                    alt={`${product.name} ${index + 1}`}
                    className="aspect-square w-full object-cover"
                    src={resolveAssetUrl(image, product.name)}
                  />
                </button>
              ))}
            </div>
          ) : null}
        </div>

        <div className="rounded-[1.2rem] border border-black/8 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center gap-2 text-xs font-semibold uppercase tracking-[0.26em] text-slate-500">
            <span className="rounded-sm bg-[#fff1f1] px-3 py-1 text-[#ff3a3d]">
              {product.category?.name || 'Marketplace'}
            </span>
            {product.brand?.name ? (
              <span className="rounded-sm bg-[#eff6ff] px-3 py-1 text-[#1d4ed8]">
                {product.brand.name}
              </span>
            ) : null}
          </div>

          <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-4xl">
            {product.name}
          </h1>

          <div className="mt-4 flex flex-wrap items-center gap-5 text-sm text-slate-600">
            <div>SKU: {product.sku || 'Not provided'}</div>
            <div>Condition: {product.condition || 'New'}</div>
            <div>Rating: {formatRating(product.rating_avg)} / 5</div>
          </div>

          <div className="mt-6 flex flex-wrap items-end gap-4">
            <div className="text-4xl font-bold text-[#ff3a3d]">
              {formatPrice(sellingPrice)}
            </div>
            {product.discount_percent ? (
              <div className="space-y-1">
                <div className="text-sm text-slate-400 line-through">
                  {formatPrice(product.price)}
                </div>
                <div className="inline-flex rounded-sm bg-[#ff3a3d] px-3 py-1 text-xs font-semibold text-white">
                  Save {product.discount_percent}%
                </div>
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-4 rounded-[1rem] bg-[#f8fafc] p-5 text-sm text-slate-700 md:grid-cols-2">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Stock
              </div>
              <div className="mt-2 font-semibold text-slate-950">
                {formatStockMessage(product.stock_status)}
              </div>
            </div>
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                Warranty
              </div>
              <div className="mt-2 font-semibold text-slate-950">
                {product.warranty_text ||
                  (product.warranty_months
                    ? `${product.warranty_months} months`
                    : 'Seller warranty details not specified')}
              </div>
            </div>
          </div>

          <div className="mt-6 space-y-4 text-sm leading-7 text-slate-600">
            <p>{product.short_description || product.description}</p>
            {product.deal_name ? (
              <div className="rounded-[1rem] border border-[#ff3a3d]/15 bg-[#fff5f5] px-4 py-3 text-[#7f1d1d]">
                Deal: {product.deal_name}
                {product.limited_discount_text
                  ? ` - ${product.limited_discount_text}`
                  : ''}
              </div>
            ) : null}
          </div>

          <div className="mt-6 grid gap-3 sm:grid-cols-[1fr_auto]">
            <button
              className="inline-flex items-center justify-center gap-2 rounded-sm bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
              type="button"
              onClick={() => addToCart(product, 1)}
            >
              <ShoppingCart className="h-4 w-4" />
              Add to Cart
            </button>
            <button
              className={`inline-flex items-center justify-center gap-2 rounded-sm border px-5 py-3 text-sm font-semibold transition ${
                saved
                  ? 'border-[#ff3a3d] bg-[#fff1f1] text-[#ff3a3d]'
                  : 'border-black/10 text-slate-700 hover:border-[#1d4ed8] hover:text-[#1d4ed8]'
              }`}
              type="button"
              onClick={() => toggleWishlist(product)}
            >
              <Heart className="h-4 w-4" fill={saved ? 'currentColor' : 'none'} />
              {saved ? 'Saved to Wishlist' : 'Add to Wishlist'}
            </button>
          </div>

          {product.store ? (
            <div className="mt-8 rounded-[1rem] border border-black/5 bg-white p-5 shadow-[0_12px_30px_rgba(15,23,42,0.04)]">
              <div className="text-xs font-semibold uppercase tracking-[0.24em] text-[#1d4ed8]">
                Sold by
              </div>
              <div className="mt-3 flex items-center justify-between gap-4">
                <div>
                  <div className="text-xl font-semibold text-slate-950">
                    {product.store.name}
                  </div>
                  <div className="mt-1 text-sm text-slate-600">
                    {product.store.city || 'Pakistan marketplace seller'}
                  </div>
                </div>
                <AppLink
                  className="rounded-sm bg-[#eff6ff] px-4 py-2 text-sm font-semibold text-[#1d4ed8] transition hover:bg-[#dbeafe]"
                  router={router}
                  to={paths.store(product.store.id)}
                >
                  Visit store
                </AppLink>
              </div>
            </div>
          ) : null}
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-[1fr_0.8fr]">
        <div className="rounded-[1rem] border border-black/8 bg-white p-6 shadow-sm">
          <SectionHeading
            eyebrow="Description"
            title="Product details"
            description="Long-form content from the product detail API."
          />
          <p className="text-sm leading-7 text-slate-600">
            {product.description || 'No detailed description has been entered for this product yet.'}
          </p>
        </div>

        <div className="rounded-[1rem] border border-black/8 bg-white p-6 shadow-sm">
          <SectionHeading
            eyebrow="Reviews"
            title="Recent customer feedback"
            description="These reviews are included in the published product payload."
          />
          <div className="space-y-4">
            {(product.reviews || []).length ? (
              product.reviews.map((review) => (
                <div
                  key={review.id}
                  className="rounded-[1.4rem] border border-black/5 bg-[#f8fafc] p-4"
                >
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-semibold text-slate-950">
                      {review.user?.name || 'Verified customer'}
                    </div>
                    <div className="text-sm text-[#ff3a3d]">
                      {review.rating} / 5
                    </div>
                  </div>
                  <p className="mt-3 text-sm leading-6 text-slate-600">
                    {review.comment || 'No comment provided.'}
                  </p>
                </div>
              ))
            ) : (
              <div className="rounded-[1.4rem] border border-dashed border-slate-300 bg-[#f8fafc] p-5 text-sm text-slate-600">
                No visible reviews yet.
              </div>
            )}
          </div>
        </div>
      </section>

      {(product.related_products || []).length ? (
        <section>
          <SectionHeading
            eyebrow="Related"
            title="More products from the same category"
            description="Pulled from the Laravel product detail endpoint."
          />
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
            {product.related_products.slice(0, 4).map((relatedProduct) => (
              <ProductCard
                key={relatedProduct.id}
                product={relatedProduct}
                router={router}
              />
            ))}
          </div>
        </section>
      ) : null}
    </div>
  );
}
