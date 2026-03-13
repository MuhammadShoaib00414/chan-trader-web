<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class AdminCatalogSeeder extends Seeder
{
    public function run(): void
    {
        $owner = User::where('email', 'admin@example.com')->first()
            ?? User::where('email', 'manager@example.com')->first();

        $store = Store::firstOrCreate(
            ['slug' => 'default-store'],
            ['owner_id' => $owner?->id ?? 1, 'name' => 'Default Store']
        );

        $categories = [
            ['name' => 'Resistors', 'slug' => 'resistors'],
            ['name' => 'Capacitors', 'slug' => 'capacitors'],
            ['name' => 'Semiconductors', 'slug' => 'semiconductors'],
            ['name' => 'Parts', 'slug' => 'parts'],
            ['name' => 'Inverters', 'slug' => 'inverters'],
            ['name' => 'Motors', 'slug' => 'motors'],
            ['name' => 'Tools', 'slug' => 'tools'],
            ['name' => 'Accessories', 'slug' => 'accessories'],
            ['name' => 'Welding Machine', 'slug' => 'welding-machine'],
            ['name' => 'Breaker', 'slug' => 'breaker'],
            ['name' => 'Electronic', 'slug' => 'electronic'],
            ['name' => 'Home Appliance', 'slug' => 'home-appliance'],
        ];
        foreach ($categories as $c) {
            Category::firstOrCreate(['slug' => $c['slug']], $c + ['is_active' => true]);
        }

        $brands = [
            ['name' => 'Texas Instruments', 'slug' => 'texas-instruments'],
            ['name' => 'Analog Devices', 'slug' => 'analog-devices'],
            ['name' => 'NXP', 'slug' => 'nxp'],
            ['name' => 'STMicroelectronics', 'slug' => 'st-microelectronics'],
            ['name' => 'Infineon', 'slug' => 'infineon'],
            ['name' => 'Microchip', 'slug' => 'microchip'],
            ['name' => 'ON Semiconductor', 'slug' => 'onsemi'],
            ['name' => 'Renesas', 'slug' => 'renesas'],
            ['name' => 'Maxim Integrated', 'slug' => 'maxim-integrated'],
            ['name' => 'Broadcom', 'slug' => 'broadcom'],
        ];
        $order = 1;
        foreach ($brands as $b) {
            Brand::firstOrCreate(['slug' => $b['slug']], $b + ['sort_order' => $order++]);
        }

        $category = Category::where('slug', 'semiconductors')->first();
        $brand = Brand::where('slug', 'texas-instruments')->first();

        if ($category && ! Product::where('slug', 'mosfet-aoz'.date('md'))->exists()) {
            Product::create([
                'store_id' => $store->id,
                'category_id' => $category->id,
                'brand_id' => $brand?->id,
                'name' => 'MOSFET AOZ',
                'slug' => 'mosfet-aoz'.date('md'),
                'sku' => 'SKU-'.Str::upper(Str::random(6)),
                'price' => 9.99,
                'is_published' => true,
                'published_at' => now(),
            ]);
        }
    }
}
