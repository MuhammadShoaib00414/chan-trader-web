<?php

use App\Models\Category;
use App\Models\Subcategory;
use Illuminate\Foundation\Testing\RefreshDatabase;

uses(RefreshDatabase::class);

it('lists only active subcategories', function () {
    $category = Category::create([
        'name' => 'C1',
        'slug' => 'c1',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    $active = Subcategory::create([
        'category_id' => $category->id,
        'name' => 'A',
        'slug' => 'a',
        'is_active' => true,
        'sort_order' => 1,
    ]);

    Subcategory::create([
        'category_id' => $category->id,
        'name' => 'B',
        'slug' => 'b',
        'is_active' => false,
        'sort_order' => 2,
    ]);

    $res = $this->get('/api/app/subcategories');

    $res->assertOk();
    expect($res->json('success'))->toBeTrue();
    $items = $res->json('data.items');
    expect($items)->toBeArray();
    expect(collect($items)->pluck('id')->all())->toBe([$active->id]);
});

it('can filter subcategories by category_id', function () {
    $c1 = Category::create(['name' => 'C1', 'slug' => 'c1', 'is_active' => true, 'sort_order' => 1]);
    $c2 = Category::create(['name' => 'C2', 'slug' => 'c2', 'is_active' => true, 'sort_order' => 2]);

    $s1 = Subcategory::create(['category_id' => $c1->id, 'name' => 'S1', 'slug' => 's1', 'is_active' => true]);
    Subcategory::create(['category_id' => $c2->id, 'name' => 'S2', 'slug' => 's2', 'is_active' => true]);

    $res = $this->get("/api/app/subcategories?category_id={$c1->id}");

    $res->assertOk();
    $items = $res->json('data.items');
    expect(collect($items)->pluck('id')->all())->toBe([$s1->id]);
});
