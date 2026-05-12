<?php

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('allows admin to create update and delete stores through the admin api', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('admin'));
    $this->actingAs($admin);

    $owner = User::factory()->create([
        'first_name' => 'Store',
        'last_name' => 'Owner',
        'email' => 'owner@example.com',
    ]);

    $createResponse = $this->post('/api/admin/stores', [
        'owner_id' => $owner->id,
        'name' => 'Managed Store',
        'slug' => 'managed-store',
        'email' => 'store@example.com',
        'phone' => '03001234567',
        'business_whatsapp_url' => 'https://wa.me/923001234567',
        'city' => 'Karachi',
        'address' => 'Main Market',
        'description' => 'Primary managed store',
        'status' => 'active',
    ]);

    $createResponse->assertCreated()->assertJsonPath('success', true);

    $storeId = (int) $createResponse->json('data.id');
    $store = Store::findOrFail($storeId);

    expect($store->name)->toBe('Managed Store');
    expect($store->status)->toBe('active');

    $secondOwner = User::factory()->create([
        'first_name' => 'Second',
        'last_name' => 'Owner',
        'email' => 'owner2@example.com',
    ]);

    $updateResponse = $this->patch("/api/admin/stores/{$store->id}", [
        'owner_id' => $secondOwner->id,
        'name' => 'Managed Store Updated',
        'slug' => 'managed-store-updated',
        'email' => 'updated-store@example.com',
        'phone' => '03111222333',
        'business_whatsapp_url' => 'https://wa.me/923111222333',
        'status' => 'suspended',
        'city' => 'Lahore',
        'address' => 'Updated Market',
    ]);

    $updateResponse->assertOk()->assertJsonPath('success', true);

    expect($store->fresh()?->owner_id)->toBe($secondOwner->id);
    expect($store->fresh()?->name)->toBe('Managed Store Updated');
    expect($store->fresh()?->email)->toBe('updated-store@example.com');
    expect($store->fresh()?->phone)->toBe('03111222333');
    expect($store->fresh()?->business_whatsapp_url)->toBe('https://wa.me/923111222333');
    expect($store->fresh()?->status)->toBe('suspended');
    expect($store->fresh()?->city)->toBe('Lahore');
    expect($store->fresh()?->address)->toBe('Updated Market');

    $deleteResponse = $this->delete("/api/admin/stores/{$store->id}");
    $deleteResponse->assertOk()->assertJsonPath('success', true);
    expect(Store::find($store->id))->toBeNull();
});
