<?php

use App\Models\Store;
use App\Models\User;

it('lists active stores for app', function () {
    $user = User::factory()->create();
    Store::create([
        'owner_id' => $user->id,
        'name' => 'Test Store A',
        'slug' => 'test-store-a',
        'status' => 'active',
        'products_count' => 10,
        'rating_avg' => 4.5,
    ]);

    $res = $this->get('/api/app/stores');
    $res->assertOk();
    expect($res->json('success'))->toBeTrue();
    $items = $res->json('data.items');
    expect($items)->toBeArray()->and(count($items))->toBeGreaterThan(0);
    expect($items[0])->toHaveKeys(['id', 'name', 'slug', 'logo', 'banner', 'rating_avg', 'products_count']);
});

it('shows a single active store', function () {
    $user = User::factory()->create();
    $store = Store::create([
        'owner_id' => $user->id,
        'name' => 'Test Store B',
        'slug' => 'test-store-b',
        'status' => 'active',
    ]);

    $res = $this->get('/api/app/stores/'.$store->id);
    $res->assertOk();
    expect($res->json('success'))->toBeTrue();
    expect($res->json('data'))->toHaveKeys(['id', 'name', 'slug', 'logo', 'banner', 'rating_avg', 'products_count', 'followers_count', 'description']);
});
