<?php

namespace App\Enums;

enum FcmPlatform: string
{
    case Mobile = 'mobile';
    case Web = 'web';

    /**
     * @return list<string>
     */
    public static function values(): array
    {
        return array_map(fn (self $p) => $p->value, self::cases());
    }
}
