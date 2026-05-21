<?php

namespace App\Services\Theme;

use App\Models\Setting;
use Illuminate\Support\Facades\Cache;
use InvalidArgumentException;

class AppThemeService
{
    public const GROUP = 'theme';

    /**
     * @return array<string, string|bool>
     */
    public function rawTheme(): array
    {
        $stored = Setting::getGroup(self::GROUP);
        $colors = [];

        foreach (config('theme.color_keys', []) as $key => $meta) {
            $colors[$key] = $this->normalizeHex(
                (string) ($stored[$key] ?? $meta['default']),
            );
        }

        return array_merge($colors, [
            'dark_mode_enabled' => (bool) ($stored['dark_mode_enabled'] ?? config('theme.future_options.dark_mode_enabled')),
            'font_family' => (string) ($stored['font_family'] ?? config('theme.future_options.font_family') ?? ''),
            'gradient_enabled' => (bool) ($stored['gradient_enabled'] ?? config('theme.future_options.gradient_enabled')),
        ]);
    }

    /**
     * Mobile-optimized payload with versioning for cache busting.
     *
     * @return array{
     *     version: string,
     *     colors: array<string, string>,
     *     options: array<string, bool|string>,
     *     updated_at: string|null
     * }
     */
    public function forMobile(): array
    {
        $raw = $this->rawTheme();
        $colors = [];

        foreach (config('theme.color_keys', []) as $key => $meta) {
            $colors[$meta['api_key']] = $raw[$key];
        }

        $version = $this->versionFromRaw($raw);

        return [
            'version' => $version,
            'colors' => $colors,
            'options' => [
                'darkModeEnabled' => (bool) $raw['dark_mode_enabled'],
                'fontFamily' => $raw['font_family'] ?: null,
                'gradientEnabled' => (bool) $raw['gradient_enabled'],
            ],
            'updated_at' => $this->lastUpdatedAt(),
        ];
    }

    /**
     * @return array{success: bool, message: string, data: array<string, mixed>}
     */
    public function cachedPayload(): array
    {
        return Cache::remember(
            config('theme.cache_key'),
            config('theme.cache_ttl'),
            fn () => $this->forMobile(),
        );
    }

    public function clearCache(): void
    {
        Cache::forget(config('theme.cache_key'));
        Setting::flushCache();
    }

    /**
     * @param  array<string, mixed>  $values
     * @return array<string, mixed>
     */
    public function validateAndNormalize(array $values): array
    {
        $normalized = [];

        foreach (config('theme.color_keys', []) as $key => $meta) {
            if (! array_key_exists($key, $values)) {
                continue;
            }

            $normalized[$key] = $this->normalizeHex((string) $values[$key]);
        }

        if (array_key_exists('dark_mode_enabled', $values)) {
            $normalized['dark_mode_enabled'] = (bool) $values['dark_mode_enabled'];
        }

        if (array_key_exists('font_family', $values)) {
            $normalized['font_family'] = (string) $values['font_family'];
        }

        if (array_key_exists('gradient_enabled', $values)) {
            $normalized['gradient_enabled'] = (bool) $values['gradient_enabled'];
        }

        return $normalized;
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public function update(array $values): array
    {
        $normalized = $this->validateAndNormalize($values);

        if ($normalized === []) {
            throw new InvalidArgumentException('No valid theme values provided.');
        }

        Setting::setGroup(self::GROUP, array_merge(Setting::getGroup(self::GROUP), $normalized));
        $this->clearCache();

        return $this->forMobile();
    }

    public function normalizeHex(string $color): string
    {
        $color = strtoupper(trim($color));

        if ($color === '') {
            throw new InvalidArgumentException('Color value cannot be empty.');
        }

        if (! str_starts_with($color, '#')) {
            $color = '#'.$color;
        }

        if (! preg_match('/^#([A-F0-9]{6}|[A-F0-9]{3})$/', $color)) {
            throw new InvalidArgumentException("Invalid HEX color [{$color}].");
        }

        if (strlen($color) === 4) {
            $color = sprintf(
                '#%s%s%s%s%s%s',
                $color[1],
                $color[1],
                $color[2],
                $color[2],
                $color[3],
                $color[3],
            );
        }

        return $color;
    }

    /**
     * @return list<array{key: string, label: string, api_key: string, value: string}>
     */
    public function adminColorDefinitions(): array
    {
        $raw = $this->rawTheme();

        return collect(config('theme.color_keys', []))
            ->map(fn (array $meta, string $key) => [
                'key' => $key,
                'label' => $meta['label'],
                'api_key' => $meta['api_key'],
                'value' => $raw[$key],
            ])
            ->values()
            ->all();
    }

    /**
     * @param  array<string, mixed>  $raw
     */
    private function versionFromRaw(array $raw): string
    {
        $colorOnly = array_intersect_key($raw, array_flip(array_keys(config('theme.color_keys', []))));

        return hash('xxh128', json_encode($colorOnly));
    }

    private function lastUpdatedAt(): ?string
    {
        $latest = Setting::query()
            ->where('group', self::GROUP)
            ->latest('updated_at')
            ->value('updated_at');

        return $latest?->toISOString();
    }
}
