import { CheckCircle2, XCircle, X } from 'lucide-react'

export type ToastVariant = 'success' | 'error'

export type ToastItem = {
  id: number
  title: string
  variant: ToastVariant
}

export function ToastStack({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[]
  onDismiss: (id: number) => void
}) {
  if (!toasts.length) return null

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-50 flex w-[360px] max-w-[calc(100vw-2rem)] flex-col gap-3">
      {toasts.map((t) => (
        <div key={t.id} className="pointer-events-auto">
          <div
            className={[
              'relative overflow-hidden rounded-xl border shadow-lg',
              'bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60',
              'transition',
              t.variant === 'success' ? 'border-emerald-200/70' : 'border-rose-200/70',
            ].join(' ')}
            role="status"
            aria-live="polite"
          >
            <div className="flex items-start gap-3 px-4 py-3">
              <div className="mt-0.5">
                {t.variant === 'success' ? (
                  <CheckCircle2 className="size-5 text-emerald-600" />
                ) : (
                  <XCircle className="size-5 text-rose-600" />
                )}
              </div>

              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-medium text-foreground">{t.title}</div>
              </div>

              <button
                type="button"
                onClick={() => onDismiss(t.id)}
                className="rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                aria-label="Dismiss notification"
              >
                <X className="size-4" />
              </button>
            </div>

            <div
              className={[
                'h-1 w-full',
                t.variant === 'success' ? 'bg-emerald-100' : 'bg-rose-100',
              ].join(' ')}
            >
              <div
                className={[
                  'h-full',
                  t.variant === 'success' ? 'bg-emerald-500/70' : 'bg-rose-500/70',
                  'origin-left animate-[toast-progress_2500ms_linear_forwards]',
                ].join(' ')}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}

