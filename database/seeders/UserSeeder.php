<?php

namespace Database\Seeders;

use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class UserSeeder extends Seeder
{
    public function run(): void
    {
        $users = [
            [
                'first_name'        => 'Admin',
                'last_name'         => 'User',
                'email'             => 'admin@chantrader.com',
                'password'          => Hash::make('password'),
                'status'            => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
            ],
            [
                'first_name'        => 'Test',
                'last_name'         => 'User',
                'email'             => 'test@chantrader.com',
                'password'          => Hash::make('password'),
                'status'            => User::STATUS_ACTIVE,
                'email_verified_at' => now(),
            ],
        ];

        foreach ($users as $data) {
            User::firstOrCreate(['email' => $data['email']], $data);
        }
    }
}
