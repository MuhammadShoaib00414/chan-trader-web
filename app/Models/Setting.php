<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;

class Setting extends Model
{
    protected $fillable = [
        'group',
        'key',
        'value',
    ];

    protected function casts(): array
    {
        return [
            'value' => 'array',
        ];
    }

    public static function getGroup(string $group): array
    {
        $defaults = config("settings.defaults.{$group}", []);

        $stored = Cache::remember("settings.group.{$group}", 3600, function () use ($group) {
            return static::query()
                ->where('group', $group)
                ->get()
                ->mapWithKeys(fn (Setting $setting) => [$setting->key => $setting->value])
                ->all();
        });

        return array_merge($defaults, $stored);
    }

    /**
     * @param  array<string, mixed>  $values
     */
    public static function setGroup(string $group, array $values): void
    {
        foreach ($values as $key => $value) {
            static::query()->updateOrCreate(
                ['group' => $group, 'key' => $key],
                ['value' => $value],
            );
        }

        Cache::forget("settings.group.{$group}");
        Cache::forget('settings.all');
    }

    /**
     * @return array<string, array<string, mixed>>
     */
    public static function allGrouped(): array
    {
        return Cache::remember('settings.all', 3600, function () {
            $groups = array_keys(config('settings.defaults', []));
            $result = [];

            foreach ($groups as $group) {
                $result[$group] = static::getGroup($group);
            }

            return $result;
        });
    }

    public static function flushCache(): void
    {
        foreach (array_keys(config('settings.defaults', [])) as $group) {
            Cache::forget("settings.group.{$group}");
        }
        Cache::forget('settings.all');
    }
}
