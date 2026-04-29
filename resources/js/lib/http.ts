function syncMetaCsrfToken(token: string): void {
  if (!token) return

  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
  if (el && el.content !== token) el.content = token
}

export function csrfToken(): string {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
  return el?.content ?? ''
}

/**
 * Fetch a fresh CSRF token from Laravel and update the meta tag.
 * This app uses the web session guard, so we ask Laravel for a fresh token directly.
 */
async function refreshCsrfToken(): Promise<void> {
  const res = await fetch('/csrf-token', {
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
    },
  })

  if (!res.ok) return

  const data = (await res.json()) as { token?: string }
  if (data.token) syncMetaCsrfToken(data.token)
}

async function prepareCsrfToken(): Promise<string> {
  await refreshCsrfToken()
  return csrfToken()
}

function buildJsonHeaders(token: string): Record<string, string> {
  return {
    'Content-Type': 'application/json',
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
  }
}

function buildFormHeaders(token: string): Record<string, string> {
  return {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    ...(token ? { 'X-CSRF-TOKEN': token } : {}),
  }
}

export async function requestJson(method: string, url: string, data?: unknown): Promise<Response> {
  let token = await prepareCsrfToken()
  let res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: buildJsonHeaders(token),
    body: data ? JSON.stringify(data) : undefined,
  })

  // 419 = CSRF token mismatch — refresh and retry once
  if (res.status === 419) {
    await refreshCsrfToken()
    token = csrfToken()
    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: buildJsonHeaders(token),
      body: data ? JSON.stringify(data) : undefined,
    })
  }

  return res
}

export const postJson = (url: string, data?: unknown) => requestJson('POST', url, data)
export const patchJson = (url: string, data?: unknown) => requestJson('PATCH', url, data)
export const delJson = (url: string, data?: unknown) => requestJson('DELETE', url, data)

export async function requestForm(method: string, url: string, form: FormData): Promise<Response> {
  let token = await prepareCsrfToken()

  const attachToken = (fd: FormData, t: string) => {
    if (t && !fd.has('_token')) fd.append('_token', t)
  }

  attachToken(form, token)

  let res = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: buildFormHeaders(token),
    body: form,
  })

  // 419 = CSRF token mismatch — refresh and retry once with a fresh FormData clone
  if (res.status === 419) {
    await refreshCsrfToken()
    token = csrfToken()

    // FormData can only be consumed once; rebuild it from the original entries
    const retryForm = new FormData()
    form.forEach((value, key) => {
      if (key !== '_token') retryForm.append(key, value)
    })
    attachToken(retryForm, token)

    res = await fetch(url, {
      method,
      credentials: 'same-origin',
      headers: buildFormHeaders(token),
      body: retryForm,
    })
  }

  return res
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
