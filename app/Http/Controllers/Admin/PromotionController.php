<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Promotion;
use Illuminate\Http\Request;

class PromotionController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:promotions.manage')->only(['index', 'store', 'show', 'update', 'destroy']);
    }

    public function index(Request $request)
    {
        $query = Promotion::query()->with('product:id,name');

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->whereHas('product', function ($p) use ($q) {
                $p->where('name', 'like', "%{$q}%");
            });
        }

        $items = $query->latest()->paginate(20);

        return response()->json([
            'success' => true,
            'data' => $items->items(),
            'pagination' => [
                'total' => $items->total(),
                'per_page' => $items->perPage(),
                'current_page' => $items->currentPage(),
                'last_page' => $items->lastPage(),
            ],
        ]);
    }

    public function store(Request $request)
    {
        $rules = [
            'product_id' => ['required', 'exists:products,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'button_text' => ['nullable', 'string', 'max:255'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_datetime' => ['nullable', 'date'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'order_number' => ['integer', 'min:0'],
            'text_color' => ['nullable', 'string', 'max:50'],
            'background_color' => ['nullable', 'string', 'max:50'],
            'device_type' => ['in:web,mobile'],
        ];
        $rules['image'] = $request->hasFile('image')
            ? ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:4096']
            : ['nullable', 'string', 'max:255'];

        $validated = $request->validate($rules);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('promotion-images', 'public');
        }

        $promotion = Promotion::create($validated);

        return response()->json(['success' => true, 'message' => 'Promotion created.', 'data' => $promotion], 201);
    }

    public function show(Promotion $promotion)
    {
        $promotion->load('product:id,name');

        return response()->json(['success' => true, 'data' => $promotion]);
    }

    public function update(Request $request, Promotion $promotion)
    {
        $rules = [
            'product_id' => ['sometimes', 'exists:products,id'],
            'name' => ['nullable', 'string', 'max:255'],
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'button_text' => ['nullable', 'string', 'max:255'],
            'button_link' => ['nullable', 'string', 'max:255'],
            'is_active' => ['boolean'],
            'start_date' => ['nullable', 'date'],
            'end_date' => ['nullable', 'date', 'after_or_equal:start_date'],
            'start_datetime' => ['nullable', 'date'],
            'end_datetime' => ['nullable', 'date', 'after_or_equal:start_datetime'],
            'order_number' => ['integer', 'min:0'],
            'text_color' => ['nullable', 'string', 'max:50'],
            'background_color' => ['nullable', 'string', 'max:50'],
            'device_type' => ['in:web,mobile'],
        ];
        $rules['image'] = $request->hasFile('image')
            ? ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:4096']
            : ['nullable', 'string', 'max:255'];

        $validated = $request->validate($rules);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('promotion-images', 'public');
        }

        $promotion->update($validated);

        return response()->json(['success' => true, 'message' => 'Promotion updated.', 'data' => $promotion]);
    }

    public function destroy(Promotion $promotion)
    {
        $promotion->delete();

        return response()->json(['success' => true, 'message' => 'Promotion deleted.']);
    }
}

