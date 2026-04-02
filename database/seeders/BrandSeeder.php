<?php

namespace Database\Seeders;

use App\Models\Brand;
use Illuminate\Database\Seeder;
use Illuminate\Support\Str;

class BrandSeeder extends Seeder
{
    public function run(): void
    {
        $brands = [
            'Sanrex',
            'Rubycon',
            'EPCOS',
            'Sanonda',
            'Challenger',
            'Infineon',
            'Semikron',
            'Samsung',
            'Fuji',
        ];

        foreach ($brands as $brand) {
            Brand::firstOrCreate(
                ['slug' => Str::slug($brand)],
                ['name' => $brand]
            );
        }
    }
}
