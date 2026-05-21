<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateThemeSettingsRequest;
use App\Services\Theme\AppThemeService;
use Illuminate\Http\JsonResponse;

class ThemeSettingsController extends Controller
{
    public function __construct(
        private AppThemeService $theme,
    ) {
        $this->middleware('permission:view settings')->only(['show', 'preview']);
        $this->middleware('permission:edit settings')->only(['update']);
    }

    public function show(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => [
                'colors' => $this->theme->adminColorDefinitions(),
                'options' => $this->theme->rawTheme(),
                'mobile' => $this->theme->forMobile(),
            ],
        ]);
    }

    /**
     * Preview theme without persisting (validates HEX format).
     */
    public function preview(UpdateThemeSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $normalized = $this->theme->validateAndNormalize($validated['colors']);

        $previewRaw = array_merge($this->theme->rawTheme(), $normalized);

        if (isset($validated['options'])) {
            $previewRaw = array_merge($previewRaw, $validated['options']);
        }

        $colors = [];
        foreach (config('theme.color_keys', []) as $key => $meta) {
            $colors[$meta['api_key']] = $previewRaw[$key];
        }

        return response()->json([
            'success' => true,
            'data' => [
                'version' => hash('xxh128', json_encode($normalized)),
                'colors' => $colors,
                'options' => [
                    'darkModeEnabled' => (bool) ($previewRaw['dark_mode_enabled'] ?? false),
                    'fontFamily' => $previewRaw['font_family'] ?: null,
                    'gradientEnabled' => (bool) ($previewRaw['gradient_enabled'] ?? false),
                ],
            ],
        ]);
    }

    public function update(UpdateThemeSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $values = $validated['colors'];
        if (isset($validated['options'])) {
            $values = array_merge($values, $validated['options']);
        }

        $mobile = $this->theme->update($values);

        return response()->json([
            'success' => true,
            'message' => 'Theme settings saved successfully',
            'data' => [
                'colors' => $this->theme->adminColorDefinitions(),
                'mobile' => $mobile,
            ],
        ]);
    }
}
