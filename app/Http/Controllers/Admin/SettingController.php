<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Http\Requests\Admin\UpdateSettingsRequest;
use App\Models\Setting;
use App\Services\Theme\AppThemeService;
use Illuminate\Http\JsonResponse;

class SettingController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:view settings')->only(['index', 'show']);
        $this->middleware('permission:edit settings')->only(['update']);
    }

    public function index(): JsonResponse
    {
        return response()->json([
            'success' => true,
            'data' => Setting::allGrouped(),
        ]);
    }

    public function show(string $group): JsonResponse
    {
        abort_unless(array_key_exists($group, config('settings.defaults', [])), 404);

        return response()->json([
            'success' => true,
            'data' => Setting::getGroup($group),
        ]);
    }

    public function update(UpdateSettingsRequest $request): JsonResponse
    {
        $validated = $request->validated();

        foreach ($validated['settings'] as $group => $values) {
            if ($group === AppThemeService::GROUP) {
                app(AppThemeService::class)->update($values);

                continue;
            }

            Setting::setGroup($group, $values);
        }

        Setting::flushCache();

        return response()->json([
            'success' => true,
            'message' => 'Settings updated successfully',
            'data' => Setting::allGrouped(),
        ]);
    }
}
