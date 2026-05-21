<?php

use App\Enums\NotificationAction;
use App\Models\User;
use App\Services\Notifications\AppNotificationService;
use Database\Seeders\RolesAndPermissionsSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

beforeEach(function () {
    $this->seed(RolesAndPermissionsSeeder::class);
});

it('lists notification actions for authenticated admin', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin, 'api');

    $this->getJson('/api/user/notifications/actions')
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonFragment(['value' => NotificationAction::OrderPlaced->value]);
});

it('dispatches notifications via service for admin', function () {
    Mail::fake();

    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $target = User::factory()->create(['fcm_token' => 'device-token']);

    $this->actingAs($admin, 'api');

    $this->postJson('/api/user/notifications/send', [
        'user_id' => $target->id,
        'action' => NotificationAction::OrderPlaced->value,
        'payload' => [
            'message' => 'Your order was placed.',
            'order_code' => 'ORD-100',
        ],
        'channels' => ['email'],
    ])
        ->assertSuccessful()
        ->assertJsonPath('success', true)
        ->assertJsonPath('data.channels.email', true);
});

it('rejects notification send for non admin users', function () {
    $user = User::factory()->create();
    $this->actingAs($user, 'api');

    $this->postJson('/api/user/notifications/send', [
        'user_id' => $user->id,
        'action' => NotificationAction::Welcome->value,
    ])->assertForbidden();
});

it('notifies through app notification service', function () {
    Mail::fake();

    $user = User::factory()->create(['fcm_token' => null]);
    $service = app(AppNotificationService::class);

    $result = $service->notify(
        $user,
        NotificationAction::Welcome,
        [],
        sendEmail: true,
        sendPush: false,
    );

    expect($result['email'])->toBeTrue();
    Mail::assertQueued(\App\Mail\WelcomeEmail::class);
});
