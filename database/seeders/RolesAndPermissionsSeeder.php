<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Spatie\Permission\Models\Permission;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class RolesAndPermissionsSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Reset cached roles and permissions
        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        // Create permissions
        $permissions = [
            // User management
            'view users',
            'create users',
            'edit users',
            'delete users',

            // Role management
            'view roles',
            'create roles',
            'edit roles',
            'delete roles',

            // Permission management
            'view permissions',
            'assign permissions',

            // Content management (example)
            'view content',
            'create content',
            'edit content',
            'delete content',
            'publish content',

            // Settings
            'view settings',
            'edit settings',
        ];

        foreach ($permissions as $permission) {
            Permission::firstOrCreate(['name' => $permission]);
        }

        // Create roles and assign permissions

        // Super Admin - has all permissions
        $superAdmin = Role::firstOrCreate(['name' => 'super-admin']);
        $superAdmin->syncPermissions(Permission::all());

        // Admin - has most permissions except critical ones
        $admin = Role::firstOrCreate(['name' => 'admin']);
        $admin->syncPermissions([
            'view users',
            'create users',
            'edit users',
            'view roles',
            'view permissions',
            'view content',
            'create content',
            'edit content',
            'delete content',
            'publish content',
            'view settings',
        ]);

        // Editor - can manage content
        $editor = Role::firstOrCreate(['name' => 'editor']);
        $editor->syncPermissions([
            'view content',
            'create content',
            'edit content',
            'publish content',
        ]);

        // User - basic permissions
        $user = Role::firstOrCreate(['name' => 'user']);
        $user->syncPermissions([
            'view content',
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
