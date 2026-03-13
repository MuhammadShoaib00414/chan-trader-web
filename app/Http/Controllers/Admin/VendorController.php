<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class VendorController extends Controller
{
    /**
     * Create a new vendor (user + store).
     * Only accessible to Super Admin via role middleware.
     */
    public function store(Request $request)
    {
        $validated = $request->validate([
            'first_name' => ['required', 'string', 'max:255'],
            'last_name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
            'password' => ['required', 'string', 'min:8', 'confirmed'],
            'store_name' => ['required', 'string', 'max:150'],
            'store_slug' => ['nullable', 'string', 'max:160', 'unique:stores,slug'],
        ]);

        $vendor = User::create([
            'first_name' => $validated['first_name'],
            'last_name' => $validated['last_name'],
            'email' => $validated['email'],
            'password' => Hash::make($validated['password']),
            'status' => User::STATUS_ACTIVE,
            'email_verified_at' => now(),
        ]);
        $vendor->assignRole('vendor');

        $slug = $validated['store_slug'] ?? Str::slug($validated['store_name']);
        $store = Store::create([
            'owner_id' => $vendor->id,
            'name' => $validated['store_name'],
            'slug' => $slug,
            'status' => 'active',
        ]);

        return response()->json([
            'success' => true,
            'message' => 'Vendor created successfully',
            'data' => [
                'vendor' => [
                    'id' => $vendor->id,
                    'name' => trim($vendor->first_name . ' ' . $vendor->last_name),
                    'email' => $vendor->email,
                ],
                'store' => [
                    'id' => $store->id,
                    'name' => $store->name,
                    'slug' => $store->slug,
                ],
            ],
        ], 201);
    }
}
