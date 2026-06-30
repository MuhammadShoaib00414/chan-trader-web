<?php

use App\Enums\FcmPlatform;
use App\Models\User;
use App\Models\UserFcmToken;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('registers mobile and web fcm tokens separately for the same user', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $this->postJson('/api/user/fcm-token', [
        'fcm_token' => 'mobile-token-abc',
        'platform' => FcmPlatform::Mobile->value,
        'device_id' => 'phone-1',
    ])->assertSuccessful();

    $this->postJson('/api/user/fcm-token', [
        'fcm_token' => 'web-token-xyz',
        'platform' => FcmPlatform::Web->value,
        'device_id' => 'browser-1',
    ])->assertSuccessful();

    expect(UserFcmToken::query()->where('user_id', $user->id)->count())->toBe(2);
    expect($user->fresh()->fcm_token)->toBe('mobile-token-abc');
});

it('removes a specific fcm token on logout', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $this->postJson('/api/user/fcm-token', [
        'fcm_token' => 'mobile-token-abc',
        'platform' => FcmPlatform::Mobile->value,
    ])->assertSuccessful();

    $this->deleteJson('/api/user/fcm-token', [
        'fcm_token' => 'mobile-token-abc',
        'platform' => FcmPlatform::Mobile->value,
    ])->assertSuccessful();

    expect(UserFcmToken::query()->where('user_id', $user->id)->count())->toBe(0);
    expect($user->fresh()->fcm_token)->toBeNull();
});

it('defaults api fcm registration to mobile platform', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $this->postJson('/api/user/fcm-token', ['fcm_token' => 'legacy-mobile-token'])
        ->assertSuccessful();

    $record = UserFcmToken::query()->where('user_id', $user->id)->first();
    expect($record?->platform)->toBe(FcmPlatform::Mobile);
});
