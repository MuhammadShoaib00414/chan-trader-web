import AppLayout from '@/layouts/app-layout';
import { Head, Link } from '@inertiajs/react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { ToastStack } from '@/components/ui/toast-stack';
import { patchJson, postJson } from '@/lib/http';
import { useMemo, useState } from 'react';
import { Palette } from 'lucide-react';

type ColorDefinition = {
  key: string;
  label: string;
  api_key: string;
  value: string;
};

type ThemeOptions = {
  dark_mode_enabled: boolean;
  font_family: string;
  gradient_enabled: boolean;
};

type MobileTheme = {
  version: string;
  colors: Record<string, string>;
  options: {
    darkModeEnabled: boolean;
    fontFamily: string | null;
    gradientEnabled: boolean;
  };
};

interface ThemePageProps {
  colorDefinitions: ColorDefinition[];
  options: ThemeOptions;
  mobilePreview: MobileTheme;
}

export default function ThemeSettingsIndex({ colorDefinitions, options, mobilePreview }: ThemePageProps) {
  const [colors, setColors] = useState<Record<string, string>>(
    Object.fromEntries(colorDefinitions.map((c) => [c.key, c.value])),
  );
  const [themeOptions, setThemeOptions] = useState(options);
  const [preview, setPreview] = useState<MobileTheme>(mobilePreview);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const [toasts, setToasts] = useState<Array<{ id: number; title: string; variant: 'success' | 'error' }>>([]);

  const showToast = (title: string, variant: 'success' | 'error' = 'success') => {
    const id = Date.now();
    setToasts((t) => [...t, { id, title, variant }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 2500);
  };

  const previewColors = preview.colors;

  const colorFields = useMemo(
    () =>
      colorDefinitions.map((def) => ({
        ...def,
        value: colors[def.key] ?? def.value,
      })),
    [colorDefinitions, colors],
  );

  const buildPayload = () => ({
    colors,
    options: {
      dark_mode_enabled: themeOptions.dark_mode_enabled,
      font_family: themeOptions.font_family,
      gradient_enabled: themeOptions.gradient_enabled,
    },
  });

  const runPreview = async () => {
    setPreviewing(true);
    const res = await postJson('/api/admin/settings/theme/preview', buildPayload());
    setPreviewing(false);
    if (res.ok) {
      const data = (await res.json()) as { data: MobileTheme };
      setPreview(data.data);
      showToast('Preview updated.');
    } else {
      showToast('Preview failed. Check HEX values.', 'error');
    }
  };

  const save = async () => {
    setSaving(true);
    const res = await patchJson('/api/admin/settings/theme', buildPayload());
    setSaving(false);
    if (res.ok) {
      const data = (await res.json()) as { data: { mobile: MobileTheme } };
      if (data.data?.mobile) setPreview(data.data.mobile);
      showToast('Theme saved.');
    } else {
      showToast('Failed to save theme.', 'error');
    }
  };

  const updateColor = (key: string, value: string) => {
    let hex = value.toUpperCase();
    if (hex && !hex.startsWith('#')) hex = `#${hex}`;
    setColors((prev) => ({ ...prev, [key]: hex }));
  };

  return (
    <AppLayout>
      <Head title="Theme Settings" />
      <div className="flex flex-col gap-4 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="flex items-center gap-2 text-2xl font-semibold">
              <Palette className="h-6 w-6" /> Theme Settings
            </h1>
            <p className="text-muted-foreground text-sm">
              Manage mobile app colors dynamically.{' '}
              <Link href="/admin/settings" className="text-primary underline">
                Back to settings
              </Link>
            </p>
          </div>
          <div className="flex gap-2">
            <Button type="button" variant="outline" onClick={runPreview} disabled={previewing}>
              {previewing ? 'Previewing…' : 'Preview'}
            </Button>
            <Button type="button" onClick={save} disabled={saving}>
              {saving ? 'Saving…' : 'Save theme'}
            </Button>
          </div>
        </div>

        <div className="grid gap-4 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>App colors</CardTitle>
              <CardDescription>All values stored in HEX format (#RRGGBB)</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4">
              {colorFields.map((field) => (
                <div key={field.key} className="grid gap-2 sm:grid-cols-[1fr_auto] sm:items-center">
                  <label className="text-sm font-medium">{field.label}</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={field.value}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="h-10 w-14 cursor-pointer rounded border"
                      aria-label={`${field.label} picker`}
                    />
                    <Input
                      value={field.value}
                      onChange={(e) => updateColor(field.key, e.target.value)}
                      className="font-mono uppercase"
                      maxLength={7}
                    />
                  </div>
                </div>
              ))}

              <div className="border-t pt-4">
                <p className="mb-3 text-sm font-medium text-muted-foreground">Future options (stored for mobile)</p>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={themeOptions.dark_mode_enabled}
                    onCheckedChange={(v) => setThemeOptions((o) => ({ ...o, dark_mode_enabled: !!v }))}
                  />
                  Dark mode (future)
                </label>
                <label className="mb-2 flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={themeOptions.gradient_enabled}
                    onCheckedChange={(v) => setThemeOptions((o) => ({ ...o, gradient_enabled: !!v }))}
                  />
                  Gradients (future)
                </label>
                <Input
                  placeholder="Font family (future)"
                  value={themeOptions.font_family}
                  onChange={(e) => setThemeOptions((o) => ({ ...o, font_family: e.target.value }))}
                />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Live preview</CardTitle>
              <CardDescription>Version: {preview.version.slice(0, 12)}…</CardDescription>
            </CardHeader>
            <CardContent>
              <div
                className="overflow-hidden rounded-xl border shadow-sm"
                style={{ backgroundColor: previewColors.background, color: previewColors.text }}
              >
                <div
                  className="flex items-center justify-between px-4 py-3 text-sm font-medium"
                  style={{ backgroundColor: previewColors.headerFooter }}
                >
                  <span>TraderApp</span>
                  <span style={{ color: previewColors.secondary }}>Menu</span>
                </div>
                <div className="space-y-4 p-4">
                  <p className="text-sm" style={{ color: previewColors.secondary }}>
                    Welcome back — browse products below.
                  </p>
                  <button
                    type="button"
                    className="w-full rounded-lg px-4 py-2 text-sm font-semibold text-white"
                    style={{ backgroundColor: previewColors.button }}
                  >
                    Shop now
                  </button>
                  <p className="text-sm" style={{ color: previewColors.success }}>
                    Order placed successfully
                  </p>
                  <p className="text-sm" style={{ color: previewColors.error }}>
                    Payment failed — try again
                  </p>
                  <div
                    className="rounded-lg border px-3 py-2 text-xs"
                    style={{ borderColor: previewColors.primary, color: previewColors.primary }}
                  >
                    Primary accent card
                  </div>
                </div>
                <div
                  className="px-4 py-2 text-center text-xs"
                  style={{ backgroundColor: previewColors.statusBar, color: previewColors.text }}
                >
                  Status bar area
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <ToastStack toasts={toasts} onDismiss={(id) => setToasts((t) => t.filter((x) => x.id !== id))} />
    </AppLayout>
  );
}
