export function csrfToken(): string {
  const el = document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement | null
  return el?.content ?? ''
}

export function requestJson(method: string, url: string, data?: unknown) {
  return fetch(url, {
    method,
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      'X-CSRF-TOKEN': csrfToken(),
    },
    body: data ? JSON.stringify(data) : undefined,
  })
}

export const postJson = (url: string, data?: unknown) => requestJson('POST', url, data)
export const patchJson = (url: string, data?: unknown) => requestJson('PATCH', url, data)
export const delJson = (url: string, data?: unknown) => requestJson('DELETE', url, data)
