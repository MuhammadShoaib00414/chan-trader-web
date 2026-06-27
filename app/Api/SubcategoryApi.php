<?php

namespace App\Api;

use App\Models\Subcategory;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Arr;

class SubcategoryApi
{
    public function listForAdmin(array $filters, ?int $vendorUserId = null): LengthAwarePaginator
    {
        $query = Subcategory::query()->with('category:id,name');

        if ($vendorUserId) {
            $query->where('user_id', $vendorUserId);
        }

        if (! empty($filters['q'])) {
            $q = (string) $filters['q'];
            $query->where('name', 'like', "%{$q}%");
        }

        if (! empty($filters['category_id'])) {
            $query->where('category_id', (int) $filters['category_id']);
        }

        $sortBy = in_array(($filters['sort_by'] ?? null), ['id', 'name', 'slug', 'sort_order', 'is_active', 'created_at'], true)
            ? (string) $filters['sort_by']
            : 'sort_order';
        $sortDir = in_array(($filters['sort_dir'] ?? null), ['asc', 'desc'], true) ? (string) $filters['sort_dir'] : 'asc';

        $query->orderBy($sortBy, $sortDir);
        if ($sortBy !== 'id') {
            $query->orderBy('id', 'asc');
        }

        return $query->paginate(20)->withQueryString();
    }

    public function listForApp(?int $categoryId = null, ?int $userId = null): Collection
    {
        $query = Subcategory::query()
            ->where('is_active', true)
            ->orderByRaw('coalesce(sort_order, 999999) asc')
            ->orderBy('name');

        if ($categoryId) {
            $query->where('category_id', $categoryId);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        return $query->get(['id', 'user_id', 'category_id', 'name', 'slug', 'image', 'sort_order', 'is_active']);
    }

    public function create(array $data): Subcategory
    {
        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $data['image'] = $data['image']->store('subcategory-images', 'public');
        }

        if (! array_key_exists('sort_order', $data) || $data['sort_order'] === null) {
            $data['sort_order'] = (Subcategory::max('sort_order') ?? 0) + 1;
        }

        return Subcategory::create(Arr::only($data, ['user_id', 'category_id', 'name', 'slug', 'image', 'sort_order', 'is_active']));
    }

    public function update(Subcategory $subcategory, array $data): Subcategory
    {
        if (isset($data['image']) && $data['image'] instanceof UploadedFile) {
            $data['image'] = $data['image']->store('subcategory-images', 'public');
        }

        $subcategory->update(Arr::only($data, ['user_id', 'category_id', 'name', 'slug', 'image', 'sort_order', 'is_active']));

        return $subcategory;
    }
}
