<?php

use App\Models\Store;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Spatie\Permission\Models\Role;

uses(RefreshDatabase::class);

it('updates vendor contact fields on both the vendor and primary store', function () {
    $admin = User::factory()->create();
    $admin->assignRole(Role::findByName('super-admin'));
    $this->actingAs($admin);

    $vendor = User::factory()->create([
        'first_name' => 'Vendor',
        'last_name' => 'Owner',
        'email' => 'vendor@example.com',
        'phone_number' => '03001234567',
        'shop_name' => 'Vendor Shop',
        'city_district' => 'Karachi',
        'address' => 'Old Address',
        'status' => User::STATUS_ACTIVE,
    ]);
    $vendor->assignRole('vendor');

    $store = Store::create([
        'owner_id' => $vendor->id,
        'name' => 'Vendor Store',
        'slug' => 'vendor-store',
        'email' => 'vendor@example.com',
        'phone' => '03001234567',
        'business_whatsapp_url' => 'https://wa.me/923001234567',
        'city' => 'Karachi',
        'address' => 'Old Address',
        'status' => 'active',
    ]);

    $response = $this->patch("/api/admin/vendors/{$vendor->id}", [
        'first_name' => 'Updated',
        'last_name' => 'Vendor',
        'email' => 'updated.vendor@gmail.com',
        'phone_number' => '03111222333',
        'shop_name' => 'Updated Shop',
        'city_district' => 'Lahore',
        'address' => 'New Address',
        'business_whatsapp_url' => 'https://wa.me/923111222333',
    ]);

    $response->assertOk()->assertJsonPath('success', true);

    expect($vendor->fresh())
        ->email->toBe('updated.vendor@gmail.com')
        ->phone_number->toBe('03111222333')
        ->shop_name->toBe('Updated Shop')
        ->city_district->toBe('Lahore')
        ->address->toBe('New Address');

    expect($store->fresh())
        ->email->toBe('updated.vendor@gmail.com')
        ->phone->toBe('03111222333')
        ->business_whatsapp_url->toBe('https://wa.me/923111222333')
        ->city->toBe('Lahore')
        ->address->toBe('New Address');
});
