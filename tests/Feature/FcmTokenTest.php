<?php

use App\Models\User;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('registers and removes fcm token for authenticated api user', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $this->postJson('/api/user/fcm-token', ['fcm_token' => 'test-fcm-token'])
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    expect($user->fresh()->fcm_token)->toBe('test-fcm-token');

    $this->deleteJson('/api/user/fcm-token')
        ->assertSuccessful()
        ->assertJsonPath('success', true);

    expect($user->fresh()->fcm_token)->toBeNull();
});
