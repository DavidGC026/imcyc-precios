import { APP_BASE } from '../api/client';

/**
 * Query string de la SPA (#/checkout?plan=...) o de pathname (?plan=...).
 */
export function getAppSearchParams() {
  const hash = window.location.hash || '';
  if (hash.includes('?')) {
    return new URLSearchParams(hash.slice(hash.indexOf('?')));
  }
  if (window.location.search) {
    return new URLSearchParams(window.location.search);
  }
  return new URLSearchParams();
}

/** Ruta interna de la SPA: /checkout, /confirmacion, etc. */
export function getAppPath() {
  const hash = window.location.hash || '';
  if (hash.startsWith('#/')) {
    const path = hash.slice(1).split('?')[0];
    return path || '/';
  }
  const normalized = window.location.pathname
    .replace(APP_BASE, '')
    .replace(/\/$/, '') || '/';
  return normalized === '' ? '/' : normalized;
}

export function appUrl(path = '/', query = '') {
  const base = APP_BASE.replace(/\/$/, '');
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  const q = query ? (query.startsWith('?') ? query : `?${query}`) : '';
  return `${base}/#${cleanPath}${q}`;
}
