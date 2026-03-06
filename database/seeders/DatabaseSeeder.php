<?php

namespace Database\Seeders;

use App\Models\User;
// use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        // Seed roles and permissions first
        $this->call(RolesAndPermissionsSeeder::class);

        // Create Super Admin User
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

        // Create Regular Admin User
        $admin = User::firstOrCreate(
            ['email' => 'manager@example.com'],
            [
                'first_name' => 'Admin',
                'last_name' => 'Manager',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => User::STATUS_ACTIVE,
            ]
        );
        $admin->assignRole('admin');

        // Create Test User (optional)
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

        $this->command->info('Users created successfully!');
        $this->command->info('Super Admin: admin@example.com / password');
        $this->command->info('Admin: manager@example.com / password');
        $this->command->info('User: test@example.com / password');

        // Seed catalog basics
        $this->call(AdminCatalogSeeder::class);
    }
}
