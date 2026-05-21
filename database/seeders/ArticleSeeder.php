<?php

namespace Database\Seeders;

use App\Models\Article;
use App\Models\Subcategory;
use Illuminate\Database\Seeder;

class ArticleSeeder extends Seeder
{
    public function run(): void
    {
        $articles = [
            ['subcategory' => 'MOSFET', 'name' => 'Article 101', 'slug' => 'article-101', 'sort_order' => 1],
            ['subcategory' => 'IGBT', 'name' => 'Article 102', 'slug' => 'article-102', 'sort_order' => 1],
            ['subcategory' => 'Diode', 'name' => 'Article 103', 'slug' => 'article-103', 'sort_order' => 1],
            ['subcategory' => 'Module', 'name' => 'Article 104', 'slug' => 'article-104', 'sort_order' => 1],
            ['subcategory' => 'Capacitor', 'name' => 'Article 105', 'slug' => 'article-105', 'sort_order' => 1],
        ];

        foreach ($articles as $item) {
            $subcategory = Subcategory::query()
                ->where('name', $item['subcategory'])
                ->first();

            if (! $subcategory) {
                $this->command?->warn("Skipping article {$item['name']} because subcategory {$item['subcategory']} was not found.");

                continue;
            }

            Article::firstOrCreate(
                [
                    'subcategory_id' => $subcategory->id,
                    'slug' => $item['slug'],
                ],
                [
                    'name' => $item['name'],
                    'sort_order' => $item['sort_order'],
                    'is_active' => true,
                ]
            );
        }
    }
}
