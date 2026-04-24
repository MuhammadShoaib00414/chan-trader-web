<?php

use App\Models\Subcategory;

it('serializes numeric identifiers consistently', function () {
    $subcategory = new Subcategory([
        'category_id' => '7',
        'name' => 'Test-p',
        'slug' => 'test-p',
        'sort_order' => '3',
        'is_active' => '1',
    ]);

    $subcategory->id = '62';

    expect($subcategory->toArray())->toMatchArray([
        'id' => 62,
        'category_id' => 7,
        'sort_order' => 3,
        'is_active' => true,
    ]);
});
