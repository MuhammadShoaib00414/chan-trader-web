<?php

namespace Tests\Feature\Api\Auth;

use App\Models\User;
use Illuminate\Foundation\Testing\WithFaker;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class, WithFaker::class);

it('allows a new user to register via api', function () {
    $payload = [
        'full_name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone_number' => '03001234567',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'shop_name' => 'Jane Shop',
        'city_district' => 'Karachi',
        'address' => '456 Market St',
    ];

    $response = $this->postJson(route('register'), $payload);

    $response->assertStatus(200)
        ->assertJsonStructure([
            'success',
            'message',
            'data' => [
                'user' => [
                    'id',
                    'full_name',
                    'email',
                    'phone_number',
                    'shop_name',
                    'city_district',
                    'address',
                    'roles',
                ],
                'otp',
            ],
        ]);

    $user = User::where('email', 'jane@example.com')->first();
    expect($user)->not->toBeNull();
    expect($user->hasRole('user'))->toBeTrue();

});

it('rejects duplicate email and phone', function () {
    User::factory()->create([
        'email' => 'jane@example.com',
        'phone_number' => '03001234567',
    ]);

    $payload = [
        'full_name' => 'Jane Doe',
        'email' => 'jane@example.com',
        'phone_number' => '03001234567',
        'password' => 'password123',
        'password_confirmation' => 'password123',
        'shop_name' => 'Jane Shop',
        'city_district' => 'Karachi',
        'address' => '456 Market St',
    ];

    $response = $this->postJson(route('register'), $payload);
    $response->assertStatus(422)
        ->assertJsonValidationErrors(['email', 'phone_number']);
});
