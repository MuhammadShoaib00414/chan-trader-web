<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Store;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;

class StoreController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:stores.view')->only(['index', 'show']);
        $this->middleware('permission:stores.manage_staff')->only(['store', 'update']);
        $this->middleware('permission:stores.approve')->only(['approve']);
        $this->middleware('permission:stores.suspend')->only(['suspend']);
    }

    public function index(Request $request)
    {
        $query = Store::query();
        if ($request->filled('status')) {
            $query->where('status', $request->string('status')->toString());
        }
        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where('name', 'like', "%{$q}%");
        }
        $stores = $query->latest()->paginate(20);
        return response()->json(['success' => true, 'data' => $stores->items(), 'pagination' => [
            'total' => $stores->total(),
            'per_page' => $stores->perPage(),
            'current_page' => $stores->currentPage(),
            'last_page' => $stores->lastPage(),
        ]]);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'owner_id' => ['required', 'exists:users,id'],
            'name' => ['required', 'string', 'max:150'],
            'slug' => ['required', 'string', 'max:160', 'unique:stores,slug'],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'logo' => ['nullable', 'string', 'max:255'],
            'banner' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
        ]);
        $store = Store::create($validated);
        return response()->json(['success' => true, 'data' => $store], 201);
    }

    public function show(Store $store)
    {
        return response()->json(['success' => true, 'data' => $store]);
    }

    public function update(Request $request, Store $store)
    {
        $validated = $request->validate([
            'name' => ['sometimes', 'string', 'max:150'],
            'slug' => ['sometimes', 'string', 'max:160', Rule::unique('stores', 'slug')->ignore($store->id)],
            'email' => ['nullable', 'email', 'max:150'],
            'phone' => ['nullable', 'string', 'max:30'],
            'logo' => ['nullable', 'string', 'max:255'],
            'banner' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'status' => ['sometimes', Rule::in(['pending', 'active', 'suspended'])],
        ]);
        $store->update($validated);
        return response()->json(['success' => true, 'data' => $store]);
    }

    public function approve(Store $store)
    {
        $store->update(['status' => 'active', 'verified_at' => now()]);
        return response()->json(['success' => true, 'data' => $store]);
    }

    public function suspend(Store $store)
    {
        $store->update(['status' => 'suspended']);
        return response()->json(['success' => true, 'data' => $store]);
    }
}
