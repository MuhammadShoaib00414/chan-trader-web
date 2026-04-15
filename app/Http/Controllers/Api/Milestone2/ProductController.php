<?php

namespace App\Http\Controllers\Api\Milestone2;

use App\Http\Controllers\AppBaseController;
use App\Models\Product;
use Illuminate\Http\Request;

/**
 * @group Milestone-2: Product APIs
 */
class ProductController extends AppBaseController
{
    /**
     * Get Single Product Details (Enhanced)
     *
     * @urlParam id integer required Product ID. Example: 101
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Product retrieved",
     *   "data": {
     *     "id": 101,
     *     "name": "1kΩ Carbon Film Resistor",
     *     "slug": "1k-ohm-carbon-film-resistor",
     *     "sku": "RES-1K-CF",
     *     "price": 10.5,
     *     "compare_at": 15.0,
     *     "stock": 100,
     *     "stock_status": "Available",
     *     "condition": "new",
     *     "short_description": "High quality carbon film resistor",
     *     "description": "Detailed product description...",
     *     "feature_image": "images/p101.png",
     *     "warranty_months": 12,
     *     "warranty_text": "1 Year Manufacturer Warranty",
     *     "rating_avg": 4.5,
     *     "rating_count": 25,
     *     "store": {
     *       "id": 12,
     *       "name": "Ali Store"
     *     },
     *     "category": { "id": 7, "name": "Resistors" },
     *     "reviews": [
     *       {
     *         "id": 1,
     *         "user": "John Doe",
     *         "rating": 5,
     *         "comment": "Great product!"
     *       }
     *     ],
     *     "related_products": [
     *       {
     *         "id": 102,
     *         "name": "2kΩ Carbon Film Resistor",
     *         "price": 10.5,
     *         "feature_image": "images/p102.png"
     *       }
     *     ]
     *   }
     * }
     */
    public function show($id)
    {
        $product = Product::with([
            'store:id,name,email,phone,city,address,rating_avg,followers_count,business_whatsapp_url',
            'category:id,name',
            'subcategory:id,name',
            'brand:id,name',
            'reviews' => function($q) {
                $q->where('is_visible', true)->with('user:id,first_name,last_name,avatar')->latest()->limit(5);
            }
        ])->findOrFail($id);

        $relatedProducts = Product::where('category_id', $product->category_id)
            ->where('id', '!=', $product->id)
            ->limit(10)
            ->get(['id', 'name', 'slug', 'price', 'feature_image', 'rating_avg', 'rating_count']);

        return $this->successResponse([
            'id' => $product->id,
            'name' => $product->name,
            'slug' => $product->slug,
            'sku' => $product->sku,
            'condition' => $product->condition,
            'price' => $product->price,
            'compare_at' => $product->compare_at,
            'stock' => $product->stock,
            'stock_status' => $product->stock_status,
            'short_description' => $product->short_description,
            'description' => $product->description,
            'feature_image' => $product->feature_image,
            'top_image' => $product->top_image,
            'unit' => $product->unit,
            'warranty_months' => $product->warranty_months,
            'warranty_text' => $product->warranty_text,
            'rating_avg' => $product->rating_avg,
            'rating_count' => $product->rating_count,
            'store' => $product->store ? [
                'id' => $product->store->id,
                'name' => $product->store->name,
                'email' => $product->store->email,
                'phone' => $product->store->phone,
                'business_whatsapp_url' => $product->store->business_whatsapp_url,
                'city' => $product->store->city,
                'address' => $product->store->address,
                'rating_avg' => $product->store->rating_avg,
                'followers_count' => $product->store->followers_count
            ] : null,
            'category' => $product->category ? ['id' => $product->category->id, 'name' => $product->category->name] : null,
            'subcategory' => $product->subcategory ? ['id' => $product->subcategory->id, 'name' => $product->subcategory->name] : null,
            'brand' => $product->brand ? ['id' => $product->brand->id, 'name' => $product->brand->name] : null,
            'reviews' => $product->reviews->map(function ($review) {
                return [
                    'id' => $review->id,
                    'user' => [
                        'id' => $review->user->id,
                        'name' => $review->user->name,
                        'avatar' => $review->user->avatar,
                    ],
                    'rating' => $review->rating,
                    'comment' => $review->comment,
                    'created_at' => $review->created_at,
                ];
            }),
            'related_products' => $relatedProducts->map(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'price' => $p->price,
                    'feature_image' => $p->feature_image,
                    'rating_avg' => $p->rating_avg,
                    'rating_count' => $p->rating_count,
                ];
            }),
        ], 'Product retrieved');
    }
}
