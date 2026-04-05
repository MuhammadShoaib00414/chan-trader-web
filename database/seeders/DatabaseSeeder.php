<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subcategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Truncate tables to remove old data
        DB::statement('SET FOREIGN_KEY_CHECKS=0;');
        Product::truncate();
        Subcategory::truncate();
        Category::truncate();
        Brand::truncate();
        DB::statement('SET FOREIGN_KEY_CHECKS=1;');

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
        $this->command->info('Admin: chantraders7171@gmail.com / Chan7171');
        $this->command->info('User: test@example.com / password');

        // Create Vendors and Stores
        $vendors = [
            [
                'first_name' => 'Chan',
                'last_name' => 'Traders',
                'email' => 'chantraders7171@gmail.com',
                'store_name' => 'Chan Traders',
                'store_slug' => 'chan-traders',
            ],
        ];

        foreach ($vendors as $spec) {
            $vendor = User::firstOrCreate(
                ['email' => $spec['email']],
                [
                    'first_name' => $spec['first_name'],
                    'last_name' => $spec['last_name'],
                    'password' => Hash::make('Chan7171'),
                    'email_verified_at' => now(),
                    'status' => User::STATUS_ACTIVE,
                ]
            );
            $vendor->assignRole('admin');

            $store = Store::firstOrCreate(
                ['slug' => $spec['store_slug']],
                [
                    'owner_id' => $vendor->id,
                    'name' => $spec['store_name'],
                    'city' => 'Karachi',
                    'address' => 'Saddar, Karachi',
                    'status' => 'active',
                ]
            );
        }

        // Seed catalog basics in ordered sequence
        $this->call([
            CategorySeeder::class,
            SubcategorySeeder::class,
            BrandSeeder::class,
            ProductsSeeder::class,
            VendorProductsSeeder::class,
        ]);

        $this->command->info('Inventory system seeded successfully!');
    }
}
