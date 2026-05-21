import AppLayout from '@/layouts/app-layout';
import { Head } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { ToastStack } from '@/components/ui/toast-stack';
import { patchJson } from '@/lib/http';
import { Link } from '@inertiajs/react';
import { useState } from 'react';
import { Palette } from 'lucide-react';

type SettingsData = Record<string, Record<string, string | number | boolean>>;

interface SettingsPageProps {
  settings: SettingsData;
}

export default function SettingsIndex({ settings: initial }: SettingsPageProps) {
  const [settings, setSettings] = useState<SettingsData>(initial);
  const [saving, setSaving] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, title, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };

  const updateField = (group: string, key: string, value: string | number | boolean) => {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...prev[group], [key]: value },
    }));
  };

  const save = async () => {
    setSaving(true);
    const res = await patchJson('/api/admin/settings', { settings });
    setSaving(false);
    if (res.ok) {
      const data = (await res.json()) as { data?: SettingsData };
      if (data.data) setSettings(data.data);
      showToast('Settings saved.');
    } else {
      showToast('Failed to save settings.', 'error');
    }
  };

  const g = settings.general ?? {};
  const c = settings.contact ?? {};
  const commerce = settings.commerce ?? {};
  const notifications = settings.notifications ?? {};
  const social = settings.social ?? {};
  const seo = settings.seo ?? {};

  return (
    <AppLayout>
      <Head title="Settings" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold">Settings</h1>
            <p className="text-muted-foreground text-sm">Configure application-wide options</p>
          </div>
          <Button onClick={save} disabled={saving}>{saving ? 'Saving…' : 'Save all'}</Button>
        </div>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Theme</CardTitle>
              <CardDescription>Dynamic mobile app colors (HEX)</CardDescription>
            </div>
            <Link href="/admin/settings/theme">
              <Button type="button" variant="outline" size="sm">
                <Palette className="mr-2 h-4 w-4" /> Theme settings
              </Button>
            </Link>
          </CardHeader>
        </Card>

        <Card>
          <CardHeader><CardTitle>General</CardTitle><CardDescription>Branding and locale</CardDescription></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="App display name" value={String(g.app_display_name ?? '')} onChange={(e) => updateField('general', 'app_display_name', e.target.value)} />
            <Input placeholder="Tagline" value={String(g.tagline ?? '')} onChange={(e) => updateField('general', 'tagline', e.target.value)} />
            <Input placeholder="Currency" value={String(g.default_currency ?? '')} onChange={(e) => updateField('general', 'default_currency', e.target.value)} />
            <Input placeholder="Timezone" value={String(g.timezone ?? '')} onChange={(e) => updateField('general', 'timezone', e.target.value)} />
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!g.maintenance_mode} onCheckedChange={(v) => updateField('general', 'maintenance_mode', !!v)} /> Maintenance mode</label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Contact</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Support email" value={String(c.support_email ?? '')} onChange={(e) => updateField('contact', 'support_email', e.target.value)} />
            <Input placeholder="Support phone" value={String(c.support_phone ?? '')} onChange={(e) => updateField('contact', 'support_phone', e.target.value)} />
            <Input placeholder="Business address" className="md:col-span-2" value={String(c.business_address ?? '')} onChange={(e) => updateField('contact', 'business_address', e.target.value)} />
            <Input placeholder="Business hours" className="md:col-span-2" value={String(c.business_hours ?? '')} onChange={(e) => updateField('contact', 'business_hours', e.target.value)} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Commerce</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-3">
            <Input type="number" placeholder="Min order amount" value={String(commerce.min_order_amount ?? 0)} onChange={(e) => updateField('commerce', 'min_order_amount', Number(e.target.value))} />
            <Input type="number" placeholder="Free shipping threshold" value={String(commerce.free_shipping_threshold ?? 0)} onChange={(e) => updateField('commerce', 'free_shipping_threshold', Number(e.target.value))} />
            <Input type="number" placeholder="Tax %" value={String(commerce.tax_rate_percent ?? 0)} onChange={(e) => updateField('commerce', 'tax_rate_percent', Number(e.target.value))} />
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!commerce.cod_enabled} onCheckedChange={(v) => updateField('commerce', 'cod_enabled', !!v)} /> COD enabled</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!commerce.card_enabled} onCheckedChange={(v) => updateField('commerce', 'card_enabled', !!v)} /> Card enabled</label>
            <label className="flex items-center gap-2 text-sm"><Checkbox checked={!!commerce.wallet_enabled} onCheckedChange={(v) => updateField('commerce', 'wallet_enabled', !!v)} /> Wallet enabled</label>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Notifications</CardTitle></CardHeader>
          <CardContent className="grid gap-2 md:grid-cols-2">
            {[
              ['email_notifications_enabled', 'Email notifications'],
              ['push_notifications_enabled', 'Push notifications'],
              ['order_status_email', 'Order status emails'],
              ['order_status_push', 'Order status push'],
              ['marketing_email', 'Marketing emails'],
            ].map(([key, label]) => (
              <label key={key} className="flex items-center gap-2 text-sm">
                <Checkbox checked={!!notifications[key]} onCheckedChange={(v) => updateField('notifications', key, !!v)} />
                {label}
              </label>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social & SEO</CardTitle></CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2">
            <Input placeholder="Facebook URL" value={String(social.facebook_url ?? '')} onChange={(e) => updateField('social', 'facebook_url', e.target.value)} />
            <Input placeholder="Instagram URL" value={String(social.instagram_url ?? '')} onChange={(e) => updateField('social', 'instagram_url', e.target.value)} />
            <Input placeholder="Twitter URL" value={String(social.twitter_url ?? '')} onChange={(e) => updateField('social', 'twitter_url', e.target.value)} />
            <Input placeholder="WhatsApp URL" value={String(social.whatsapp_url ?? '')} onChange={(e) => updateField('social', 'whatsapp_url', e.target.value)} />
            <Input placeholder="Meta title" className="md:col-span-2" value={String(seo.meta_title ?? '')} onChange={(e) => updateField('seo', 'meta_title', e.target.value)} />
            <Input placeholder="Meta description" className="md:col-span-2" value={String(seo.meta_description ?? '')} onChange={(e) => updateField('seo', 'meta_description', e.target.value)} />
          </CardContent>
        </Card>
      </div>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </AppLayout>
  );
}
