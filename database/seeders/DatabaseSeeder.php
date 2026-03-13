<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // Create Super Admin user (full access)
        $superAdmin = User::firstOrCreate(
            ['email' => 'admin@example.com'],
            [
                'first_name' => 'Super',
                'last_name' => 'Admin',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => User::STATUS_ACTIVE,
            ]
        );
        $superAdmin->assignRole('super-admin');

        // Create Regular Admin user
        $admin = User::firstOrCreate(
            ['email' => 'chantraders7171@gmail.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'Manager',
                'password' => Hash::make('Chan7171'),
                'email_verified_at' => now(),
                'status' => User::STATUS_ACTIVE,
            ]
        );
        $admin->assignRole('admin');

        // Create Test User (basic user)
        $testUser = User::firstOrCreate(
            ['email' => 'test@example.com'],
            [
                'first_name' => 'Test',
                'last_name' => 'User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => User::STATUS_ACTIVE,
            ]
        );
        $testUser->assignRole('user');

        $this->command->info('Core users created successfully!');
        $this->command->info('Super Admin: admin@example.com / password');
        $this->command->info('Admin: manager@example.com / password');
        $this->command->info('User: test@example.com / password');

        // Seed catalog basics (Categories, Brands, base Stores, etc.)
        $this->call(AdminCatalogSeeder::class);

        // Create two Vendor users, each with their own store and 3 products
        $categories = Category::orderBy('id')->get(['id', 'name']);
        $brands = Brand::orderBy('id')->get(['id', 'name']);

        if ($categories->isEmpty() || $brands->isEmpty()) {
            $this->command?->warn('No categories/brands found after AdminCatalogSeeder; skipping vendor products.');

            return;
        }

        $vendorSpecs = [
            [
                'email' => 'vendor1@example.com',
                'first_name' => 'Vendor',
                'last_name' => 'One',
                'store_slug' => 'vendor-1-store',
                'store_name' => 'Vendor 1 Store',
            ],
            [
                'email' => 'vendor2@example.com',
                'first_name' => 'Vendor',
                'last_name' => 'Two',
                'store_slug' => 'vendor-2-store',
                'store_name' => 'Vendor 2 Store',
            ],
        ];

        foreach ($vendorSpecs as $spec) {
            $vendor = User::firstOrCreate(
                ['email' => $spec['email']],
                [
                    'first_name' => $spec['first_name'],
                    'last_name' => $spec['last_name'],
                    'password' => Hash::make('password'),
                    'email_verified_at' => now(),
                    'status' => User::STATUS_ACTIVE,
                ]
            );
            $vendor->assignRole('vendor');

            $store = Store::firstOrCreate(
                ['slug' => $spec['store_slug']],
                [
                    'owner_id' => $vendor->id,
                    'name' => $spec['store_name'],
                    'status' => 'active',
                ]
            );

            foreach (range(1, 3) as $i) {
                $category = $categories->random();
                $brand = $brands->random();

                $baseName = "{$spec['store_name']} Product {$i}";
                $slugBase = Str::slug($baseName);
                $slug = $slugBase.'-'.Str::lower(Str::random(5));
                $sku = 'SKU-'.Str::upper(Str::random(8));

                Product::firstOrCreate(
                    ['sku' => $sku],
                    [
                        'store_id' => $store->id,
                        'category_id' => $category->id,
                        'brand_id' => $brand->id,
                        'name' => $baseName,
                        'slug' => $slug,
                        'short_description' => 'Vendor demo product seeded for development.',
                        'description' => 'This is a vendor-specific product created by DatabaseSeeder.',
                        'price' => random_int(500, 5000) / 100,
                        'compare_at' => null,
                        'unit' => 'pcs',
                        'warranty_months' => null,
                        'is_published' => true,
                        'published_at' => now(),
                    ]
                );
            }

            $this->command->info("Vendor seeded: {$spec['email']} / password (store: {$spec['store_name']})");
        }
    }
}
