<?php

namespace App\Http\Controllers\Admin;

use App\Enums\ContentPageSlug;
use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateContentPageRequest;
use App\Models\ContentPage;
use Illuminate\Http\JsonResponse;

class ContentPageController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:pages.manage');
    }

    public function index(): JsonResponse
    {
        $pages = collect(ContentPageSlug::all())->map(function (ContentPageSlug $slug) {
            $page = ContentPage::findBySlug($slug);

            return [
                'slug' => $slug->value,
                'title' => $page?->title ?? $slug->defaultTitle(),
                'content' => $page?->content,
                'is_published' => $page?->is_published ?? false,
                'meta_title' => $page?->meta_title,
                'meta_description' => $page?->meta_description,
                'updated_at' => $page?->updated_at?->toISOString(),
            ];
        });

        return response()->json(['success' => true, 'data' => $pages]);
    }

    public function show(string $slug): JsonResponse
    {
        $enum = ContentPageSlug::from($slug);
        $page = ContentPage::findBySlug($enum);

        return response()->json([
            'success' => true,
            'data' => [
                'slug' => $enum->value,
                'title' => $page?->title ?? $enum->defaultTitle(),
                'content' => $page?->content,
                'is_published' => $page?->is_published ?? false,
                'meta_title' => $page?->meta_title,
                'meta_description' => $page?->meta_description,
            ],
        ]);
    }

    public function update(UpdateContentPageRequest $request, string $slug): JsonResponse
    {
        $enum = ContentPageSlug::from($slug);
        $validated = $request->validated();

        $page = ContentPage::query()->updateOrCreate(
            ['slug' => $enum->value],
            [
                'title' => $validated['title'],
                'content' => $validated['content'] ?? null,
                'is_published' => $validated['is_published'] ?? true,
                'meta_title' => $validated['meta_title'] ?? null,
                'meta_description' => $validated['meta_description'] ?? null,
            ],
        );

        return response()->json([
            'success' => true,
            'message' => 'Content page updated successfully',
            'data' => $page,
        ]);
    }
}
