export function csrfToken(): string {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
  return el?.content ?? ''
}

export function requestJson(method: string, url: string, data?: any) {
  const token = csrfToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    headers['X-CSRF-TOKEN'] = token;
  }

  return fetch(url, {
    method,
    credentials: 'same-origin',
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });
}

export const postJson = (url: string, data?: unknown) => requestJson('POST', url, data)
export const patchJson = (url: string, data?: unknown) => requestJson('PATCH', url, data)
export const delJson = (url: string, data?: unknown) => requestJson('DELETE', url, data)

export function requestForm(method: string, url: string, form: FormData) {
  const token = csrfToken();
  const headers: Record<string, string> = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };

  if (token) {
    headers['X-CSRF-TOKEN'] = token;
    // Also add to form body for extra reliability with some Laravel configurations
    if (!form.has('_token')) {
      form.append('_token', token);
    }
  }

  return fetch(url, {
    method,
    credentials: 'same-origin',
    headers,
    body: form,
  });
}

export const postForm = (url: string, form: FormData) => requestForm('POST', url, form)
/**
 * Important:
 * Most PHP setups don't handle multipart file uploads for true PATCH/PUT requests.
 * Use method spoofing (POST + _method=PATCH) so `$request->hasFile()` works reliably.
 */
export const patchForm = (url: string, form: FormData) => {
  if (!form.has('_method')) form.append('_method', 'PATCH')
  return requestForm('POST', url, form)
}
