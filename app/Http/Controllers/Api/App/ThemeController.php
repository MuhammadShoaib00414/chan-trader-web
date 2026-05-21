<?php

namespace App\Http\Controllers\Api\App;

use App\Http\Controllers\AppBaseController;
use App\Services\Theme\AppThemeService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class ThemeController extends AppBaseController
{
    /**
     * Fetch dynamic app theme colors for mobile clients.
     *
     * @group App — Theme
     *
     * Public endpoint. Call on app launch or pull-to-refresh.
     * Use the `version` field to detect when cached theme data should be refreshed.
     */
    public function show(Request $request, AppThemeService $theme): JsonResponse|Response
    {
        $payload = $theme->cachedPayload();
        $etag = '"'.$payload['version'].'"';

        if ($request->header('If-None-Match') === $etag) {
            return response()->noContent(304)
                ->header('ETag', $etag)
                ->header('Cache-Control', 'public, max-age='.config('theme.cache_ttl'));
        }

        return $this->successResponse($payload, 'App theme retrieved')
            ->header('ETag', $etag)
            ->header('Cache-Control', 'public, max-age='.config('theme.cache_ttl'));
    }
}
