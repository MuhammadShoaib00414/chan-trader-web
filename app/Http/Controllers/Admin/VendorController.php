<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use App\Support\ResizedImageStore;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Http\UploadedFile;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class VendorController extends Controller
{
    /**
     * Vendors list for super-admin (Inertia).
     */
    public function index(): Response
    {
        abort_unless(auth()->user()?->hasRole('super-admin'), 403);

        return Inertia::render('admin/vendors/index', [
            'vendors' => $this->vendorListItems(),
        ]);
    }

    /**
     * Vendors list JSON (Passport / API clients).
     *
     * @group Admin — Vendors
     *
     * @authenticated
     */
    public function indexJson(): JsonResponse
    {
        abort_unless(auth()->user()?->hasRole('super-admin'), 403);

        return response()->json([
            'success' => true,
            'data' => [
                'vendors' => $this->vendorListItems(),
            ],
        ]);
    }

    /**
     * Create a new vendor (user + store).
     * Only accessible to Super Admin via role middleware.
     *
     * @group Admin — Vendors
     *
     * @bodyParam first_name string required
     * @bodyParam last_name string required
     * @bodyParam email string required
     * @bodyParam password string required
     * @bodyParam password_confirmation string required
     * @bodyParam store_name string required
     * @bodyParam shop_name string optional
     * @bodyParam phone_number string optional
     * @bodyParam business_whatsapp_url string optional Full HTTPS URL (e.g. WhatsApp chat link).
     * @bodyParam city_district string optional
     * @bodyParam address string optional
     * @bodyParam status int optional 0 or 1
     * @bodyParam store_slug string optional Unique store slug
     *
     * @authenticated
     */
    public function store(Request $request): JsonResponse
    {
        $request->merge([
            'business_whatsapp_url' => $request->filled('business_whatsapp_url') ? $request->string('business_whatsapp_url')->toString() : null,
        ]);

        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'store_name' => ['required', 'string', 'max:150'],
            'shop_name' => ['nullable', 'string', 'max:150'],
            'phone_number' => ['nullable', 'string', 'max:30'],
            'business_whatsapp_url' => ['nullable', 'string', 'max:500', 'url'],
            'city_district' => ['nullable', 'string', 'max:150'],
            'address' => ['nullable', 'string', 'max:255'],
            'status' => ['nullable', 'integer', 'in:0,1'],
            'store_slug' => ['nullable', 'string', 'max:160', 'unique:stores,slug'],
            'logo' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'banner' => ['nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
        ]);

        $vendor = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => $validated['status'] ?? User::STATUS_ACTIVE,
            'phone_number' => $validated['phone_number'] ?? null,
            'shop_name' => $validated['shop_name'] ?? $validated['store_name'],
            'city_district' => $validated['city_district'] ?? null,
            'address' => $validated['address'] ?? null,
            'email_verified_at' => now(),
        ]);
        $vendor->assignRole('vendor');

        $slug = $validated['store_slug'] ?? Str::slug($validated['store_name']);
        $store = Store::create([
            'owner_id' => $vendor->id,
            'name' => $validated['store_name'],
            'slug' => $slug,
            'email' => $validated['email'],
            'phone' => $validated['phone_number'] ?? null,
            'business_whatsapp_url' => $validated['business_whatsapp_url'] ?? null,
            'city' => $validated['city_district'] ?? null,
            'address' => $validated['address'] ?? null,
            'status' => 'active',
        ]);

        $this->syncStoreImages($request, $store);

        return response()->json([
            'success' => true,
            'message' => 'Vendor created successfully',
            'data' => [
                'vendor' => [
                    'id' => $vendor->id,
                    'name' => trim($vendor->first_name.' '.$vendor->last_name),
                    'email' => $vendor->email,
                    'phone_number' => $vendor->phone_number,
                ],
                'store' => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'slug' => $store->slug,
                    'business_whatsapp_url' => $store->business_whatsapp_url,
                ],
            ],
        ], 201);
    }

    /**
     * Update a vendor user and their primary store (oldest store by id).
     *
     * @group Admin — Vendors
     *
     * @bodyParam first_name string optional
     * @bodyParam last_name string optional
     * @bodyParam email string optional
     * @bodyParam phone_number string optional
     * @bodyParam shop_name string optional
     * @bodyParam city_district string optional
     * @bodyParam address string optional
     * @bodyParam status int optional 0 or 1
     * @bodyParam store_name string optional Updates the primary store display name
     * @bodyParam business_whatsapp_url string optional Full HTTPS URL for business WhatsApp
     *
     * @authenticated
     */
    public function update(Request $request, User $vendor): JsonResponse
    {
        abort_unless(auth()->user()?->hasRole('super-admin'), 403);
        abort_unless($vendor->hasRole('vendor'), 404);

        if ($request->has('business_whatsapp_url')) {
            $request->merge([
                'business_whatsapp_url' => $request->string('business_whatsapp_url')->trim()->toString() ?: null,
            ]);
        }

        $validated = $request->validate([
            'first_name' => ['sometimes', 'string', 'max:255'],
            'last_name' => ['sometimes', 'string', 'max:255'],
            'email' => ['sometimes', 'email', Rule::unique('users', 'email')->ignore($vendor->id)],
            'phone_number' => ['sometimes', 'nullable', 'string', 'max:30'],
            'shop_name' => ['sometimes', 'nullable', 'string', 'max:150'],
            'city_district' => ['sometimes', 'nullable', 'string', 'max:150'],
            'address' => ['sometimes', 'nullable', 'string', 'max:255'],
            'status' => ['sometimes', 'integer', 'in:0,1'],
            'store_name' => ['sometimes', 'string', 'max:150'],
            'business_whatsapp_url' => ['sometimes', 'nullable', 'string', 'max:500', 'url'],
            'logo' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'banner' => ['sometimes', 'nullable', 'file', 'mimes:jpg,jpeg,png,webp,gif', 'max:5120'],
            'remove_logo' => ['sometimes', 'boolean'],
            'remove_banner' => ['sometimes', 'boolean'],
        ]);

        $userKeys = ['first_name', 'last_name', 'email', 'phone_number', 'shop_name', 'city_district', 'address', 'status'];
        $userData = array_intersect_key($validated, array_flip($userKeys));

        if ($userData !== []) {
            $vendor->update($userData);
        }

        $store = Store::where('owner_id', $vendor->id)->orderBy('id')->first();
        if ($store) {
            $storeData = [];
            if (isset($validated['store_name'])) {
                $storeData['name'] = $validated['store_name'];
            }
            if (array_key_exists('email', $validated)) {
                $storeData['email'] = $validated['email'];
            }
            if (array_key_exists('business_whatsapp_url', $validated)) {
                $storeData['business_whatsapp_url'] = $validated['business_whatsapp_url'];
            }
            if (array_key_exists('phone_number', $validated)) {
                $storeData['phone'] = $validated['phone_number'];
            }
            if (array_key_exists('city_district', $validated)) {
                $storeData['city'] = $validated['city_district'];
            }
            if (array_key_exists('address', $validated)) {
                $storeData['address'] = $validated['address'];
            }
            if ($storeData !== []) {
                $store->update($storeData);
            }

            $this->syncStoreImages($request, $store);
        }

        $vendor->refresh();

        return response()->json([
            'success' => true,
            'message' => 'Vendor updated successfully',
            'data' => [
                'vendor' => $this->vendorListItemsForUser($vendor),
            ],
        ]);
    }

    /**
     * @return list<array<string, mixed>>
     */
    private function vendorListItems(): array
    {
        return User::role('vendor')
            ->orderBy('first_name')
            ->get()
            ->map(fn (User $v) => $this->vendorListItemsForUser($v))
            ->all();
    }

    /**
     * @return array<string, mixed>
     */
    private function vendorListItemsForUser(User $v): array
    {
        $store = Store::where('owner_id', $v->id)->orderBy('id')->first([
            'id', 'name', 'slug', 'status', 'business_whatsapp_url', 'logo', 'banner',
        ]);

        return [
            'id' => $v->id,
            'name' => trim($v->first_name.' '.$v->last_name),
            'email' => $v->email,
            'phone_number' => $v->phone_number,
            'status' => $v->status,
            'shop_name' => $v->shop_name,
            'city_district' => $v->city_district,
            'address' => $v->address,
            'store' => $store ? [
                'id' => $store->id,
                'name' => $store->name,
                'slug' => $store->slug,
                'status' => $store->status,
                'business_whatsapp_url' => $store->business_whatsapp_url,
                'logo' => $store->logo,
                'banner' => $store->banner,
            ] : null,
        ];
    }

    private function syncStoreImages(Request $request, Store $store): void
    {
        $updates = [];

        if ($request->boolean('remove_logo') && $store->logo) {
            ResizedImageStore::deletePublicPath($store->logo);
            $updates['logo'] = null;
        }

        if ($request->boolean('remove_banner') && $store->banner) {
            ResizedImageStore::deletePublicPath($store->banner);
            $updates['banner'] = null;
        }

        if ($request->hasFile('logo')) {
            if ($store->logo) {
                ResizedImageStore::deletePublicPath($store->logo);
            }
            $updates['logo'] = $this->storeImage($request->file('logo'), $store, 'logo');
        }

        if ($request->hasFile('banner')) {
            if ($store->banner) {
                ResizedImageStore::deletePublicPath($store->banner);
            }
            $updates['banner'] = $this->storeImage($request->file('banner'), $store, 'banner');
        }

        if ($updates !== []) {
            $store->update($updates);
        }
    }

    private function storeImage(UploadedFile $file, Store $store, string $type): string
    {
        [$width, $height] = $type === 'logo' ? [400, 400] : [1200, 400];
        $path = ResizedImageStore::store(
            $file,
            "stores/{$store->id}/{$type}",
            'public',
            $width,
            $height,
        );

        return ResizedImageStore::publicUrl($path);
    }
}
