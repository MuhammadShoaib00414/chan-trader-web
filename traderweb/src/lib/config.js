const trimSlash = (value) => value.replace(/\/+$/, '');

const defaultLaravelBaseUrl = 'http://127.0.0.1:8000';
const rawLaravelBaseUrl =
  import.meta.env.VITE_LARAVEL_BASE_URL || defaultLaravelBaseUrl;
const rawApiBaseUrl =
  import.meta.env.VITE_API_BASE_URL || `${trimSlash(rawLaravelBaseUrl)}/api`;

export const LARAVEL_BASE_URL = trimSlash(rawLaravelBaseUrl);
export const API_BASE_URL = trimSlash(rawApiBaseUrl);
export const DOCS_URL = `${LARAVEL_BASE_URL}/docs/api`;
