<?php

namespace App\Http\Controllers\Api\App;

use App\Enums\ContentPageSlug;
use App\Http\Controllers\AppBaseController;
use App\Models\ContentPage;
use Illuminate\Http\JsonResponse;

class ContentPageController extends AppBaseController
{
    /**
     * List published content pages (summary).
     *
     * @group App — Content
     */
    public function index(): JsonResponse
    {
        $pages = collect(ContentPageSlug::all())
            ->map(function (ContentPageSlug $slug) {
                $page = ContentPage::findBySlug($slug);
                if (! $page || ! $page->is_published) {
                    return null;
                }

                return [
                    'slug' => $slug->value,
                    'title' => $page->title,
                ];
            })
            ->filter()
            ->values();

        return $this->successResponse($pages);
    }

    /**
     * Show a published content page by slug.
     *
     * @group App — Content
     */
    public function show(string $slug): JsonResponse
    {
        $enum = ContentPageSlug::from($slug);
        $page = ContentPage::findBySlug($enum);

        if (! $page || ! $page->is_published) {
            return $this->errorResponse('Content page not found', 404);
        }

        return $this->successResponse([
            'slug' => $page->slug,
            'title' => $page->title,
            'content' => $page->content,
            'meta_title' => $page->meta_title,
            'meta_description' => $page->meta_description,
            'updated_at' => $page->updated_at?->toISOString(),
        ]);
    }
}
