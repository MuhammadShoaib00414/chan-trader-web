<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Category;
use App\Models\Brand;
use App\Models\Product;
use App\Models\Store;
use App\Models\Order;
use App\Models\Payment;
use App\Models\Shipment;
use App\Models\OrderStatusHistory;
use Illuminate\Http\Request;

Route::get('/', function () {
    return auth()->check()
        ? to_route('dashboard')
        : to_route('login');
})->name('home');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $usersCount = \App\Models\User::count();
        $rolesCount = \Spatie\Permission\Models\Role::count();
        $permissionsCount = \Spatie\Permission\Models\Permission::count();
        $recentUsers = \App\Models\User::latest()
            ->take(5)
            ->get(['id', 'first_name', 'last_name', 'email', 'created_at'])
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => trim($user->first_name . ' ' . $user->last_name),
                    'email' => $user->email,
                    'created_at' => $user->created_at->toISOString(),
                ];
            });

        return Inertia::render('dashboard', [
            'stats' => [
                'users' => $usersCount,
                'roles' => $rolesCount,
                'permissions' => $permissionsCount,
            ],
            'recentUsers' => $recentUsers,
        ]);
    })->name('dashboard');

    // User Management
    Route::get('users', function () {
        $users = \App\Models\User::with('roles')->get()->map(function ($user) {
            return [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'roles' => $user->roles->map(fn($role) => ['name' => $role->name]),
                'status' => $user->status,
                'created_at' => $user->created_at->toISOString(),
            ];
        });

        $roles = \Spatie\Permission\Models\Role::all()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
            ];
        });

        return Inertia::render('users/index', [
            'users' => $users,
            'roles' => $roles,
        ]);
    })->name('users.index')->middleware('permission:view users');

    // Role Management
    Route::get('roles', function () {
        $roles = \Spatie\Permission\Models\Role::with('permissions')->get()->map(function ($role) {
            return [
                'id' => $role->id,
                'name' => $role->name,
                'permissions' => $role->permissions->map(fn($perm) => ['name' => $perm->name]),
                'created_at' => $role->created_at->toISOString(),
            ];
        });

        $permissions = \Spatie\Permission\Models\Permission::all()->map(function ($permission) {
            return [
                'id' => $permission->id,
                'name' => $permission->name,
            ];
        });

        return Inertia::render('roles/index', [
            'roles' => $roles,
            'permissions' => $permissions,
        ]);
    })->name('roles.index')->middleware('permission:view roles');

    // Web-based API routes for Inertia (using session auth)
    Route::prefix('api')->group(function () {
        // User Management
        Route::post('users', [\App\Http\Controllers\Api\UserController::class, 'store'])
            ->middleware('permission:create users');
        Route::put('users/{user}', [\App\Http\Controllers\Api\UserController::class, 'update'])
            ->middleware('permission:edit users');
        Route::delete('users/{user}', [\App\Http\Controllers\Api\UserController::class, 'destroy'])
            ->middleware('permission:delete users');

        // Role Management
        Route::post('roles', [\App\Http\Controllers\Api\RoleController::class, 'store'])
            ->middleware('permission:create roles');
        Route::put('roles/{role}', [\App\Http\Controllers\Api\RoleController::class, 'update'])
            ->middleware('permission:edit roles');
        Route::delete('roles/{role}', [\App\Http\Controllers\Api\RoleController::class, 'destroy'])
            ->middleware('permission:delete roles');

        Route::prefix('admin')->group(function () {
            Route::get('categories', [\App\Http\Controllers\Admin\CategoryController::class, 'index'])
                ->middleware('permission:categories.manage');
            Route::post('categories', [\App\Http\Controllers\Admin\CategoryController::class, 'store'])
                ->middleware('permission:categories.manage');
            Route::get('categories/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'show'])
                ->middleware('permission:categories.manage');
            Route::patch('categories/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'update'])
                ->middleware('permission:categories.manage');
            Route::delete('categories/{category}', [\App\Http\Controllers\Admin\CategoryController::class, 'destroy'])
                ->middleware('permission:categories.manage');

            Route::get('brands', [\App\Http\Controllers\Admin\BrandController::class, 'index'])
                ->middleware('permission:brands.manage');
            Route::post('brands', [\App\Http\Controllers\Admin\BrandController::class, 'store'])
                ->middleware('permission:brands.manage');
            Route::get('brands/{brand}', [\App\Http\Controllers\Admin\BrandController::class, 'show'])
                ->middleware('permission:brands.manage');
            Route::patch('brands/{brand}', [\App\Http\Controllers\Admin\BrandController::class, 'update'])
                ->middleware('permission:brands.manage');
            Route::delete('brands/{brand}', [\App\Http\Controllers\Admin\BrandController::class, 'destroy'])
                ->middleware('permission:brands.manage');

            Route::get('stores', [\App\Http\Controllers\Admin\StoreController::class, 'index'])
                ->middleware('permission:stores.view');
            Route::post('stores', [\App\Http\Controllers\Admin\StoreController::class, 'store'])
                ->middleware('permission:stores.manage_staff');
            Route::get('stores/{store}', [\App\Http\Controllers\Admin\StoreController::class, 'show'])
                ->middleware('permission:stores.view');
            Route::patch('stores/{store}', [\App\Http\Controllers\Admin\StoreController::class, 'update'])
                ->middleware('permission:stores.manage_staff');
            Route::post('stores/{store}/approve', [\App\Http\Controllers\Admin\StoreController::class, 'approve'])
                ->middleware('permission:stores.approve');
            Route::post('stores/{store}/suspend', [\App\Http\Controllers\Admin\StoreController::class, 'suspend'])
                ->middleware('permission:stores.suspend');

            Route::get('products', [\App\Http\Controllers\Admin\ProductController::class, 'index'])
                ->middleware('permission:products.view');
            Route::post('products', [\App\Http\Controllers\Admin\ProductController::class, 'store'])
                ->middleware('permission:products.create');
            Route::get('products/{product}', [\App\Http\Controllers\Admin\ProductController::class, 'show'])
                ->middleware('permission:products.view');
            Route::patch('products/{product}', [\App\Http\Controllers\Admin\ProductController::class, 'update'])
                ->middleware('permission:products.update');
            Route::delete('products/{product}', [\App\Http\Controllers\Admin\ProductController::class, 'destroy'])
                ->middleware('permission:products.delete');
            Route::post('products/{product}/publish', [\App\Http\Controllers\Admin\ProductController::class, 'publish'])
                ->middleware('permission:products.publish');
            Route::post('products/{product}/unpublish', [\App\Http\Controllers\Admin\ProductController::class, 'unpublish'])
                ->middleware('permission:products.publish');

            Route::post('products/{product}/images', [\App\Http\Controllers\Admin\ProductImageController::class, 'store'])
                ->middleware('permission:products.update');
            Route::delete('products/{product}/images/{image}', [\App\Http\Controllers\Admin\ProductImageController::class, 'destroy'])
                ->middleware('permission:products.update');
            Route::patch('products/{product}/images/{image}/primary', [\App\Http\Controllers\Admin\ProductImageController::class, 'primary'])
                ->middleware('permission:products.update');

            Route::post('products/{product}/variants', [\App\Http\Controllers\Admin\ProductVariantController::class, 'store'])
                ->middleware('permission:products.update');
            Route::patch('products/{product}/variants/{variant}', [\App\Http\Controllers\Admin\ProductVariantController::class, 'update'])
                ->middleware('permission:products.update');
            Route::delete('products/{product}/variants/{variant}', [\App\Http\Controllers\Admin\ProductVariantController::class, 'destroy'])
                ->middleware('permission:products.update');

            Route::post('products/{product}/attributes', [\App\Http\Controllers\Admin\ProductAttributeController::class, 'store'])
                ->middleware('permission:products.update');
            Route::patch('products/{product}/attributes/{attribute}', [\App\Http\Controllers\Admin\ProductAttributeController::class, 'update'])
                ->middleware('permission:products.update');
            Route::delete('products/{product}/attributes/{attribute}', [\App\Http\Controllers\Admin\ProductAttributeController::class, 'destroy'])
                ->middleware('permission:products.update');

            Route::get('orders', [\App\Http\Controllers\Admin\OrderController::class, 'index'])
                ->middleware('permission:orders.view');
            Route::get('orders/{order}', [\App\Http\Controllers\Admin\OrderController::class, 'show'])
                ->middleware('permission:orders.view');
            Route::patch('orders/{order}/status', [\App\Http\Controllers\Admin\OrderController::class, 'updateStatus'])
                ->middleware('permission:orders.update');
            Route::get('orders/{order}/timeline', [\App\Http\Controllers\Admin\OrderController::class, 'timeline'])
                ->middleware('permission:orders.view');

            Route::get('payments', [\App\Http\Controllers\Admin\PaymentController::class, 'index'])
                ->middleware('permission:payments.view');
            Route::post('orders/{order}/payments', [\App\Http\Controllers\Admin\PaymentController::class, 'store'])
                ->middleware('permission:payments.capture');
            Route::post('orders/{order}/refund', [\App\Http\Controllers\Admin\PaymentController::class, 'refund'])
                ->middleware('permission:orders.refund');

            Route::post('orders/{order}/shipments', [\App\Http\Controllers\Admin\ShipmentController::class, 'store'])
                ->middleware('permission:shipments.update');
            Route::patch('shipments/{shipment}', [\App\Http\Controllers\Admin\ShipmentController::class, 'update'])
                ->middleware('permission:shipments.update');
        });
    });

    Route::prefix('admin')->group(function () {
        Route::get('stores', function () {
            $items = Store::orderBy('name')->get(['id','name','slug','status']);
            return Inertia::render('admin/stores/index', ['items' => $items]);
        })->middleware('permission:stores.view');

        Route::get('categories', function (Request $request) {
            $query = Category::query()->orderBy('sort_order')->orderBy('name');
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('name', 'like', "%{$q}%");
            }
            $categories = $query->paginate(20)->withQueryString();
            return Inertia::render('admin/categories/index', [
                'items' => $categories->items(),
                'pagination' => [
                    'total' => $categories->total(),
                    'per_page' => $categories->perPage(),
                    'current_page' => $categories->currentPage(),
                    'last_page' => $categories->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                ],
            ]);
        })->middleware('permission:categories.manage');

        Route::get('brands', function (Request $request) {
            $query = Brand::query()->orderBy('name');
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('name', 'like', "%{$q}%");
            }
            $brands = $query->paginate(20)->withQueryString();
            return Inertia::render('admin/brands/index', [
                'items' => $brands->items(),
                'pagination' => [
                    'total' => $brands->total(),
                    'per_page' => $brands->perPage(),
                    'current_page' => $brands->currentPage(),
                    'last_page' => $brands->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                ],
            ]);
        })->middleware('permission:brands.manage');

        Route::get('products', function (Request $request) {
            $query = Product::query()
                ->with(['images' => function ($q) {
                    $q->where('is_primary', true)->select('id','product_id','path','is_primary');
                }])
                ->with(['store:id,name', 'category:id,name']);

            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where(function ($sub) use ($q) {
                    $sub->where('name', 'like', "%{$q}%")
                        ->orWhere('sku', 'like', "%{$q}%");
                });
            }
            if ($request->filled('category_id')) {
                $query->where('category_id', (int) $request->get('category_id'));
            }
            if ($request->filled('store_id')) {
                $query->where('store_id', (int) $request->get('store_id'));
            }

            $sortBy = in_array($request->get('sort_by'), ['created_at','price','name']) ? $request->get('sort_by') : 'created_at';
            $sortDir = in_array($request->get('sort_dir'), ['asc','desc']) ? $request->get('sort_dir') : 'desc';
            $products = $query->orderBy($sortBy, $sortDir)->paginate(20)->withQueryString();

            $items = $products->through(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'sku' => $p->sku,
                    'price' => $p->price,
                    'thumb' => optional($p->images->first())->path,
                    'has_primary_image' => $p->images->isNotEmpty(),
                    'store' => $p->store ? ['id' => $p->store->id, 'name' => $p->store->name] : null,
                    'category' => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
                ];
            });

            $categories = Category::orderBy('name')->get(['id','name']);
            $stores = Store::orderBy('name')->get(['id','name']);
            return Inertia::render('admin/products/index', [
                'items' => $items,
                'pagination' => [
                    'total' => $products->total(),
                    'per_page' => $products->perPage(),
                    'current_page' => $products->currentPage(),
                    'last_page' => $products->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                    'category_id' => $request->get('category_id'),
                    'store_id' => $request->get('store_id'),
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                ],
                'categories' => $categories,
                'stores' => $stores,
            ]);
        })->middleware('permission:products.view');

        Route::get('products/{product}', function (\App\Models\Product $product) {
            $product->load(['variants', 'images', 'attributes']);
            return Inertia::render('admin/products/show', [
                'product' => $product,
            ]);
        })->middleware('permission:products.view');

        Route::get('orders', function (Request $request) {
            $query = Order::query();
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('code', 'like', "%{$q}%");
            }
            if ($request->filled('status')) {
                $query->where('status', $request->string('status')->toString());
            }
            $orders = $query->latest()->paginate(20)->withQueryString();
            return Inertia::render('admin/orders/index', [
                'items' => $orders->items(),
                'pagination' => [
                    'total' => $orders->total(),
                    'per_page' => $orders->perPage(),
                    'current_page' => $orders->currentPage(),
                    'last_page' => $orders->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                    'status' => $request->get('status'),
                ],
            ]);
        })->middleware('permission:orders.view');

        Route::get('orders/{order}', function (Order $order) {
            $timeline = OrderStatusHistory::where('order_id', $order->id)->orderBy('created_at')->get(['from_status','to_status','comment','created_at']);
            $payments = Payment::where('order_id', $order->id)->latest()->get(['id','method','amount','status','paid_at']);
            $shipments = Shipment::where('order_id', $order->id)->latest()->get(['id','store_id','carrier','tracking_no','status','shipped_at','delivered_at']);
            return Inertia::render('admin/orders/show', [
                'order' => $order->only(['id','code','status','payment_status','grand_total','currency','created_at']),
                'timeline' => $timeline,
                'payments' => $payments,
                'shipments' => $shipments,
                'stores' => Store::orderBy('name')->get(['id','name']),
            ]);
        })->middleware('permission:orders.view');

        Route::get('payments', function (Request $request) {
            $query = Payment::query();
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where(function ($sub) use ($q) {
                    $sub->where('provider_txn_id', 'like', "%{$q}%")
                        ->orWhere('order_id', (int) $q);
                });
            }
            if ($request->filled('status')) {
                $query->where('status', $request->string('status')->toString());
            }
            if ($request->filled('method')) {
                $query->where('method', $request->string('method')->toString());
            }
            $items = $query->latest()->paginate(20)->withQueryString();
            return Inertia::render('admin/payments/index', [
                'items' => $items->items(),
                'pagination' => [
                    'total' => $items->total(),
                    'per_page' => $items->perPage(),
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                    'status' => $request->get('status'),
                    'method' => $request->get('method'),
                ],
            ]);
        })->middleware('permission:payments.view');

        Route::get('shipments', function (Request $request) {
            $query = Shipment::query();
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where(function ($sub) use ($q) {
                    $sub->where('tracking_no', 'like', "%{$q}%")
                        ->orWhere('carrier', 'like', "%{$q}%")
                        ->orWhere('order_id', (int) $q);
                });
            }
            if ($request->filled('status')) {
                $query->where('status', $request->string('status')->toString());
            }
            $items = $query->latest()->paginate(20)->withQueryString();
            return Inertia::render('admin/shipments/index', [
                'items' => $items->items(),
                'pagination' => [
                    'total' => $items->total(),
                    'per_page' => $items->perPage(),
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                    'status' => $request->get('status'),
                ],
            ]);
        })->middleware('permission:shipments.view');
    });
});

require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
