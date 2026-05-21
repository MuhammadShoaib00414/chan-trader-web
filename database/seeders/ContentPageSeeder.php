<?php

namespace Database\Seeders;

use App\Enums\ContentPageSlug;
use App\Models\ContentPage;
use Illuminate\Database\Seeder;

class ContentPageSeeder extends Seeder
{
    public function run(): void
    {
        foreach (ContentPageSlug::all() as $slug) {
            ContentPage::query()->firstOrCreate(
                ['slug' => $slug->value],
                [
                    'title' => $slug->defaultTitle(),
                    'content' => '<p>Content for '.$slug->defaultTitle().' goes here.</p>',
                    'is_published' => true,
                ],
            );
        }
    }
}
