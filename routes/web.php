<?php

use App\Models\Article;
use App\Models\Brand;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderStatusHistory;
use App\Models\Payment;
use App\Models\Product;
use App\Models\Shipment;
use App\Models\Store;
use App\Models\Subcategory;
use App\Models\Supplier;
use App\Models\SupplierPayment;
use App\Models\SupplierTransaction;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

Route::get('/', function () {
    if (auth()->check()) {
        return redirect()->route('dashboard');
    }

    return redirect()->route('login');
})->name('home');

Route::get('/csrf-token', function (Request $request) {
    $request->session()->regenerateToken();

    return response()->json([
        'token' => csrf_token(),
    ]);
})->name('csrf.token');

Route::middleware(['auth', 'verified'])->group(function () {
    Route::get('dashboard', function () {
        $user = auth()->user();
        if ($user?->can('view shop dashboard') && ! $user->can('view dashboard')) {
            return redirect()->route('shop.dashboard');
        }

        $isSuper = $user?->hasRole('super-admin');
        $isVendor = $user?->hasRole('vendor');
        $now = Carbon::now();

        $recentUsers = [];
        if (!$isVendor) {
            $recentUsers = \App\Models\User::latest()
                ->take(5)
                ->get(['id', 'first_name', 'last_name', 'email', 'created_at'])
                ->map(function ($user) {
                    return [
                        'id' => $user->id,
                        'name' => trim($user->first_name.' '.$user->last_name),
                        'email' => $user->email,
                        'created_at' => $user->created_at->toISOString(),
                    ];
                });
        }

        if ($isSuper) {
            $stats = [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'permissions' => \Spatie\Permission\Models\Permission::count(),
                'stores' => Store::count(),
                'products' => Product::count(),
                'orders' => Order::count(),
                'pending_orders' => Order::where('status', 'pending')->count(),
                'payments' => Payment::count(),
                'shipments' => Shipment::count(),
                'sales' => [
                    'today' => Order::whereDate('created_at', Carbon::today())->where('payment_status', 'paid')->sum('grand_total'),
                    'week' => Order::whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])->where('payment_status', 'paid')->sum('grand_total'),
                    'month' => Order::whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->where('payment_status', 'paid')->sum('grand_total'),
                    'year' => Order::whereYear('created_at', $now->year)->where('payment_status', 'paid')->sum('grand_total'),
                ],
            ];
        } elseif ($isVendor) {
            $storeIds = Store::where('owner_id', $user->id)->pluck('id');
            $orderIds = Order::whereHas('items', function ($q) use ($storeIds) {
                $q->whereIn('store_id', $storeIds);
            })->pluck('id');
            $stats = [
                'my_products' => Product::whereIn('store_id', $storeIds)->count(),
                'my_orders' => Order::whereIn('id', $orderIds)->count(),
                'pending_orders' => Order::whereIn('id', $orderIds)->where('status', 'pending')->count(),
                'my_payments' => Payment::whereIn('order_id', $orderIds)->count(),
                'my_shipments' => Shipment::whereIn('store_id', $storeIds)->count(),
                'sales' => [
                    'today' => Order::whereIn('id', $orderIds)->whereDate('created_at', Carbon::today())->where('payment_status', 'paid')->sum('grand_total'),
                    'week' => Order::whereIn('id', $orderIds)->whereBetween('created_at', [$now->copy()->startOfWeek(), $now->copy()->endOfWeek()])->where('payment_status', 'paid')->sum('grand_total'),
                    'month' => Order::whereIn('id', $orderIds)->whereMonth('created_at', $now->month)->whereYear('created_at', $now->year)->where('payment_status', 'paid')->sum('grand_total'),
                    'year' => Order::whereIn('id', $orderIds)->whereYear('created_at', $now->year)->where('payment_status', 'paid')->sum('grand_total'),
                ],
            ];
        } else {
            $stats = [
                'users' => \App\Models\User::count(),
                'roles' => \Spatie\Permission\Models\Role::count(),
                'permissions' => \Spatie\Permission\Models\Permission::count(),
            ];
        }

        return Inertia::render('dashboard', [
            'stats' => $stats,
            'recentUsers' => $recentUsers,
        ]);
    })->name('dashboard')->middleware('permission:view dashboard|view shop dashboard');

    // User Management
    Route::get('users', function () {
        $users = \App\Models\User::with('roles')
            ->whereDoesntHave('roles', function ($q) {
                $q->where('name', 'vendor');
            })
            ->get()
            ->map(function ($user) {
                return [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone_number' => $user->phone_number,
                    'roles' => $user->roles->map(fn ($role) => ['name' => $role->name]),
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
                'permissions' => $role->permissions->map(fn ($perm) => ['name' => $perm->name]),
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

        // Permissions (session-auth for tests and Inertia)
        Route::get('permissions', [\App\Http\Controllers\Api\PermissionController::class, 'index']);
        Route::get('permissions/grouped', [\App\Http\Controllers\Api\PermissionController::class, 'grouped']);
        Route::get('permissions/{permission}', [\App\Http\Controllers\Api\PermissionController::class, 'show']);

        Route::prefix('admin')->group(function () {
            Route::get('vendors', [\App\Http\Controllers\Admin\VendorController::class, 'indexJson'])
                ->middleware('role:super-admin');
            Route::post('vendors', [\App\Http\Controllers\Admin\VendorController::class, 'store'])
                ->middleware('role:super-admin');
            Route::patch('vendors/{vendor}', [\App\Http\Controllers\Admin\VendorController::class, 'update'])
                ->middleware('role:super-admin');
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

            Route::get('subcategories', [\App\Http\Controllers\Admin\SubcategoryController::class, 'index'])
                ->middleware('permission:subcategories.manage');
            Route::post('subcategories', [\App\Http\Controllers\Admin\SubcategoryController::class, 'store'])
                ->middleware('permission:subcategories.manage');
            Route::get('subcategories/{subcategory}', [\App\Http\Controllers\Admin\SubcategoryController::class, 'show'])
                ->middleware('permission:subcategories.manage');
            Route::patch('subcategories/{subcategory}', [\App\Http\Controllers\Admin\SubcategoryController::class, 'update'])
                ->middleware('permission:subcategories.manage');
            Route::delete('subcategories/{subcategory}', [\App\Http\Controllers\Admin\SubcategoryController::class, 'destroy'])
                ->middleware('permission:subcategories.manage');

            Route::get('articles', [\App\Http\Controllers\Admin\ArticleController::class, 'index'])
                ->middleware('permission:articles.manage');
            Route::post('articles', [\App\Http\Controllers\Admin\ArticleController::class, 'store'])
                ->middleware('permission:articles.manage');
            Route::get('articles/{article}', [\App\Http\Controllers\Admin\ArticleController::class, 'show'])
                ->middleware('permission:articles.manage');
            Route::patch('articles/{article}', [\App\Http\Controllers\Admin\ArticleController::class, 'update'])
                ->middleware('permission:articles.manage');
            Route::delete('articles/{article}', [\App\Http\Controllers\Admin\ArticleController::class, 'destroy'])
                ->middleware('permission:articles.manage');

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
            Route::get('products/subcategories', [\App\Http\Controllers\Admin\ProductController::class, 'subcategories'])
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
            Route::post('products/{product}/feature-image', [\App\Http\Controllers\Admin\ProductController::class, 'uploadFeatureImage'])
                ->middleware('permission:products.update');
            Route::post('products/{product}/top-image', [\App\Http\Controllers\Admin\ProductController::class, 'uploadTopImage'])
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

            Route::get('promotions', [\App\Http\Controllers\Admin\PromotionController::class, 'index'])
                ->middleware('permission:promotions.manage|promotions.view');
            Route::post('promotions', [\App\Http\Controllers\Admin\PromotionController::class, 'store'])
                ->middleware('permission:promotions.manage');
            Route::get('promotions/{promotion}', [\App\Http\Controllers\Admin\PromotionController::class, 'show'])
                ->middleware('permission:promotions.manage');
            Route::patch('promotions/{promotion}', [\App\Http\Controllers\Admin\PromotionController::class, 'update'])
                ->middleware('permission:promotions.manage');
            Route::delete('promotions/{promotion}', [\App\Http\Controllers\Admin\PromotionController::class, 'destroy'])
                ->middleware('permission:promotions.manage');
        });
    });

    Route::prefix('admin')->group(function () {
        Route::get('vendors', [\App\Http\Controllers\Admin\VendorController::class, 'index'])
            ->middleware('role:super-admin')
            ->name('admin.vendors.index');
        Route::get('stores', function () {
            $items = Store::orderBy('name')->get(['id', 'name', 'slug', 'status']);

            return Inertia::render('admin/stores/index', ['items' => $items]);
        })->middleware('permission:stores.view');

        Route::get('categories', function (Request $request) {
            $query = Category::query();
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('name', 'like', "%{$q}%");
            }
            $sortBy = in_array($request->get('sort_by'), ['id', 'name', 'slug', 'sort_order', 'is_active', 'created_at']) ? $request->get('sort_by') : 'sort_order';
            $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'asc';
            $query->orderBy($sortBy, $sortDir);
            if ($sortBy !== 'id') {
                $query->orderBy('id', 'asc');
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
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                ],
            ]);
        })->middleware('permission:categories.manage');

        Route::get('subcategories', function (Request $request) {
            $query = Subcategory::query()->with('category:id,name');
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('name', 'like', "%{$q}%");
            }
            if ($request->filled('category_id')) {
                $query->where('category_id', (int) $request->get('category_id'));
            }
            $sortBy = in_array($request->get('sort_by'), ['id', 'name', 'slug', 'sort_order', 'is_active', 'created_at']) ? $request->get('sort_by') : 'sort_order';
            $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'asc';
            $query->orderBy($sortBy, $sortDir);
            if ($sortBy !== 'id') {
                $query->orderBy('id', 'asc');
            }
            $items = $query->paginate(20)->withQueryString();

            return Inertia::render('admin/subcategories/index', [
                'items' => $items->items(),
                'pagination' => [
                    'total' => $items->total(),
                    'per_page' => $items->perPage(),
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                    'category_id' => $request->get('category_id'),
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                ],
                'categories' => Category::orderBy('name')->get(['id', 'name']),
            ]);
        })->middleware('permission:subcategories.manage');

        Route::get('articles', function (Request $request) {
            $query = Article::query()->with(['subcategory:id,category_id,name', 'subcategory.category:id,name']);
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('name', 'like', "%{$q}%");
            }
            if ($request->filled('subcategory_id')) {
                $query->where('subcategory_id', (int) $request->get('subcategory_id'));
            }
            if ($request->filled('category_id')) {
                $query->whereHas('subcategory', function ($subcategoryQuery) use ($request): void {
                    $subcategoryQuery->where('category_id', (int) $request->get('category_id'));
                });
            }
            $sortBy = in_array($request->get('sort_by'), ['id', 'name', 'slug', 'sort_order', 'is_active', 'created_at']) ? $request->get('sort_by') : 'sort_order';
            $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'asc';
            $query->orderBy($sortBy, $sortDir);
            if ($sortBy !== 'id') {
                $query->orderBy('id', 'asc');
            }
            $items = $query->paginate(20)->withQueryString();

            return Inertia::render('admin/articles/index', [
                'items' => $items->items(),
                'pagination' => [
                    'total' => $items->total(),
                    'per_page' => $items->perPage(),
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                    'category_id' => $request->get('category_id'),
                    'subcategory_id' => $request->get('subcategory_id'),
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                ],
                'categories' => Category::orderBy('name')->get(['id', 'name']),
                'subcategories' => Subcategory::orderBy('name')->get(['id', 'name', 'category_id']),
            ]);
        })->middleware('permission:articles.manage');

        Route::get('brands', function (Request $request) {
            $query = Brand::query();
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->where('name', 'like', "%{$q}%");
            }
            $sortBy = in_array($request->get('sort_by'), ['id', 'name', 'slug', 'sort_order', 'created_at']) ? $request->get('sort_by') : 'name';
            $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'asc';
            $brands = $query->orderBy($sortBy, $sortDir)->paginate(20)->withQueryString();

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
                    'sort_by' => $sortBy,
                    'sort_dir' => $sortDir,
                ],
            ]);
        })->middleware('permission:brands.manage');

        Route::get('products', function (Request $request) {
            $query = Product::query()
                ->with(['images' => function ($q) {
                    $q->where('is_primary', true)->select('id', 'product_id', 'path', 'is_primary');
                }])
                ->with(['store:id,name', 'category:id,name']);

            if ($request->user() && $request->user()->hasRole('vendor')) {
                $query->whereHas('store', function ($q) use ($request) {
                    $q->where('owner_id', $request->user()->id);
                });
            }

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

            $sortBy = in_array($request->get('sort_by'), ['created_at', 'price', 'name']) ? $request->get('sort_by') : 'created_at';
            $sortDir = in_array($request->get('sort_dir'), ['asc', 'desc']) ? $request->get('sort_dir') : 'desc';
            $products = $query->orderBy($sortBy, $sortDir)->paginate(20)->withQueryString();

            $items = $products->through(function ($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'slug' => $p->slug,
                    'sku' => $p->sku,
                    'price' => $p->price,
                    'discounted_price' => $p->discounted_price,
                    'purchase_price' => $p->purchase_price,
                    'stock' => $p->stock,
                    'low_stock_threshold' => $p->low_stock_threshold,
                    'compare_at' => null,
                    'discount_percent' => $p->discount_percent,
                    'thumb' => $p->feature_image ?: optional($p->images->first())->path,
                    'has_primary_image' => $p->images->isNotEmpty(),
                    'store' => $p->store ? ['id' => $p->store->id, 'name' => $p->store->name] : null,
                    'category' => $p->category ? ['id' => $p->category->id, 'name' => $p->category->name] : null,
                    'is_published' => $p->is_published,
                ];
            });

            $categories = Category::orderBy('name')->get(['id', 'name']);
            $subcategories = Subcategory::orderBy('name')->get(['id', 'name', 'category_id']);
            $stores = Store::orderBy('name')->get(['id', 'name']);
            $brands = Brand::orderBy('name')->get(['id', 'name']);

            $isVendor = $request->user()?->hasRole('vendor') ?? false;
            $vendorStore = null;
            if ($isVendor) {
                $vendorStore = Store::where('owner_id', $request->user()->id)->first(['id', 'name']);
            }

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
                'subcategories' => $subcategories,
                'stores' => $stores,
                'brands' => $brands,
                'isVendor' => $isVendor,
                'vendorStore' => $vendorStore,
            ]);
        })->middleware('permission:products.view');

        Route::get('products/{product}', function (\App\Models\Product $product) {
            if (auth()->user()?->hasRole('vendor')) {
                $product->load('store:id,owner_id');
                abort_unless($product->store && $product->store->owner_id === auth()->id(), 403);
            }
            $product->load(['images', 'category:id,name', 'subcategory:id,name', 'brand:id,name', 'store:id,name']);

            return Inertia::render('admin/products/show', [
                'product' => $product,
                'stores' => \App\Models\Store::orderBy('name')->get(['id', 'name']),
                'categories' => \App\Models\Category::orderBy('name')->get(['id', 'name']),
                'subcategories' => \App\Models\Subcategory::orderBy('name')->get(['id', 'name', 'category_id']),
                'brands' => \App\Models\Brand::orderBy('name')->get(['id', 'name']),
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
            $timeline = OrderStatusHistory::where('order_id', $order->id)->orderBy('created_at')->get(['from_status', 'to_status', 'comment', 'created_at']);
            $payments = Payment::where('order_id', $order->id)->latest()->get(['id', 'method', 'amount', 'status', 'paid_at']);
            $shipments = Shipment::where('order_id', $order->id)->latest()->get(['id', 'store_id', 'carrier', 'tracking_no', 'status', 'shipped_at', 'delivered_at']);

            $order->load(['user:id,first_name,last_name,email,phone_number', 'shippingAddress:id,address_line_1,address_line_2,city,state,country,postal_code']);

            return Inertia::render('admin/orders/show', [
                'order' => array_merge(
                    $order->only(['id', 'code', 'status', 'payment_status', 'grand_total', 'currency', 'created_at', 'notes']),
                    [
                        'customer' => $order->user ? [
                            'id' => $order->user->id,
                            'name' => trim(($order->user->first_name ?? '') . ' ' . ($order->user->last_name ?? '')),
                            'email' => $order->user->email,
                            'phone' => $order->user->phone_number,
                        ] : null,
                        'shipping_address' => $order->shippingAddress,
                    ]
                ),
                'timeline' => $timeline,
                'payments' => $payments,
                'shipments' => $shipments,
                'stores' => Store::orderBy('name')->get(['id', 'name']),
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

        Route::get('promotions', function (Request $request) {
            $query = \App\Models\Promotion::query()->with('product:id,name');
            if ($request->filled('q')) {
                $q = $request->string('q')->toString();
                $query->whereHas('product', function ($p) use ($q) {
                    $p->where('name', 'like', "%{$q}%");
                });
            }
            $items = $query->latest()->paginate(20)->withQueryString();
            $products = Product::orderBy('name')->get(['id', 'name']);

            return Inertia::render('admin/promotions/index', [
                'items' => $items->items(),
                'pagination' => [
                    'total' => $items->total(),
                    'per_page' => $items->perPage(),
                    'current_page' => $items->currentPage(),
                    'last_page' => $items->lastPage(),
                ],
                'filters' => [
                    'q' => $request->get('q'),
                ],
                'products' => $products,
            ]);
        })->middleware('permission:promotions.manage|promotions.view');

        Route::post('suppliers', [\App\Http\Controllers\Api\SupplierController::class, 'store'])
            ->middleware('permission:create suppliers');
        Route::put('suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'update'])
            ->middleware('permission:edit suppliers');
        Route::delete('suppliers/{supplier}', [\App\Http\Controllers\Api\SupplierController::class, 'destroy'])
            ->middleware('permission:delete suppliers');

        Route::post('supplier-transactions', [\App\Http\Controllers\Api\SupplierTransactionController::class, 'store'])
            ->middleware('permission:create suppliers');
        Route::put('supplier-transactions/{transaction}', [\App\Http\Controllers\Api\SupplierTransactionController::class, 'update'])
            ->middleware('permission:edit suppliers');
        Route::delete('supplier-transactions/{transaction}', [\App\Http\Controllers\Api\SupplierTransactionController::class, 'destroy'])
            ->middleware('permission:delete suppliers');

        Route::post('supplier-payments', [\App\Http\Controllers\Api\SupplierPaymentController::class, 'store'])
            ->middleware('permission:edit suppliers');

        Route::get('suppliers', function (Request $request) {
            $query = Supplier::query()->with(['stores:id,name', 'transactions.payments:supplier_transaction_id,amount']);

            if ($request->filled('q')) {
                $search = $request->string('q')->toString();
                $query->where(function ($supplierQuery) use ($search) {
                    $supplierQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%")
                        ->orWhere('phone', 'like', "%{$search}%");
                });
            }

            if ($request->filled('category')) {
                $query->where('category', $request->string('category')->toString());
            }

            if ($request->filled('store_id')) {
                $storeId = (int) $request->get('store_id');
                $query->whereHas('stores', fn ($storeQuery) => $storeQuery->where('stores.id', $storeId));
            }

            $suppliers = $query->orderBy('name')->get()->map(function (Supplier $supplier) {
                $outstandingBalance = round($supplier->transactions->sum(fn (SupplierTransaction $transaction) => $transaction->remaining_balance), 2);

                return [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'address' => $supplier->address,
                    'category' => $supplier->category,
                    'created_at' => $supplier->created_at?->toDateString(),
                    'stores' => $supplier->stores->map(fn (Store $store) => [
                        'id' => $store->id,
                        'name' => $store->name,
                    ])->values(),
                    'transactions_count' => $supplier->transactions->count(),
                    'outstanding_balance' => $outstandingBalance,
                ];
            });

            return Inertia::render('admin/suppliers/index', [
                'suppliers' => $suppliers,
                'stores' => Store::orderBy('name')->get(['id', 'name']),
                'categories' => Supplier::CATEGORIES,
                'filters' => [
                    'q' => $request->get('q'),
                    'category' => $request->get('category'),
                    'store_id' => $request->get('store_id'),
                ],
            ]);
        })->middleware('permission:view suppliers');

        Route::get('suppliers/{supplier}', function (Supplier $supplier) {
            $supplier->load([
                'stores:id,name',
                'transactions' => fn ($query) => $query->with(['store:id,name', 'payments:supplier_transaction_id,amount,paid_at,installment_number'])->latest(),
            ]);

            $payments = SupplierPayment::query()
                ->whereHas('transaction', fn ($transactionQuery) => $transactionQuery->where('supplier_id', $supplier->id))
                ->with(['transaction.store:id,name', 'transaction.supplier:id,name'])
                ->orderByDesc('paid_at')
                ->get()
                ->map(fn (SupplierPayment $payment) => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at->toDateString(),
                    'installment_number' => $payment->installment_number,
                    'transaction' => [
                        'id' => $payment->transaction->id,
                        'store' => $payment->transaction->store ? [
                            'id' => $payment->transaction->store->id,
                            'name' => $payment->transaction->store->name,
                        ] : null,
                        'total_installments' => $payment->transaction->total_installments,
                    ],
                ]);

            $transactions = $supplier->transactions->map(fn (SupplierTransaction $transaction) => [
                'id' => $transaction->id,
                'goods_value' => $transaction->goods_value,
                'total_payable' => $transaction->total_payable,
                'payment_duration' => $transaction->payment_duration,
                'installment_amount' => $transaction->installment_amount,
                'total_installments' => $transaction->total_installments,
                'paid_installments' => $transaction->paid_installments,
                'paid_amount' => $transaction->paid_amount,
                'remaining_balance' => $transaction->remaining_balance,
                'next_installment_amount' => $transaction->next_installment_amount,
                'next_installment_due' => $transaction->next_installment_due?->toDateString(),
                'progress_percentage' => $transaction->progress_percentage,
                'status' => $transaction->status,
                'created_at' => $transaction->created_at?->toDateString(),
                'store' => $transaction->store ? [
                    'id' => $transaction->store->id,
                    'name' => $transaction->store->name,
                ] : null,
                'payments' => $transaction->payments->map(fn (SupplierPayment $payment) => [
                    'id' => $payment->id,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at->toDateString(),
                    'installment_number' => $payment->installment_number,
                ])->values(),
            ])->values();

            return Inertia::render('admin/suppliers/show', [
                'supplier' => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'email' => $supplier->email,
                    'phone' => $supplier->phone,
                    'address' => $supplier->address,
                    'category' => $supplier->category,
                    'stores' => $supplier->stores->map(fn (Store $store) => [
                        'id' => $store->id,
                        'name' => $store->name,
                    ])->values(),
                ],
                'summary' => [
                    'transactions_count' => $transactions->count(),
                    'total_payable' => round($transactions->sum('total_payable'), 2),
                    'total_paid' => round($transactions->sum('paid_amount'), 2),
                    'outstanding_balance' => round($transactions->sum('remaining_balance'), 2),
                ],
                'transactions' => $transactions,
                'payments' => $payments,
            ]);
        })->middleware('permission:view suppliers');

        Route::get('supplier-transactions', function (Request $request) {
            $query = SupplierTransaction::query()
                ->with(['supplier:id,name,category', 'supplier.stores:id,name', 'store:id,name', 'payments:supplier_transaction_id,amount']);

            if ($request->filled('q')) {
                $search = $request->string('q')->toString();
                $query->whereHas('supplier', function ($supplierQuery) use ($search) {
                    $supplierQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->filled('supplier_id')) {
                $query->where('supplier_id', (int) $request->get('supplier_id'));
            }

            if ($request->filled('store_id')) {
                $query->where('store_id', (int) $request->get('store_id'));
            }

            if ($request->filled('status')) {
                $query->where('status', $request->string('status')->toString());
            }

            $transactions = $query->orderByDesc('created_at')->get();

            return Inertia::render('admin/suppliers/transactions', [
                'transactions' => $transactions->map(fn (SupplierTransaction $transaction) => [
                    'id' => $transaction->id,
                    'supplier_id' => $transaction->supplier_id,
                    'store_id' => $transaction->store_id,
                    'goods_value' => $transaction->goods_value,
                    'total_payable' => $transaction->total_payable,
                    'payment_duration' => $transaction->payment_duration,
                    'installment_amount' => $transaction->installment_amount,
                    'total_installments' => $transaction->total_installments,
                    'paid_installments' => $transaction->paid_installments,
                    'status' => $transaction->status,
                    'paid_amount' => $transaction->paid_amount,
                    'remaining_balance' => $transaction->remaining_balance,
                    'next_installment_amount' => $transaction->next_installment_amount,
                    'next_installment_due' => $transaction->next_installment_due?->toDateString(),
                    'created_at' => $transaction->created_at?->toDateString(),
                    'supplier' => [
                        'id' => $transaction->supplier->id,
                        'name' => $transaction->supplier->name,
                        'category' => $transaction->supplier->category,
                        'stores' => $transaction->supplier->stores->map(fn (Store $store) => [
                            'id' => $store->id,
                            'name' => $store->name,
                        ])->values(),
                    ],
                    'store' => $transaction->store ? [
                        'id' => $transaction->store->id,
                        'name' => $transaction->store->name,
                    ] : null,
                ])->values(),
                'suppliers' => Supplier::with('stores:id,name')->orderBy('name')->get()->map(fn (Supplier $supplier) => [
                    'id' => $supplier->id,
                    'name' => $supplier->name,
                    'category' => $supplier->category,
                    'stores' => $supplier->stores->map(fn (Store $store) => [
                        'id' => $store->id,
                        'name' => $store->name,
                    ])->values(),
                ]),
                'stores' => Store::orderBy('name')->get(['id', 'name']),
                'filters' => [
                    'q' => $request->get('q'),
                    'supplier_id' => $request->get('supplier_id'),
                    'store_id' => $request->get('store_id'),
                    'status' => $request->get('status'),
                ],
            ]);
        })->middleware('permission:view suppliers');

        Route::get('supplier-payments', function (Request $request) {
            $paymentsQuery = SupplierPayment::query()
                ->with(['transaction.supplier:id,name', 'transaction.store:id,name']);

            if ($request->filled('q')) {
                $search = $request->string('q')->toString();
                $paymentsQuery->whereHas('transaction.supplier', function ($supplierQuery) use ($search) {
                    $supplierQuery->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            }

            if ($request->filled('supplier_id')) {
                $supplierId = (int) $request->get('supplier_id');
                $paymentsQuery->whereHas('transaction', fn ($transactionQuery) => $transactionQuery->where('supplier_id', $supplierId));
            }

            if ($request->filled('store_id')) {
                $storeId = (int) $request->get('store_id');
                $paymentsQuery->whereHas('transaction', fn ($transactionQuery) => $transactionQuery->where('store_id', $storeId));
            }

            $payments = $paymentsQuery->orderByDesc('paid_at')->get();

            $transactions = SupplierTransaction::query()
                ->with(['supplier:id,name,category', 'store:id,name', 'payments:supplier_transaction_id,amount'])
                ->where('status', 'active')
                ->orderByDesc('created_at')
                ->get();

            return Inertia::render('admin/suppliers/payments', [
                'payments' => $payments->map(fn (SupplierPayment $payment) => [
                    'id' => $payment->id,
                    'supplier_transaction_id' => $payment->supplier_transaction_id,
                    'amount' => $payment->amount,
                    'paid_at' => $payment->paid_at->toDateString(),
                    'installment_number' => $payment->installment_number,
                    'transaction' => [
                        'id' => $payment->transaction->id,
                        'paid_installments' => $payment->transaction->paid_installments,
                        'total_installments' => $payment->transaction->total_installments,
                        'remaining_balance' => $payment->transaction->remaining_balance,
                        'store' => $payment->transaction->store ? [
                            'id' => $payment->transaction->store->id,
                            'name' => $payment->transaction->store->name,
                        ] : null,
                        'supplier' => $payment->transaction->supplier,
                    ],
                ])->values(),
                'transactions' => $transactions->map(fn (SupplierTransaction $transaction) => [
                    'id' => $transaction->id,
                    'supplier_id' => $transaction->supplier_id,
                    'store_id' => $transaction->store_id,
                    'goods_value' => $transaction->goods_value,
                    'total_payable' => $transaction->total_payable,
                    'payment_duration' => $transaction->payment_duration,
                    'installment_amount' => $transaction->installment_amount,
                    'total_installments' => $transaction->total_installments,
                    'paid_installments' => $transaction->paid_installments,
                    'status' => $transaction->status,
                    'remaining_balance' => $transaction->remaining_balance,
                    'next_installment_amount' => $transaction->next_installment_amount,
                    'next_installment_due' => $transaction->next_installment_due?->toDateString(),
                    'supplier' => [
                        'id' => $transaction->supplier->id,
                        'name' => $transaction->supplier->name,
                        'category' => $transaction->supplier->category,
                    ],
                    'store' => $transaction->store ? [
                        'id' => $transaction->store->id,
                        'name' => $transaction->store->name,
                    ] : null,
                ])->values(),
                'suppliers' => Supplier::orderBy('name')->get(['id', 'name']),
                'stores' => Store::orderBy('name')->get(['id', 'name']),
                'filters' => [
                    'q' => $request->get('q'),
                    'supplier_id' => $request->get('supplier_id'),
                    'store_id' => $request->get('store_id'),
                ],
            ]);
        })->middleware('permission:view suppliers');

        Route::get('supplier-dashboard', function () {
            $transactions = SupplierTransaction::with(['supplier:id,name', 'store:id,name', 'payments:supplier_transaction_id,amount'])
                ->where('status', 'active')
                ->get();

            $suppliersWithOutstanding = $transactions
                ->filter(fn (SupplierTransaction $transaction) => $transaction->remaining_balance > 0)
                ->groupBy('supplier.name')
                ->map(function ($group, $supplierName) {
                    return [
                        'name' => $supplierName,
                        'outstanding_balance' => round($group->sum(fn (SupplierTransaction $transaction) => $transaction->remaining_balance), 2),
                    ];
                })
                ->sortByDesc('outstanding_balance')
                ->values();

            $now = Carbon::now()->startOfDay();
            $currentWeekStart = $now->copy()->startOfWeek();
            $currentWeekEnd = $now->copy()->endOfWeek();
            $nextWeekStart = $currentWeekStart->copy()->addWeek();
            $nextWeekEnd = $currentWeekEnd->copy()->addWeek();
            $upcomingPayments = $transactions
                ->map(function (SupplierTransaction $transaction) use ($currentWeekEnd, $currentWeekStart, $nextWeekEnd, $nextWeekStart) {
                    $nextDue = $transaction->next_installment_due;
                    if (! $nextDue) {
                        return null;
                    }

                    $dueDate = $nextDue->copy()->startOfDay();
                    $weekLabel = $dueDate->lt($currentWeekStart)
                        ? 'Overdue'
                        : ($dueDate->lte($currentWeekEnd)
                            ? 'This Week'
                            : ($dueDate->between($nextWeekStart, $nextWeekEnd)
                                ? 'Next Week'
                                : 'Week '.($currentWeekStart->diffInWeeks($dueDate->copy()->startOfWeek()) + 1)));

                    return [
                        'supplier_name' => $transaction->supplier->name,
                        'store_name' => $transaction->store?->name,
                        'amount' => $transaction->next_installment_amount,
                        'due_date' => $dueDate->toDateString(),
                        'week_label' => $weekLabel,
                        'is_highlighted' => in_array($weekLabel, ['Overdue', 'This Week', 'Next Week'], true),
                    ];
                })
                ->filter()
                ->sortBy('due_date')
                ->values();

            return Inertia::render('admin/suppliers/dashboard', [
                'suppliersWithOutstanding' => $suppliersWithOutstanding,
                'upcomingPayments' => $upcomingPayments,
                'charts' => [
                    'outstandingBalances' => $suppliersWithOutstanding->map(fn ($item) => [
                        'supplier' => $item['name'],
                        'balance' => $item['outstanding_balance'],
                    ])->toArray(),
                    'paymentProgress' => $transactions->map(fn (SupplierTransaction $transaction) => [
                        'supplier' => $transaction->supplier->name,
                        'progress' => $transaction->progress_percentage,
                        'paid' => $transaction->paid_installments,
                        'total' => $transaction->total_installments,
                    ])->toArray(),
                ],
            ]);
        })->middleware('permission:view suppliers');

        Route::get('shop/dashboard', [\App\Http\Controllers\ShopManagementPageController::class, 'dashboard'])
            ->name('shop.dashboard')
            ->middleware('permission:view shop dashboard');
        Route::get('shop/customers', [\App\Http\Controllers\ShopManagementPageController::class, 'customers'])
            ->name('shop.customers')
            ->middleware('permission:view customers');
        Route::get('shop/sales', [\App\Http\Controllers\ShopManagementPageController::class, 'sales'])
            ->name('shop.sales')
            ->middleware('permission:view sales');
        Route::get('shop/stock', [\App\Http\Controllers\ShopManagementPageController::class, 'stock'])
            ->name('shop.stock')
            ->middleware('permission:view stock');
    });

    Route::prefix('api/shop')->group(function () {
        Route::post('customers', [\App\Http\Controllers\Api\ShopManagementController::class, 'storeCustomer'])
            ->middleware('permission:create customers');
        Route::post('sales', [\App\Http\Controllers\Api\ShopManagementController::class, 'storeSale'])
            ->middleware('permission:create sales');
        Route::post('sales/{sale}/payments', [\App\Http\Controllers\Api\ShopManagementController::class, 'storePayment'])
            ->middleware('permission:edit sales');
        Route::post('stock', [\App\Http\Controllers\Api\ShopManagementController::class, 'storeStock'])
            ->middleware('permission:create stock');
        Route::patch('stock/{stockItem}', [\App\Http\Controllers\Api\ShopManagementController::class, 'updateStock'])
            ->middleware('permission:edit stock');
        Route::delete('stock/{stockItem}', [\App\Http\Controllers\Api\ShopManagementController::class, 'destroyStock'])
            ->middleware('permission:delete stock');
    });
});

Route::get('/test-mail', function () {

    Mail::raw('SMTP Test Email - Chan Trader', function ($message) {
        $message->to('itianzinfo@gmail.com')
            ->from(env('MAIL_FROM_ADDRESS'), env('MAIL_FROM_NAME'))
            ->subject('SMTP Test');
    });

    return 'Email Sent';
});
require __DIR__.'/settings.php';
require __DIR__.'/auth.php';
