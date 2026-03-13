<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\UserResource;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rule;

class UserController extends AppBaseController
{
    /**
     * Get authenticated user
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'user' => new UserResource($request->user()->load('roles.permissions')),
        ], 'User profile retrieved successfully');
    }

    /**
     * Display a listing of users.
     */
    public function index(Request $request): JsonResponse
    {
        $this->authorize('viewAny', User::class);

        $perPage = $request->input('per_page', 15);
        $search = $request->input('search');

        $users = User::with('roles.permissions')
            ->when($search, function ($query, $search) {
                $query->where(function ($q) use ($search) {
                    $q->where('first_name', 'like', "%{$search}%")
                        ->orWhere('last_name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->latest()
            ->paginate($perPage);

        return $this->successResponse([
            'users' => UserResource::collection($users->items()),
            'pagination' => [
                'total' => $users->total(),
                'per_page' => $users->perPage(),
                'current_page' => $users->currentPage(),
                'last_page' => $users->lastPage(),
            ],
        ], 'Users retrieved successfully');
    }

    /**
     * Store a newly created user.
     */
    public function store(Request $request): JsonResponse
    {
        $this->authorize('create', User::class);

        $validated = $request->validate([
            'first_name' => 'required|string|max:255',
            'last_name' => 'required|string|max:255',
            'email' => 'required|email|unique:users,email',
            'password' => 'required|string|min:8|confirmed',
            'role' => 'nullable|string|exists:roles,name',
            'roles' => 'array',
            'roles.*' => 'exists:roles,name',
            'status' => 'boolean',
        ]);

        $user = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'] ?? User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);

        $roleName = $validated['role']
            ?? (isset($validated['roles']) && is_array($validated['roles']) ? ($validated['roles'][0] ?? null) : null);
        if ($roleName) {
            $user->assignRole($roleName);
        }

        return $this->successResponse([
            'user' => new UserResource($user->load('roles.permissions')),
        ], 'User created successfully', 201);
    }

    /**
     * Display the specified user.
     */
    public function show(User $user): JsonResponse
    {
        $this->authorize('view', $user);

        return $this->successResponse([
            'user' => new UserResource($user->load('roles.permissions')),
        ], 'User retrieved successfully');
    }

    /**
     * Update the specified user.
     */
    public function update(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'first_name' => 'sometimes|string|max:255',
            'last_name' => 'sometimes|string|max:255',
            'email' => ['sometimes', 'email', Rule::unique('users')->ignore($user->id)],
            'password' => 'sometimes|string|min:8|confirmed',
            'role' => 'nullable|string|exists:roles,name',
            'roles' => 'sometimes|array',
            'roles.*' => 'exists:roles,name',
            'status' => 'sometimes|boolean',
        ]);

        if (isset($validated['password'])) {
            $validated['password'] = Hash::make($validated['password']);
        }

        $user->update(collect($validated)->except('roles')->toArray());

        if (isset($validated['role']) || isset($validated['roles'])) {
            $roleName = $validated['role']
                ?? (isset($validated['roles']) && is_array($validated['roles']) ? ($validated['roles'][0] ?? null) : null);
            if ($roleName) {
                $user->syncRoles([$roleName]);
            }
        }

        return $this->successResponse([
            'user' => new UserResource($user->fresh()->load('roles.permissions')),
        ], 'User updated successfully');
    }

    /**
     * Remove the specified user.
     */
    public function destroy(User $user): JsonResponse
    {
        $this->authorize('delete', $user);

        $user->delete();

        return $this->successResponse([], 'User deleted successfully');
    }

    /**
     * Assign roles to user.
     */
    public function assignRoles(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'roles' => 'required|array|min:1',
            'roles.*' => 'exists:roles,name',
        ]);

        $single = array_values($validated['roles'])[0];
        $user->syncRoles([$single]);

        return $this->successResponse([
            'user' => new UserResource($user->fresh()->load('roles.permissions')),
        ], 'Roles assigned successfully');
    }

    /**
     * Assign permissions directly to user.
     */
    public function assignPermissions(Request $request, User $user): JsonResponse
    {
        $this->authorize('update', $user);

        $validated = $request->validate([
            'permissions' => 'required|array',
            'permissions.*' => 'exists:permissions,name',
        ]);

        $user->syncPermissions($validated['permissions']);

        return $this->successResponse([
            'user' => new UserResource($user->fresh()->load('roles.permissions')),
        ], 'Permissions assigned successfully');
    }
}
