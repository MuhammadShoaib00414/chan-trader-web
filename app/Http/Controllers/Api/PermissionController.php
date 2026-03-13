<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;

class PermissionController extends Controller
{
    /**
     * Display a listing of permissions.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', Permission::class);

        $perPage = $request->input('per_page', 50);
        $search = $request->input('search');

        $permissions = Permission::query()
            ->when($search, function ($query, $search) {
                $query->where('name', 'like', "%{$search}%");
            })
            ->orderBy('name')
            ->paginate($perPage);

        return response()->json([
            'success' => true,
            'data' => [
                'permissions' => $permissions->items(),
                'pagination' => [
                    'total' => $permissions->total(),
                    'per_page' => $permissions->perPage(),
                    'current_page' => $permissions->currentPage(),
                    'last_page' => $permissions->lastPage(),
                ],
            ],
            'message' => 'Permissions retrieved successfully',
        ]);
    }

    /**
     * Display the specified permission.
     */
    public function show(Permission $permission): JsonResponse
    {
        $this->authorize('view', $permission);

        return response()->json([
            'success' => true,
            'data' => ['permission' => $permission->load('roles')],
            'message' => 'Permission retrieved successfully',
        ]);
    }

    /**
     * Get all permissions grouped by category.
     */
    public function grouped(): JsonResponse
    {
        $this->authorize('viewAny', Permission::class);

        $permissions = Permission::all();

        $grouped = $permissions->groupBy(function ($permission) {
            // Group by first word (e.g., "view users" -> "users")
            $parts = explode(' ', $permission->name);

            return count($parts) > 1 ? $parts[1] : 'other';
        });

        return response()->json([
            'success' => true,
            'data' => ['permissions' => $grouped],
            'message' => 'Grouped permissions retrieved successfully',
        ]);
    }
}
