<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;
use Spatie\Permission\Models\Role;
use Spatie\Permission\PermissionRegistrar;

class ShopManagementUserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $this->call(RolesAndPermissionsSeeder::class);

        $shopPermissions = [
            'view shop dashboard',
            'view customers',
            'create customers',
            'edit customers',
            'delete customers',
            'view sales',
            'create sales',
            'edit sales',
            'delete sales',
            'view stock',
            'create stock',
            'edit stock',
            'delete stock',
            'view suppliers',
            'create suppliers',
            'edit suppliers',
            'delete suppliers',
        ];

        $role = Role::findOrCreate('shop-user', 'web');

        $user = User::updateOrCreate(
            ['email' => 'shopuser@example.com'],
            [
                'first_name' => 'Shop',
                'last_name' => 'User',
                'password' => Hash::make('password'),
                'email_verified_at' => now(),
                'status' => User::STATUS_ACTIVE,
                'shop_name' => 'Shop Operations',
            ]
        );

        User::query()
            ->where('email', '!=', $user->email)
            ->get()
            ->each(function (User $otherUser) use ($shopPermissions) {
                $remainingDirectPermissions = $otherUser->getDirectPermissions()
                    ->pluck('name')
                    ->reject(fn (string $permission) => in_array($permission, $shopPermissions, true))
                    ->values()
                    ->all();

                $otherUser->syncPermissions($remainingDirectPermissions);

                if ($otherUser->hasRole('shop-user')) {
                    $otherUser->removeRole('shop-user');
                }
            });

        $user->syncRoles([$role]);
        $user->syncPermissions([]);

        app()[PermissionRegistrar::class]->forgetCachedPermissions();

        $this->command?->info('Shop management user created: shopuser@example.com / password');
    }
}
