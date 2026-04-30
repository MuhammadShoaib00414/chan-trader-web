import { API_BASE_URL } from './config';

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  const payload = await response.json().catch(() => null);

  if (!response.ok || !payload?.success) {
    throw new Error(payload?.message || 'Request failed.');
  }

  return payload.data;
}

function withQuery(path, query = {}) {
  const search = new URLSearchParams();

  Object.entries(query).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    search.set(key, String(value));
  });

  const queryString = search.toString();
  return queryString ? `${path}?${queryString}` : path;
}

export const marketplaceApi = {
  getHome() {
    return request('/app/home');
  },
  getPromotions(query = { device_type: 'web', per_page: 6 }) {
    return request(withQuery('/app/promotions', query));
  },
  getCategories() {
    return request('/app/categories');
  },
  getCategoryCounts() {
    return request('/app/products/category-counts');
  },
  getSubcategories(categoryId) {
    return request(withQuery('/app/subcategories', { category_id: categoryId }));
  },
  getStores(query = {}) {
    return request(withQuery('/app/stores', query));
  },
  getStore(storeId) {
    return request(`/app/stores/${storeId}`);
  },
  getProducts(query = {}) {
    return request(withQuery('/app/products', query));
  },
  getProduct(productId) {
    return request(`/app/products/${productId}`);
  },
};
