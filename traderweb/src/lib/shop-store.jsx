import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

const ShopStoreContext = createContext(null);
const storageKey = 'traderweb-shop-store';

function normaliseProduct(product) {
  return {
    id: product.id,
    name: product.name,
    slug: product.slug,
    sku: product.sku,
    price: product.price,
    discountedPrice: product.discountedPrice ?? null,
    discount_percent: product.discount_percent ?? 0,
    thumb: product.thumb || product.feature_image || null,
    feature_image: product.feature_image || product.thumb || null,
    short_description: product.short_description || '',
    stock_status: product.stock_status || null,
    store: product.store || null,
    category: product.category || null,
  };
}

function readInitialState() {
  if (typeof window === 'undefined') {
    return { cartItems: [], wishlistItems: [] };
  }

  try {
    const raw = window.localStorage.getItem(storageKey);

    if (!raw) {
      return { cartItems: [], wishlistItems: [] };
    }

    const parsed = JSON.parse(raw);
    return {
      cartItems: Array.isArray(parsed.cartItems) ? parsed.cartItems : [],
      wishlistItems: Array.isArray(parsed.wishlistItems)
        ? parsed.wishlistItems
        : [],
    };
  } catch {
    return { cartItems: [], wishlistItems: [] };
  }
}

export function ShopStoreProvider({ children }) {
  const [state, setState] = useState(readInitialState);

  useEffect(() => {
    window.localStorage.setItem(storageKey, JSON.stringify(state));
  }, [state]);

  const value = useMemo(() => {
    const cartCount = state.cartItems.reduce(
      (total, item) => total + item.quantity,
      0,
    );
    const wishlistCount = state.wishlistItems.length;

    return {
      cartItems: state.cartItems,
      wishlistItems: state.wishlistItems,
      cartCount,
      wishlistCount,
      isInWishlist(productId) {
        return state.wishlistItems.some((item) => item.id === productId);
      },
      addToCart(product, quantity = 1) {
        const normalized = normaliseProduct(product);

        setState((current) => {
          const existing = current.cartItems.find(
            (item) => item.id === normalized.id,
          );

          if (existing) {
            return {
              ...current,
              cartItems: current.cartItems.map((item) =>
                item.id === normalized.id
                  ? { ...item, quantity: item.quantity + quantity }
                  : item,
              ),
            };
          }

          return {
            ...current,
            cartItems: [...current.cartItems, { ...normalized, quantity }],
          };
        });
      },
      removeFromCart(productId) {
        setState((current) => ({
          ...current,
          cartItems: current.cartItems.filter((item) => item.id !== productId),
        }));
      },
      updateCartQuantity(productId, quantity) {
        setState((current) => ({
          ...current,
          cartItems: current.cartItems
            .map((item) =>
              item.id === productId
                ? { ...item, quantity: Math.max(1, quantity) }
                : item,
            )
            .filter((item) => item.quantity > 0),
        }));
      },
      clearCart() {
        setState((current) => ({ ...current, cartItems: [] }));
      },
      toggleWishlist(product) {
        const normalized = normaliseProduct(product);

        setState((current) => {
          const exists = current.wishlistItems.some(
            (item) => item.id === normalized.id,
          );

          return {
            ...current,
            wishlistItems: exists
              ? current.wishlistItems.filter((item) => item.id !== normalized.id)
              : [...current.wishlistItems, normalized],
          };
        });
      },
    };
  }, [state]);

  return (
    <ShopStoreContext.Provider value={value}>
      {children}
    </ShopStoreContext.Provider>
  );
}

export function useShopStore() {
  const context = useContext(ShopStoreContext);

  if (!context) {
    throw new Error('useShopStore must be used within ShopStoreProvider.');
  }

  return context;
}
