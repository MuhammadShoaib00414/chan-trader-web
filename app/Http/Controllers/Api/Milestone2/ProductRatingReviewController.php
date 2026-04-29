<?php

namespace App\Http\Controllers\Api\Milestone2;

use App\Http\Controllers\AppBaseController;
use App\Models\Product;
use App\Models\ProductReview;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Validator;

/**
 * @group Milestone-2: Product APIs
 */
class ProductRatingReviewController extends AppBaseController
{
    /**
     * Product Reviews & Ratings
     *
     * Get all reviews and ratings for a specific product.
     *
     * @urlParam product_id integer required The ID of the product. Example: 1
     * @queryParam per_page integer Items per page. Example: 10
     * @queryParam page integer Page number. Example: 1
     *
     * @response 200 {
     *  "success": true,
     *  "message": "Product reviews retrieved",
     *  "data": {
     *    "items": [
     *      {
     *        "id": 1,
     *        "user": {
     *          "id": 5,
     *          "name": "John Doe",
     *          "avatar": "https://example.com/avatar.jpg"
     *        },
     *        "rating": 5,
     *        "comment": "Great product!",
     *        "created_at": "2026-04-12T12:00:00.000000Z"
     *      }
     *    ],
     *    "pagination": {
     *      "total": 1,
     *      "per_page": 10,
     *      "current_page": 1,
     *      "last_page": 1
     *    }
     *  }
     * }
     */
    public function index(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $perPage = $request->get('per_page', 10);

        $reviews = $product->reviews()
            ->where('is_visible', true)
            ->with('user:id,first_name,last_name,avatar')
            ->latest()
            ->paginate($perPage);

        return $this->successResponse([
            'items' => $reviews->getCollection()->map(function ($review) {
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
            'pagination' => [
                'total' => $reviews->total(),
                'per_page' => $reviews->perPage(),
                'current_page' => $reviews->currentPage(),
                'last_page' => $reviews->lastPage(),
            ]
        ], 'Product reviews retrieved');
    }

    /**
     * Submit Product Review
     *
     * @urlParam product_id integer required The ID of the product. Example: 1
     * @bodyParam rating integer required The rating (1-5). Example: 5
     * @bodyParam comment string The review comment. Example: Great product!
     *
     * @authenticated
     *
     * @response 201 {
     *  "success": true,
     *  "message": "Review submitted successfully",
     *  "data": {
     *    "id": 1,
     *    "rating": 5,
     *    "comment": "Great product!"
     *  }
     * }
     */
    public function store(Request $request, $productId)
    {
        $validator = Validator::make($request->all(), [
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
        ]);

        if ($validator->fails()) {
            return $this->errorResponse($validator->errors()->first());
        }

        $product = Product::findOrFail($productId);

        $review = ProductReview::updateOrCreate(
            ['user_id' => auth()->id(), 'product_id' => $product->id],
            [
                'rating' => $request->rating,
                'comment' => $request->comment,
                'is_visible' => true,
            ]
        );

        // Update product rating avg and count
        $avgRating = $product->reviews()->where('is_visible', true)->avg('rating');
        $countRating = $product->reviews()->where('is_visible', true)->count();

        $product->update([
            'rating_avg' => round($avgRating, 1),
            'rating_count' => $countRating,
        ]);

        return $this->successResponse([
            'id' => $review->id,
            'rating' => $review->rating,
            'comment' => $review->comment,
        ], 'Review submitted successfully', 201);
    }
}
