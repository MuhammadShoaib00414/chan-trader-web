import AppLink from '../components/AppLink';
import EmptyState from '../components/EmptyState';
import { formatPrice, resolveAssetUrl } from '../lib/format';
import { paths } from '../lib/router';
import { useShopStore } from '../lib/shop-store';

export default function CartPage({ router }) {
  const {
    cartItems,
    clearCart,
    removeFromCart,
    updateCartQuantity,
  } = useShopStore();

  if (!cartItems.length) {
    return (
      <EmptyState
        title="Your cart is empty"
        description="Add products from the shop to start building an order."
        action={
          <AppLink
            className="inline-flex rounded-sm bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white"
            router={router}
            to={paths.products()}
          >
            Start shopping
          </AppLink>
        }
      />
    );
  }

  const subtotal = cartItems.reduce((total, item) => {
    const unitPrice = Number(item.discountedPrice ?? item.price ?? 0);
    return total + unitPrice * item.quantity;
  }, 0);

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <div className="space-y-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-[#ff3a3d]">
              Cart
            </div>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">
              Shopping cart
            </h1>
          </div>
          <button
            className="rounded-sm border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
            type="button"
            onClick={clearCart}
          >
            Clear cart
          </button>
        </div>

        {cartItems.map((item) => (
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
              <div className="mt-4 text-xl font-semibold text-[#ff3a3d]">
                {formatPrice(item.discountedPrice ?? item.price)}
              </div>
            </div>

            <div className="flex flex-col justify-between gap-3 md:items-end">
              <div className="flex items-center rounded-sm border border-black/10">
                <button
                  className="h-10 w-10 text-slate-700 transition hover:bg-[#fafafa]"
                  type="button"
                  onClick={() => updateCartQuantity(item.id, item.quantity - 1)}
                >
                  -
                </button>
                <div className="flex h-10 min-w-12 items-center justify-center border-x border-black/10 text-sm font-semibold text-slate-900">
                  {item.quantity}
                </div>
                <button
                  className="h-10 w-10 text-slate-700 transition hover:bg-[#fafafa]"
                  type="button"
                  onClick={() => updateCartQuantity(item.id, item.quantity + 1)}
                >
                  +
                </button>
              </div>

              <button
                className="rounded-sm border border-black/10 px-4 py-2 text-sm font-medium text-slate-700 transition hover:border-[#1d4ed8] hover:text-[#1d4ed8]"
                type="button"
                onClick={() => removeFromCart(item.id)}
              >
                Remove
              </button>
            </div>
          </article>
        ))}
      </div>

      <aside className="h-fit rounded-[1.4rem] border border-black/8 bg-white p-5 shadow-sm">
        <div className="text-sm font-semibold uppercase tracking-[0.22em] text-slate-500">
          Order Summary
        </div>
        <div className="mt-5 flex items-center justify-between text-sm text-slate-600">
          <span>Items</span>
          <span>{cartItems.length}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="mt-3 flex items-center justify-between text-sm text-slate-600">
          <span>Shipping</span>
          <span>Calculated later</span>
        </div>
        <div className="mt-5 border-t border-black/8 pt-4">
          <div className="flex items-center justify-between">
            <span className="text-base font-semibold text-slate-900">Total</span>
            <span className="text-2xl font-semibold text-[#ff3a3d]">
              {formatPrice(subtotal)}
            </span>
          </div>
        </div>
        <button
          className="mt-6 w-full rounded-sm bg-[#ff3a3d] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#ef2f33]"
          type="button"
        >
          Proceed to Checkout
        </button>
      </aside>
    </div>
  );
}
