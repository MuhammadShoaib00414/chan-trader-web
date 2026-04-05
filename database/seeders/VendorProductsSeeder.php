<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class VendorProductsSeeder extends Seeder
{
    /**
     * Creates two vendor accounts (each with a store) and assigns two seeded products per vendor.
     * Remaining catalog products are assigned to the store owned by chantraders7171@gmail.com.
     */
    public function run(): void
    {
        $chanUser = User::firstOrCreate(
            ['email' => 'chantraders7171@gmail.com'],
            [
                'first_name' => 'Chan',
                'last_name' => 'Traders',
                'password' => Hash::make('Chan7171'),
                'email_verified_at' => now(),
                'status' => User::STATUS_ACTIVE,
                'shop_name' => 'Chan Traders',
            ]
        );
        if (! $chanUser->hasRole('admin')) {
            $chanUser->assignRole('admin');
        }

        $chanStore = Store::updateOrCreate(
            ['owner_id' => $chanUser->id],
            [
                'name' => 'Chan Traders',
                'slug' => 'chan-traders',
                'city' => 'Karachi',
                'address' => 'Saddar, Karachi',
                'status' => 'active',
            ]
        );

        $vendorSpecs = [
            [
                'first_name' => 'Ali',
                'last_name' => 'Electronics',
                'email' => 'vendor.ali@traderapp.test',
                'password' => 'password',
                'store_name' => 'Ali Electronics',
                'store_slug' => 'ali-electronics',
                'phone_number' => '+923001111111',
                'business_whatsapp_url' => 'https://wa.me/923001111111',
            ],
            [
                'first_name' => 'Sara',
                'last_name' => 'Industrial Parts',
                'email' => 'vendor.sara@traderapp.test',
                'password' => 'password',
                'store_name' => 'Sara Industrial Parts',
                'store_slug' => 'sara-industrial-parts',
                'phone_number' => '+923002222222',
                'business_whatsapp_url' => 'https://wa.me/923002222222',
            ],
        ];

        $vendorStores = [];

        foreach ($vendorSpecs as $spec) {
            $vendor = User::firstOrCreate(
                ['email' => $spec['email']],
                [
                    'first_name' => $spec['first_name'],
                    'last_name' => $spec['last_name'],
                    'password' => Hash::make($spec['password']),
                    'email_verified_at' => now(),
                    'status' => User::STATUS_ACTIVE,
                    'phone_number' => $spec['phone_number'],
                    'shop_name' => $spec['store_name'],
                ]
            );

            if (! $vendor->hasRole('vendor')) {
                $vendor->assignRole('vendor');
            }

            $store = Store::firstOrCreate(
                ['slug' => $spec['store_slug']],
                [
                    'owner_id' => $vendor->id,
                    'name' => $spec['store_name'],
                    'phone' => $spec['phone_number'],
                    'business_whatsapp_url' => $spec['business_whatsapp_url'],
                    'city' => 'Karachi',
                    'status' => 'active',
                ]
            );

            if ((int) $store->owner_id !== (int) $vendor->id) {
                $store->update(['owner_id' => $vendor->id]);
            }

            if ($store->business_whatsapp_url !== $spec['business_whatsapp_url']) {
                $store->update(['business_whatsapp_url' => $spec['business_whatsapp_url']]);
            }

            $vendorStores[] = $store;
        }

        $products = Product::query()->orderBy('id')->get();

        if ($products->count() < 4) {
            $this->command?->warn('Not enough products to assign 2 per vendor; skipping reassignment.');

            return;
        }

        foreach ([0, 1] as $i) {
            $products->get($i)?->update(['store_id' => $vendorStores[0]->id]);
        }
        foreach ([2, 3] as $i) {
            $products->get($i)?->update(['store_id' => $vendorStores[1]->id]);
        }

        foreach ($products->slice(4) as $product) {
            $product->update(['store_id' => $chanStore->id]);
        }

        $this->command?->info('Vendors seeded: '.implode(', ', array_column($vendorSpecs, 'email')).' (password: password)');
        $this->command?->info('Products 1–2 → '.$vendorStores[0]->name.', 3–4 → '.$vendorStores[1]->name.', rest → '.$chanStore->name);
    }
}
