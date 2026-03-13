<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Auth\Events\Registered;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\Rules;
use Inertia\Inertia;
use Inertia\Response;

class RegisteredUserController extends Controller
{
    /**
     * Show the registration page.
     */
    public function create(): Response
    {
        return Inertia::render('auth/register');
    }

    /**
     * Handle an incoming registration request.
     *
     * @throws \Illuminate\Validation\ValidationException
     */
    public function store(Request $request): RedirectResponse
    {
        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone_number' => ['required', 'regex:/^03\d{9}$/'],
            'shop_name' => 'required|string|max:255',
            'city_district' => 'required|string|max:255',
            'address' => 'required|string',
        ]);

        // split full name into first/last
        $parts = preg_split('/\s+/', trim($request->name), 2);
        $first = $parts[0] ?? '';
        $last = $parts[1] ?? '';

        $user = User::create([
            'first_name' => $first,
            'last_name' => $last,
            'email' => $request->email,
            'password' => Hash::make($request->password),
            'phone_number' => $request->phone_number,
            'shop_name' => $request->shop_name,
            'city_district' => $request->city_district,
            'address' => $request->address,
        ]);

        // set default role for web registration as well
        $user->assignRole('user');

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
