<?php

use App\Models\User;

test('guests are redirected to the login page', function () {
    $this->get(route('dashboard'))->assertRedirect(route('login'));
});

test('authenticated users can visit the dashboard', function () {
    $user = User::factory()->create();
    $user->givePermissionTo('view dashboard');

    $this->actingAs($user);

    $this->get(route('dashboard'))->assertOk();
});
