<?php

namespace App\Support;

use Illuminate\Database\Eloquent\Builder;

class ProductVisibility
{
    public const WEBSITE_ONLY = 'website_only';

    public const MOBILE_APP_ONLY = 'mobile_app_only';

    public const WEBSITE_AND_MOBILE = 'website_and_mobile';

    public const HIDDEN = 'hidden';

    public const DEFAULT = self::WEBSITE_AND_MOBILE;

    /** @return array<int, string> */
    public static function values(): array
    {
        return [
            self::WEBSITE_ONLY,
            self::MOBILE_APP_ONLY,
            self::WEBSITE_AND_MOBILE,
            self::HIDDEN,
        ];
    }

    /** @return array<int, string> */
    public static function validationRule(): array
    {
        return ['nullable', 'string', 'in:'.implode(',', self::values())];
    }

    public static function applyPlatformFilter(Builder $query, string $platform): Builder
    {
        $query->where('visibility', '!=', self::HIDDEN);

        if ($platform === 'website') {
            return $query->whereIn('visibility', [self::WEBSITE_ONLY, self::WEBSITE_AND_MOBILE]);
        }

        return $query->whereIn('visibility', [self::MOBILE_APP_ONLY, self::WEBSITE_AND_MOBILE]);
    }
}
