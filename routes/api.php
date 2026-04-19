<?php

use App\Http\Controllers\Admin\VendorController as AdminVendorController;
use App\Http\Controllers\Api\App\BrandController as AppBrandController;
use App\Http\Controllers\Api\App\CategoryController as AppCategoryController;
use App\Http\Controllers\Api\App\ProductController as AppProductController;
use App\Http\Controllers\Api\App\PromotionController as AppPromotionController;
use App\Http\Controllers\Api\App\StoreController as AppStoreController;
use App\Http\Controllers\Api\App\SubcategoryController as AppSubcategoryController;
use App\Http\Controllers\Api\App\VoiceSearchController as AppVoiceSearchController;
use App\Http\Controllers\Api\Auth\LoginController;
use App\Http\Controllers\Api\Auth\OtpController;
use App\Http\Controllers\Api\Auth\PasswordController;
use App\Http\Controllers\Api\Auth\ProfileController;
use App\Http\Controllers\Api\Auth\RegisterController;
use App\Http\Controllers\Api\Auth\SocialLoginController;
use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

Route::name('api.')->group(function () {
    // ********************* Auth routes *********************

    // Registration
    Route::post('/register', [RegisterController::class, 'register']);

    // Login/Logout
    Route::post('/login', [LoginController::class, 'login']);
    Route::post('/refresh', [LoginController::class, 'refresh']);

    /**
     * OAuth Token Endpoint (Internal)
     *
     * @group Internal
     *
     * Laravel Passport OAuth2 token endpoint for generating access tokens.
     * This is an internal endpoint used by the auth system and should not be called directly by clients.
     * Use the specific auth endpoints (register, login, refresh) instead.
     *
     * @hideFromAPIDocumentation
     */
    Route::post('/oauth/token', [\Laravel\Passport\Http\Controllers\AccessTokenController::class, 'issueToken']);

    // Social login routes
    Route::post('/auth/apple', [SocialLoginController::class, 'appleLogin']);
    Route::post('/auth/check-user', [SocialLoginController::class, 'checkUser']);

    // OTP routes
    Route::prefix('otp')->group(function () {
        Route::post('/email/send', [OtpController::class, 'sendEmailVerificationOTP']);
        Route::post('/password/send', [OtpController::class, 'sendPasswordResetOTP']);
        Route::post('/email/verify', [OtpController::class, 'verifyEmail']);
        Route::post('/password/verify', [OtpController::class, 'verifyPasswordResetOTP']);
    });

    // Password management
    Route::post('/password/reset', [PasswordController::class, 'resetPassword']);

    // Public APP APIs (mobile/web app)
    Route::prefix('app')->group(function () {
        Route::get('/home', [AppProductController::class, 'home']);
        Route::get('/categories', [AppCategoryController::class, 'index']);
        Route::get('/subcategories', [AppSubcategoryController::class, 'index']);
        Route::get('/brands', [AppBrandController::class, 'index']);
        Route::get('/stores', [AppStoreController::class, 'index']);
        Route::get('/stores/{store}', [AppStoreController::class, 'show']);
        Route::get('/products', [AppProductController::class, 'index']);
        Route::get('/products/{product}', [AppProductController::class, 'show']);
        Route::get('/products/category-counts', [AppProductController::class, 'categoryCounts']);
        Route::get('/promotions', [AppPromotionController::class, 'index']);

        // Voice Search
        Route::post('/voice-search', [AppVoiceSearchController::class, 'search']);
    });

    // Password change (requires authentication)
    Route::middleware(['auth:api', 'verified'])->group(function () {
        Route::post('/password/change', [PasswordController::class, 'changePassword'])
            ->middleware('throttle:5,1'); // Limit to 5 attempts per minute

        // ********************* End Auth routes *********************

        Route::group(['prefix' => 'user'], function () {
            Route::get('/', [UserController::class, 'me']);
            Route::post('/update-profile', [ProfileController::class, 'update']);
            Route::post('/logout', [LoginController::class, 'logout']);
            Route::delete('/account', [UserController::class, 'deleteAccount']);
        });

        // ********************* User Management *********************
        Route::apiResource('users', UserController::class);
        Route::post('users/{user}/roles', [UserController::class, 'assignRoles']);
        Route::post('users/{user}/permissions', [UserController::class, 'assignPermissions']);

        // ********************* Role Management *********************
        Route::apiResource('roles', \App\Http\Controllers\Api\RoleController::class);
        Route::get('roles-permissions', [\App\Http\Controllers\Api\RoleController::class, 'permissions']);

        // ********************* Permission Management *********************
        Route::get('permissions', [\App\Http\Controllers\Api\PermissionController::class, 'index']);
        Route::get('permissions/grouped', [\App\Http\Controllers\Api\PermissionController::class, 'grouped']);
        Route::get('permissions/{permission}', [\App\Http\Controllers\Api\PermissionController::class, 'show']);

        // Super-admin vendor management (Passport)
        Route::prefix('admin')->middleware('role:super-admin')->group(function () {
            Route::get('/vendors', [AdminVendorController::class, 'index']);
            Route::post('/vendors', [AdminVendorController::class, 'store']);
            Route::get('/vendors/{vendor}', [AdminVendorController::class, 'show']);
            Route::put('/vendors/{vendor}', [AdminVendorController::class, 'update']);
            Route::delete('/vendors/{vendor}', [AdminVendorController::class, 'destroy']);
            Route::post('/vendors/{vendor}/verify', [AdminVendorController::class, 'verify']);

            // Order Management
            Route::get('/orders', [\App\Http\Controllers\Admin\OrderController::class, 'index']);
            Route::get('/orders/{order}', [\App\Http\Controllers\Admin\OrderController::class, 'show']);
            Route::put('/orders/{order}/status', [\App\Http\Controllers\Admin\OrderController::class, 'updateStatus']);
            Route::get('/orders/{order}/invoice', [\App\Http\Controllers\Admin\OrderController::class, 'printInvoice']);
            Route::post('/orders/{order}/resend-confirmation', [\App\Http\Controllers\Admin\OrderController::class, 'resendConfirmation']);
            Route::post('/orders/{order}/cancel', [\App\Http\Controllers\Admin\OrderController::class, 'cancel']);

            // Customer Management (extending UserController)
            Route::get('/customers', [\App\Http\Controllers\Api\UserController::class, 'index']);
            Route::put('/customers/{user}/status', [\App\Http\Controllers\Api\UserController::class, 'updateStatus']);
            Route::get('/customers/export', [\App\Http\Controllers\Api\UserController::class, 'export']);

            // Inventory Management
            Route::get('/inventory', [\App\Http\Controllers\Admin\ProductController::class, 'inventory']);
            Route::get('/inventory/download', [\App\Http\Controllers\Admin\ProductController::class, 'downloadInventory']);

            // Payment Management
            Route::get('/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index']);
            Route::get('/payments/{payment}', [\App\Http\Controllers\Admin\PaymentController::class, 'show']);
            Route::post('/payments/export', [\App\Http\Controllers\Admin\PaymentController::class, 'export']);
            Route::post('/payments/refund/{order}', [\App\Http\Controllers\Admin\PaymentController::class, 'refund']);
            Route::post('/payments/configure', [\App\Http\Controllers\Admin\PaymentController::class, 'configureGateway']);
        });

        // ********************* Milestone-2 APIs *********************
        Route::prefix('milestone2')->group(function () {
            // Product Ratings & Reviews
            Route::get('/products/{product}/reviews', [\App\Http\Controllers\Api\Milestone2\ProductRatingReviewController::class, 'index']);
            Route::post('/products/{product}/reviews', [\App\Http\Controllers\Api\Milestone2\ProductRatingReviewController::class, 'store']);

            // Enhanced Product Details
            Route::get('/products/{product}', [\App\Http\Controllers\Api\Milestone2\ProductController::class, 'show']);

            // Cart APIs
            Route::get('/cart', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'index']);
            Route::post('/cart', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'store']);
            Route::put('/cart/{item}', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'update']);
            Route::delete('/cart/{item}', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'destroy']);
            Route::post('/cart/{item}/save-for-later', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'saveForLater']);
            Route::get('/cart/validate', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'validateCheckout']);
            Route::delete('/cart/clear', [\App\Http\Controllers\Api\Milestone2\CartController::class, 'clear']);

            // Wishlist APIs
            Route::get('/wishlist', [\App\Http\Controllers\Api\Milestone2\WishlistController::class, 'index']);
            Route::post('/wishlist/toggle', [\App\Http\Controllers\Api\Milestone2\WishlistController::class, 'toggle']);
            Route::post('/wishlist/{item}/move-to-cart', [\App\Http\Controllers\Api\Milestone2\WishlistController::class, 'moveToCart']);

            // Checkout & Address APIs
            Route::get('/addresses', [\App\Http\Controllers\Api\Milestone2\CheckoutController::class, 'listAddresses']);
            Route::post('/addresses', [\App\Http\Controllers\Api\Milestone2\CheckoutController::class, 'storeAddress']);
            Route::put('/addresses/{address}', [\App\Http\Controllers\Api\Milestone2\CheckoutController::class, 'updateAddress']);
            Route::delete('/addresses/{address}', [\App\Http\Controllers\Api\Milestone2\CheckoutController::class, 'deleteAddress']);
            Route::post('/checkout/place-order', [\App\Http\Controllers\Api\Milestone2\CheckoutController::class, 'placeOrder']);

            // Order APIs
            Route::get('/orders', [\App\Http\Controllers\Api\Milestone2\OrderController::class, 'index']);
            Route::get('/orders/{order}', [\App\Http\Controllers\Api\Milestone2\OrderController::class, 'show']);
            Route::post('/orders/{order}/reorder', [\App\Http\Controllers\Api\Milestone2\OrderController::class, 'reorder']);
            Route::post('/orders/{order}/cancel', [\App\Http\Controllers\Api\Milestone2\OrderController::class, 'cancel']);
            Route::post('/orders/{order}/return', [\App\Http\Controllers\Api\Milestone2\OrderController::class, 'requestReturn']);
            Route::get('/orders/{order}/invoice', [\App\Http\Controllers\Api\Milestone2\OrderController::class, 'downloadInvoice']);
        });
    });
});
