<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    return Inertia::render('welcome');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        return Inertia::render('dashboard');
    })->name('dashboard');

    // User Management
    Route::get('users', function () {
        $users = \App\Models\User::with('roles')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(fn($role) => ['name' => $role->name]),
                'status' => $user->status,
                'created_at' => $user->created_at->toISOString(),
            ];
        });

        $roles = \Spatie\Permission\Models\Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
        ]);
    })->name('users.index')->middleware('permission:view users');

    // Role Management
    Route::get('roles', function () {
        $roles = \Spatie\Permission\Models\Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->map(fn($perm) => ['name' => $perm->name]),
                'created_at' => $role->created_at->toISOString(),
            ];
        });

        $permissions = \Spatie\Permission\Models\Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
            ];
        });

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    })->name('roles.index')->middleware('permission:view roles');

    // Web-based API routes for Inertia (using session auth)
    Route::prefix('api')->group(function () {
        // User Management
        Route::post('users', [\App\Http\Controllers\Api\UserController::class, 'store'])
            ->middleware('permission:create users');
        Route::put('users/{user}', [\App\Http\Controllers\Api\UserController::class, 'update'])
            ->middleware('permission:edit users');
        Route::delete('users/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy'])
            ->middleware('permission:delete users');

        // Role Management
        Route::post('roles', [\App\Http\Controllers\Api\RoleController::class, 'store'])
            ->middleware('permission:create roles');
        Route::put('roles/{role}', [\App\Http\Controllers\Api\RoleController::class, 'update'])
            ->middleware('permission:edit roles');
        Route::delete('roles/{role}', [\App\Http\Controllers\Api\RoleController::class, 'destroy'])
            ->middleware('permission:delete roles');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
