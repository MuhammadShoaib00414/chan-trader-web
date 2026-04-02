<?php

namespace Database\Seeders;

use App\Models\Brand;
use App\Models\Category;
use App\Models\Product;
use App\Models\Store;
use App\Models\Subcategory;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class ProductsSeeder extends Seeder
{
    public function run(): void
    {
        $admin = User::where('email', 'admin@example.com')->first();

        $store = Store::firstOrCreate(
            ['slug' => 'default-store'],
            ['owner_id' => $admin?->id ?? 1, 'name' => 'Default Store']
        );

        $partsCategory = Category::where('slug', 'parts')->first();

        $products = [
            [
                'name' => 'Sanrex Bridge (100A 1600V)',
                'brand' => 'Sanrex',
                'subcategory' => 'Bridge',
                'price' => 2500,
                'sale_price' => 2200,
                'condition' => 'New',
                'is_top_selling' => true,
                'is_featured' => false,
                'image' => '/products/product-1.jpeg',
                'features' => ['Amperage: 100A', 'Voltage: 1600V', 'Type: Bridge Rectifier']
            ],
            [
                'name' => 'Rubycon Capacitor (560µF 450V)',
                'brand' => 'Rubycon',
                'subcategory' => 'Capacitor',
                'price' => 850,
                'sale_price' => 750,
                'condition' => 'New',
                'is_top_selling' => true,
                'is_featured' => false,
                'image' => '/products/product-2.jpeg',
                'features' => ['Capacitance: 560µF', 'Voltage: 450V', 'Brand: Rubycon Japan']
            ],
            [
                'name' => 'EPCOS Capacitor (4700µF 450V)',
                'brand' => 'EPCOS',
                'subcategory' => 'Capacitor',
                'price' => 4500,
                'sale_price' => 4200,
                'condition' => 'New',
                'is_top_selling' => false,
                'is_featured' => true,
                'image' => '/products/product-3.jpeg',
                'features' => ['Capacitance: 4700µF', 'Voltage: 450V', 'Type: Screw Terminal']
            ],
            [
                'name' => 'Sanonda Fan (220V 4.5 inch)',
                'brand' => 'Sanonda',
                'subcategory' => 'Fan',
                'price' => 1200,
                'sale_price' => 1100,
                'condition' => 'New',
                'is_top_selling' => false,
                'is_featured' => true,
                'image' => '/products/product-4.jpeg',
                'features' => ['Voltage: 220V', 'Size: 4.5 inch', 'Type: Cooling Fan']
            ],
            [
                'name' => 'Sanrex Diode (100A 1600V)',
                'brand' => 'Sanrex',
                'subcategory' => 'Diode',
                'price' => 1800,
                'sale_price' => 1650,
                'condition' => 'Used',
                'is_top_selling' => false,
                'is_featured' => false,
                'image' => '/products/product-5.jpeg',
                'features' => ['Amperage: 100A', 'Voltage: 1600V', 'Condition: Used Imported']
            ],
            [
                'name' => 'Challenger Charger (12V 2A)',
                'brand' => 'Challenger',
                'subcategory' => 'Chargers',
                'price' => 1500,
                'sale_price' => 1350,
                'condition' => 'Imported',
                'is_top_selling' => false,
                'is_featured' => false,
                'image' => '/products/product-6.jpeg',
                'features' => ['Voltage: 12V', 'Amperage: 2A', 'Type: AC/DC Adapter']
            ],
            [
                'name' => 'Infineon IGBT (75A 600V)',
                'brand' => 'Infineon',
                'subcategory' => 'IGBT',
                'price' => 3200,
                'sale_price' => 3000,
                'condition' => 'New',
                'is_top_selling' => true,
                'is_featured' => true,
                'image' => '/products/product-7.jpeg',
                'features' => ['Current: 75A', 'Voltage: 600V', 'Type: Discrete IGBT']
            ],
            [
                'name' => 'Semikron Module (75A 1200V)',
                'brand' => 'Semikron',
                'subcategory' => 'Module',
                'price' => 7500,
                'sale_price' => 7000,
                'condition' => 'New',
                'is_top_selling' => true,
                'is_featured' => true,
                'image' => '/products/product-8.jpeg',
                'features' => ['Current: 75A', 'Voltage: 1200V', 'Type: IGBT Module']
            ],
            [
                'name' => 'Samsung Supply (14V 2.14A, 30W)',
                'brand' => 'Samsung',
                'subcategory' => 'Supply',
                'price' => 2200,
                'sale_price' => 2000,
                'condition' => 'Imported',
                'is_top_selling' => false,
                'is_featured' => false,
                'image' => '/products/product-9.jpeg',
                'features' => ['Voltage: 14V', 'Current: 2.14A', 'Power: 30W']
            ],
            [
                'name' => 'Fuji IGBT Module (150A 600V, 30% off)',
                'brand' => 'Fuji',
                'subcategory' => 'Module',
                'price' => 12000,
                'sale_price' => 8400,
                'condition' => 'New',
                'is_top_selling' => true,
                'is_featured' => false,
                'image' => '/products/product-10.jpeg',
                'features' => ['Current: 150A', 'Voltage: 600V', 'Type: Dual IGBT Module']
            ],
        ];

        foreach ($products as $p) {
            $brand = Brand::where('name', $p['brand'])->first();
            $subcategory = Subcategory::where('name', $p['subcategory'])->first();

            Product::firstOrCreate(
                ['slug' => Str::slug($p['name'])],
                [
                    'store_id' => $store->id,
                    'category_id' => $partsCategory->id,
                    'subcategory_id' => $subcategory?->id,
                    'brand_id' => $brand?->id,
                    'name' => $p['name'],
                    'condition' => $p['condition'],
                    'sku' => 'SKU-' . Str::upper(Str::random(6)),
                    'short_description' => $p['name'] . ' with premium quality.',
                    'description' => json_encode($p['features']),
                    'feature_image' => $p['image'],
                    'price' => $p['sale_price'],
                    'compare_at' => $p['price'],
                    'is_published' => true,
                    'is_featured' => $p['is_featured'],
                    'is_top_selling' => $p['is_top_selling'],
                    'published_at' => now(),
                ]
            );
        }
    }
}

