<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Http\Resources\UserResource;
use App\Traits\OtpTrait;
use Spatie\Permission\Models\Role;
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
    use OtpTrait;
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
    public function store(Request $request): RedirectResponse|\Illuminate\Http\JsonResponse
    {
        if ($request->expectsJson()) {
            $validated = $request->validate([
                'full_name' => 'required|string|min:3|max:255',
                'email' => 'required|email|max:255|unique:users,email',
                'phone_number' => ['required', 'regex:/^03\d{9}$/', 'unique:users,phone_number'],
                'password' => ['required', 'confirmed', Rules\Password::defaults()],
                'city_district' => 'required|string|max:255',
                'address' => 'required|string',
                'avatar' => 'nullable|image|mimes:jpeg,png,jpg,gif|max:1024',
            ]);

            $parts = preg_split('/\\s+/', trim($validated['full_name']), 2);
            $first = $parts[0] ?? '';
            $last = $parts[1] ?? '';

            $userData = [
                'first_name' => $first,
                'last_name' => $last,
                'email' => mb_strtolower($validated['email']),
                'password' => Hash::make($validated['password']),
                'status' => User::STATUS_INACTIVE,
                'phone_number' => $validated['phone_number'],
                'shop_name' => $request->input('shop_name'),
                'city_district' => $validated['city_district'],
                'address' => $validated['address'],
            ];
            if ($request->hasFile('avatar')) {
                $userData['avatar'] = $request->file('avatar')->store('avatars', 'public');
            }

            $user = User::create($userData);
            Role::firstOrCreate(['name' => 'user']);
            $user->assignRole('user');

            $otp = $this->generateAndSaveOTP($user, 'verification');

            return response()->json([
                'success' => true,
                'message' => 'OTP has been sent. Please check your email to verify your account.',
                'data' => [
                    'user' => new UserResource($user->load('roles.permissions')),
                    'otp' => $otp,
                ],
            ]);
        }

        $request->validate([
            'name' => 'required|string|max:255',
            'email' => 'required|string|lowercase|email|max:255|unique:'.User::class,
            'password' => ['required', 'confirmed', Rules\Password::defaults()],
            'phone_number' => ['required', 'regex:/^03\\d{9}$/'],
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
        Role::firstOrCreate(['name' => 'user']);
        $user->assignRole('user');

        event(new Registered($user));

        Auth::login($user);

        $request->session()->regenerate();

        return redirect()->intended(route('dashboard', absolute: false));
    }
}
