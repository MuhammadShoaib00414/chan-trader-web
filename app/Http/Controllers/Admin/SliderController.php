<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Slider;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class SliderController extends Controller
{
    public function __construct()
    {
        $this->middleware('permission:sliders.manage');
    }

    public function index(Request $request)
    {
        $query = Slider::query();

        if ($request->filled('q')) {
            $q = $request->string('q')->toString();
            $query->where(function ($sub) use ($q) {
                $sub->where('title', 'like', "%{$q}%")
                    ->orWhere('subtitle', 'like', "%{$q}%");
            });
        }

        if ($request->filled('status')) {
            $query->where('is_active', $request->get('status') === 'active');
        }

        $items = $query->orderBy('display_order')->orderBy('id')->paginate(20);

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
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_url' => ['nullable', 'string', 'max:500'],
            'display_order' => ['integer', 'min:0', 'max:9999'],
            'is_active' => ['boolean'],
        ];

        $rules['image'] = $request->hasFile('image')
            ? ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:5120']
            : ['nullable', 'string', 'max:500'];

        $validated = $request->validate($rules);

        if ($request->hasFile('image')) {
            $validated['image'] = $request->file('image')->store('slider-images', 'public');
        }

        $slider = Slider::create($validated);

        return response()->json(['success' => true, 'message' => 'Slider created.', 'data' => $slider], 201);
    }

    public function show(Slider $slider)
    {
        return response()->json(['success' => true, 'data' => $slider]);
    }

    public function update(Request $request, Slider $slider)
    {
        $rules = [
            'title' => ['nullable', 'string', 'max:255'],
            'subtitle' => ['nullable', 'string', 'max:255'],
            'button_text' => ['nullable', 'string', 'max:100'],
            'button_url' => ['nullable', 'string', 'max:500'],
            'display_order' => ['integer', 'min:0', 'max:9999'],
            'is_active' => ['boolean'],
        ];

        $rules['image'] = $request->hasFile('image')
            ? ['nullable', 'file', 'mimes:png,jpg,jpeg,webp,svg', 'max:5120']
            : ['nullable', 'string', 'max:500'];

        $validated = $request->validate($rules);

        if ($request->hasFile('image')) {
            if ($slider->image) {
                Storage::disk('public')->delete($slider->image);
            }
            $validated['image'] = $request->file('image')->store('slider-images', 'public');
        }

        $slider->update($validated);

        return response()->json(['success' => true, 'message' => 'Slider updated.', 'data' => $slider]);
    }

    public function destroy(Slider $slider)
    {
        if ($slider->image) {
            Storage::disk('public')->delete($slider->image);
        }

        $slider->delete();

        return response()->json(['success' => true, 'message' => 'Slider deleted.']);
    }

    public function toggleStatus(Slider $slider)
    {
        $slider->update(['is_active' => ! $slider->is_active]);

        return response()->json([
            'success' => true,
            'message' => 'Status updated.',
            'data' => ['is_active' => $slider->is_active],
        ]);
    }
}
