<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RoleController extends Controller
{
    /**
     * Display a listing of roles.
     */
    public function index(): JsonResponse
    {
        $this->authorize('viewAny', Role::class);

        $roles = Role::with('permissions')->get();

        return response()->json([
            'success' => true,
            'data' => $roles,
        ]);
    }

    /**
     * Store a newly created role.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', Role::class);

        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name',
            'permissions' => 'array',
        ]);

        $role = Role::create(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $expanded = $this->expandPermissionAliases($validated['permissions']);
            $final = Permission::whereIn('name', $expanded)->pluck('name')->all();
            $role->givePermissionTo($final);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role created successfully',
            'data' => $role->load('permissions'),
        ], 201);
    }

    /**
     * Display the specified role.
     */
    public function show(Role $role): JsonResponse
    {
        $this->authorize('view', $role);

        return response()->json([
            'success' => true,
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * Update the specified role.
     */
    public function update(Request $request, Role $role): JsonResponse
    {
        $this->authorize('update', $role);

        $validated = $request->validate([
            'name' => 'required|string|unique:roles,name,'.$role->id,
            'permissions' => 'array',
        ]);

        $role->update(['name' => $validated['name']]);

        if (isset($validated['permissions'])) {
            $expanded = $this->expandPermissionAliases($validated['permissions']);
            $final = Permission::whereIn('name', $expanded)->pluck('name')->all();
            $role->syncPermissions($final);
        }

        return response()->json([
            'success' => true,
            'message' => 'Role updated successfully',
            'data' => $role->load('permissions'),
        ]);
    }

    /**
     * Remove the specified role.
     */
    public function destroy(Role $role): JsonResponse
    {
        $this->authorize('delete', $role);

        $role->delete();

        return response()->json([
            'success' => true,
            'message' => 'Role deleted successfully',
        ]);
    }

    /**
     * Get all available permissions.
     */
    public function permissions(): JsonResponse
    {
        $permissions = Permission::all();

        return response()->json([
            'success' => true,
            'data' => $permissions,
        ]);
    }

    /**
     * Expand UI-space permissions into internal dotted permissions used in middleware.
     *
     * @param array<string> $names
     * @return array<string>
     */
    protected function expandPermissionAliases(array $names): array
    {
        $aliasMap = [
            // Stores
            'view stores' => ['stores.view'],
            'create stores' => ['stores.manage_staff'],
            'edit stores' => ['stores.manage_staff'],
            'delete stores' => ['stores.manage_staff'],
            'approve stores' => ['stores.approve'],
            'suspend stores' => ['stores.suspend'],
            // Categories
            'view categories' => ['categories.manage'],
            'create categories' => ['categories.manage'],
            'edit categories' => ['categories.manage'],
            'delete categories' => ['categories.manage'],
            // Brands
            'view brands' => ['brands.manage'],
            'create brands' => ['brands.manage'],
            'edit brands' => ['brands.manage'],
            'delete brands' => ['brands.manage'],
            // Products
            'view products' => ['products.view'],
            'create products' => ['products.create'],
            'edit products' => ['products.update', 'products.publish'],
            'delete products' => ['products.delete'],
            // Orders
            'view orders' => ['orders.view'],
            'create orders' => ['orders.view'],
            'edit orders' => ['orders.update'],
            'delete orders' => ['orders.refund'],
            // Shipments
            'view shipments' => ['shipments.view'],
            'create shipments' => ['shipments.update'],
            'edit shipments' => ['shipments.update'],
            'delete shipments' => ['shipments.update'],
            // Payments
            'view payments' => ['payments.view'],
            'create payments' => ['payments.capture'],
            'edit payments' => ['payments.capture'],
            'delete payments' => ['payments.capture'],
            // Settings
            'view settings' => ['view settings'],
            'edit settings' => ['edit settings'],
            // Users
            'view users' => ['view users'],
            'create users' => ['create users'],
            'edit users' => ['edit users'],
            'delete users' => ['delete users'],
            // Roles
            'view roles' => ['view roles'],
            'create roles' => ['create roles'],
            'edit roles' => ['edit roles'],
            'delete roles' => ['delete roles'],
            // Permissions
            'view permissions' => ['view permissions'],
        ];

        $expanded = [];
        foreach ($names as $n) {
            $expanded[] = $n;
            foreach ($aliasMap[$n] ?? [] as $alias) {
                $expanded[] = $alias;
            }
        }
        return array_values(array_unique($expanded));
    }
}
