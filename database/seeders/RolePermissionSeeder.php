<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;

class RolePermissionSeeder extends Seeder
{
    public function run(): void
    {
        app()[\Spatie\Permission\PermissionRegistrar::class]->forgetCachedPermissions();

        $permissions = [
            // Dashboard
            'view-dashboard',

            // Users
            'view-users',
            'create-users',
            'edit-users',
            'delete-users',

            // Roles
            'view-roles',
            'create-roles',
            'edit-roles',
            'delete-roles',

            // Trades
            'view-trades',
            'create-trades',
            'edit-trades',
            'delete-trades',

            // Orders
            'view-orders',
            'create-orders',
            'edit-orders',
            'delete-orders',

            // Reports
            'view-reports',
            'export-reports',

            // Settings
            'manage-settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission, 'guard_name' => 'web']);
        }

        // Super Admin — all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'Super Admin', 'guard_name' => 'web']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin — all except delete roles/users
        $admin = Role::firstOrCreate(['name' => 'Admin', 'guard_name' => 'web']);
        $admin->syncPermissions(
            Permission::whereNotIn('name', ['delete-roles', 'delete-users'])->get()
        );

        // Trader — trades, orders, dashboard, reports
        $trader = Role::firstOrCreate(['name' => 'Trader', 'guard_name' => 'web']);
        $trader->syncPermissions([
            'view-dashboard',
            'view-trades',
            'create-trades',
            'edit-trades',
            'view-orders',
            'create-orders',
            'edit-orders',
            'view-reports',
        ]);

        // Viewer — read only
        $viewer = Role::firstOrCreate(['name' => 'Viewer', 'guard_name' => 'web']);
        $viewer->syncPermissions([
            'view-dashboard',
            'view-trades',
            'view-orders',
            'view-reports',
            'view-users',
        ]);
    }
}
