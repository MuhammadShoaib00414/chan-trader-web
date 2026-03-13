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

        // Create permissions (named per module, e.g. products.*, brands.*, categories.*)
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

            // Dashboard
            'view dashboard',

            // Catalog & store modules
            'stores.view',
            'stores.approve',
            'stores.suspend',
            'stores.manage_staff',
            'categories.manage',
            'brands.manage',
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'products.publish',
            'promotions.manage',

            // Orders & operations
            'orders.view',
            'orders.update',
            'orders.refund',
            'payments.view',
            'payments.capture',
            'shipments.view',
            'shipments.update',

            // Content / marketing modules
            'reviews.moderate',
            'coupons.manage',
            'banners.manage',
            'pages.manage',

            // Settings
            'view settings',
            'edit settings',
        ];

        // UI-friendly space-named permissions per module (to show modules in dialog)
        $uiPermissions = [
            // Dashboard
            'view dashboard',
            // Vendors
            'view vendors', 'create vendors', 'edit vendors', 'delete vendors',
            // Users
            'view users', 'create users', 'edit users', 'delete users',
            // Roles
            'view roles', 'create roles', 'edit roles', 'delete roles',
            // Permissions
            'view permissions',
            // Stores
            'view stores', 'create stores', 'edit stores', 'delete stores', 'approve stores', 'suspend stores',
            // Categories
            'view categories', 'create categories', 'edit categories', 'delete categories',
            // Brands
            'view brands', 'create brands', 'edit brands', 'delete brands',
            // Products
            'view products', 'create products', 'edit products', 'delete products',
            // Orders
            'view orders', 'create orders', 'edit orders', 'delete orders',
            // Shipments
            'view shipments', 'create shipments', 'edit shipments', 'delete shipments',
            // Payments
            'view payments', 'create payments', 'edit payments', 'delete payments',
            // Promotions
            'view promotions', 'create promotions', 'edit promotions', 'delete promotions',
            // Settings
            'view settings', 'edit settings',
        ];

        $permissions = array_values(array_unique(array_merge($permissions, $uiPermissions)));

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
            'stores.view',
            'stores.approve',
            'stores.suspend',
            'categories.manage',
            'brands.manage',
            'products.view',
            'products.create',
            'products.update',
            'products.delete',
            'products.publish',
            'orders.view',
            'orders.update',
            'payments.view',
            'payments.capture',
            'orders.refund',
            'shipments.view',
            'shipments.update',
            'reviews.moderate',
            'coupons.manage',
            'banners.manage',
            'pages.manage',
            'promotions.manage',
            'view settings',
        ]);

        // Editor - can manage catalog content
        $editor = Role::firstOrCreate(['name' => 'editor']);
        $editor->syncPermissions([
            'categories.manage',
            'brands.manage',
            'products.view',
            'products.create',
            'products.update',
            'products.publish',
            'promotions.manage',
        ]);

        // Vendor - restricted to managing their own catalog (Categories, Brands, Products)
        $vendor = Role::firstOrCreate(['name' => 'vendor']);
        $vendor->syncPermissions([
            'categories.manage',
            'brands.manage',
            'products.view',
            'products.create',
            'products.update',
        ]);

        // User - basic permissions
        $user = Role::firstOrCreate(['name' => 'user']);
        $user->syncPermissions([
            //
        ]);

        $this->command->info('Roles and permissions created successfully!');
    }
}
