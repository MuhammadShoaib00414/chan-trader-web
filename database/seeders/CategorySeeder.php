<?php

namespace Database\Seeders;

use App\Models\Category;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    public function run(): void
    {
        $categories = [
            'Parts',
            'Inverters',
            'Welding Machine',
            'Motor',
            'Tools',
            'Mobile Accessories',
            'Breaker',
            'Electric Store',
            'Home Appliances',
        ];

        foreach ($categories as $category) {
            Category::firstOrCreate(
                ['slug' => Str::slug($category)],
                [
                    'name' => $category,
                    'is_active' => true,
                ]
            );
        }
    }
}
