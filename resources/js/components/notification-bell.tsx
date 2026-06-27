import { Button } from '@/components/ui/button'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { registerFcm } from '@/lib/firebase'
import { requestJson } from '@/lib/http'
import { router } from '@inertiajs/react'
import { Bell } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'

type NotificationItem = {
    id: number
    type: string
    title: string
    body: string
    data?: Record<string, string | number | null> | null
    read_at: string | null
    created_at: string | null
}

const POLL_INTERVAL_MS = 30_000

function targetLink(item: NotificationItem): string | null {
    const data = item.data ?? {}
    if (data.link) return String(data.link)
    if (data.order_id) return `/admin/orders/${data.order_id}`
    return null
}

export function NotificationBell() {
    const [items, setItems] = useState<NotificationItem[]>([])
    const [unread, setUnread] = useState(0)
    const [open, setOpen] = useState(false)

    const load = useCallback(async () => {
        try {
            const res = await fetch('/api/admin/notifications?per_page=10', {
                credentials: 'same-origin',
                headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
            })
            if (!res.ok) return
            const json = await res.json()
            setItems(json?.data?.items ?? [])
            setUnread(json?.data?.unread_count ?? 0)
        } catch {
            /* network hiccup — keep last known state */
        }
    }, [])

    useEffect(() => {
        void registerFcm()
        void load()

        const interval = window.setInterval(() => void load(), POLL_INTERVAL_MS)
        const onFcm = () => void load()
        window.addEventListener('fcm-message', onFcm)

        return () => {
            window.clearInterval(interval)
            window.removeEventListener('fcm-message', onFcm)
        }
    }, [load])

    const markAllRead = async () => {
        await requestJson('POST', '/api/admin/notifications/read-all')
        await load()
    }

    const openItem = async (item: NotificationItem) => {
        if (!item.read_at) {
            await requestJson('POST', `/api/admin/notifications/${item.id}/read`)
        }
        setOpen(false)
        const link = targetLink(item)
        await load()
        if (link) router.visit(link)
    }

    return (
        <DropdownMenu open={open} onOpenChange={setOpen}>
            <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="relative h-9 w-9" aria-label="Notifications">
                    <Bell className="!size-5 opacity-80" />
                    {unread > 0 && (
                        <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#FF3A3D] px-1 text-[10px] font-bold leading-none text-white">
                            {unread > 99 ? '99+' : unread}
                        </span>
                    )}
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-80 p-0">
                <div className="flex items-center justify-between border-b px-3 py-2">
                    <span className="text-sm font-semibold">Notifications</span>
                    {unread > 0 && (
                        <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline">
                            Mark all read
                        </button>
                    )}
                </div>
                <div className="max-h-96 overflow-y-auto">
                    {items.length === 0 ? (
                        <p className="px-3 py-6 text-center text-sm text-muted-foreground">No notifications yet.</p>
                    ) : (
                        items.map((item) => (
                            <button
                                key={item.id}
                                onClick={() => openItem(item)}
                                className={`flex w-full flex-col items-start gap-0.5 border-b px-3 py-2 text-left hover:bg-accent ${
                                    item.read_at ? 'opacity-60' : ''
                                }`}
                            >
                                <span className="flex w-full items-center justify-between">
                                    <span className="text-sm font-medium">{item.title}</span>
                                    {!item.read_at && <span className="h-2 w-2 rounded-full bg-[#FF3A3D]" />}
                                </span>
                                <span className="text-xs text-muted-foreground">{item.body}</span>
                            </button>
                        ))
                    )}
                </div>
            </DropdownMenuContent>
        </DropdownMenu>
    )
}
