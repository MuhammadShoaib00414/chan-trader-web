<?php

namespace App\Api;

use App\Models\Article;
use Illuminate\Database\Eloquent\Collection;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;
use Illuminate\Support\Arr;

class ArticleApi
{
    public function listForAdmin(array $filters): LengthAwarePaginator
    {
        $query = Article::query()->with(['subcategory:id,category_id,name', 'subcategory.category:id,name']);

        if (! empty($filters['q'])) {
            $q = (string) $filters['q'];
            $query->where('name', 'like', "%{$q}%");
        }

        if (! empty($filters['subcategory_id'])) {
            $query->where('subcategory_id', (int) $filters['subcategory_id']);
        }

        if (! empty($filters['category_id'])) {
            $query->whereHas('subcategory', function ($subcategoryQuery) use ($filters): void {
                $subcategoryQuery->where('category_id', (int) $filters['category_id']);
            });
        }

        $sortBy = in_array(($filters['sort_by'] ?? null), ['id', 'name', 'slug', 'sort_order', 'is_active', 'created_at'], true)
            ? (string) $filters['sort_by']
            : 'sort_order';
        $sortDir = in_array(($filters['sort_dir'] ?? null), ['asc', 'desc'], true)
            ? (string) $filters['sort_dir']
            : 'asc';

        $query->orderBy($sortBy, $sortDir);
        if ($sortBy !== 'id') {
            $query->orderBy('id', 'asc');
        }

        return $query->paginate(20)->withQueryString();
    }

    /**
     * @return Collection<int, Article>
     */
    public function listForApp(?int $categoryId = null, ?int $subcategoryId = null, ?string $queryText = null, ?int $userId = null): Collection
    {
        $query = Article::query()
            ->where('is_active', true)
            ->with(['subcategory:id,category_id,name,slug', 'subcategory.category:id,name,slug'])
            ->orderByRaw('coalesce(sort_order, 999999) asc')
            ->orderBy('name');

        if ($subcategoryId) {
            $query->where('subcategory_id', $subcategoryId);
        }

        if ($userId) {
            $query->where('user_id', $userId);
        }

        if ($categoryId) {
            $query->whereHas('subcategory', function ($subcategoryQuery) use ($categoryId): void {
                $subcategoryQuery->where('category_id', $categoryId);
            });
        }

        if ($queryText !== null && $queryText !== '') {
            $query->where('name', 'like', "%{$queryText}%");
        }

        return $query->get([
            'id',
            'user_id',
            'subcategory_id',
            'name',
            'slug',
            'sort_order',
            'is_active',
        ]);
    }

    /**
     * @param  array{subcategory_id?:mixed,name?:mixed,slug?:mixed,sort_order?:mixed,is_active?:mixed}  $data
     */
    public function create(array $data): Article
    {
        if (! array_key_exists('sort_order', $data) || $data['sort_order'] === null) {
            $data['sort_order'] = Article::query()
                ->where('subcategory_id', (int) $data['subcategory_id'])
                ->max('sort_order') + 1;
        }

        return Article::create(Arr::only($data, ['subcategory_id', 'name', 'slug', 'sort_order', 'is_active']));
    }

    /**
     * @param  array{subcategory_id?:mixed,name?:mixed,slug?:mixed,sort_order?:mixed,is_active?:mixed}  $data
     */
    public function update(Article $article, array $data): Article
    {
        $article->update(Arr::only($data, ['subcategory_id', 'name', 'slug', 'sort_order', 'is_active']));

        return $article;
    }
}
