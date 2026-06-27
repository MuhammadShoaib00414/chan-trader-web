<?php

namespace App\Support;

use App\Models\Category;
use App\Models\Subcategory;
use App\Models\Store;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\Request;

class VendorCatalogScope
{
    public static function vendorUserId(Request $request): ?int
    {
        $user = $request->user();

        if ($user && $user->hasRole('vendor')) {
            return (int) $user->id;
        }

        return null;
    }

    public static function applyUserScope(Builder $query, Request $request, string $column = 'user_id'): Builder
    {
        if ($vendorId = self::vendorUserId($request)) {
            $query->where($column, $vendorId);
        }

        return $query;
    }

    public static function applyCatalogUserScope(Builder $query, Request $request, string $column = 'user_id'): Builder
    {
        if ($vendorId = self::vendorUserId($request)) {
            $query->where(function (Builder $scoped) use ($vendorId, $column) {
                $scoped->where($column, $vendorId)->orWhereNull($column);
            });
        }

        return $query;
    }

    public static function assignUserId(array $validated, Request $request): array
    {
        if ($vendorId = self::vendorUserId($request)) {
            $validated['user_id'] = $vendorId;
        }

        return $validated;
    }

    public static function authorizeUserOwned(Model $model, Request $request, string $column = 'user_id'): void
    {
        if ($vendorId = self::vendorUserId($request)) {
            if ((int) ($model->{$column} ?? 0) !== $vendorId) {
                abort(403, 'Unauthorized action.');
            }
        }
    }

    public static function authorizeSubcategoryOwned(Request $request, int $subcategoryId): void
    {
        self::authorizeSubcategoryAccessible($request, $subcategoryId);
    }

    public static function authorizeCategoryOwned(Request $request, int $categoryId): void
    {
        self::authorizeCategoryAccessible($request, $categoryId);
    }

    public static function authorizeCategoryAccessible(Request $request, int $categoryId): void
    {
        if ($vendorId = self::vendorUserId($request)) {
            $accessible = Category::query()
                ->whereKey($categoryId)
                ->where(function (Builder $query) use ($vendorId) {
                    $query->where('user_id', $vendorId)->orWhereNull('user_id');
                })
                ->exists();

            if (! $accessible) {
                abort(403, 'Unauthorized action.');
            }
        }
    }

    public static function authorizeSubcategoryAccessible(Request $request, int $subcategoryId): void
    {
        if ($vendorId = self::vendorUserId($request)) {
            $accessible = Subcategory::query()
                ->whereKey($subcategoryId)
                ->where(function (Builder $query) use ($vendorId) {
                    $query->where('user_id', $vendorId)->orWhereNull('user_id');
                })
                ->exists();

            if (! $accessible) {
                abort(403, 'Unauthorized action.');
            }
        }
    }

    /** @return array<int, int> */
    public static function vendorStoreIds(Request $request): array
    {
        if ($vendorId = self::vendorUserId($request)) {
            return Store::query()->where('owner_id', $vendorId)->pluck('id')->all();
        }

        return [];
    }

    public static function authorizeProductOwned(Model $product, Request $request): void
    {
        if ($vendorId = self::vendorUserId($request)) {
            $storeIds = self::vendorStoreIds($request);

            if ($storeIds === [] || ! in_array((int) $product->store_id, $storeIds, true)) {
                abort(403, 'Unauthorized action.');
            }
        }
    }
}
