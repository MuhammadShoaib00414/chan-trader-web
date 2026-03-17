<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class CheckPermission
{
    /**
     * Handle an incoming request.
     *
     * @param  \Closure(\Illuminate\Http\Request): (\Symfony\Component\HttpFoundation\Response)  $next
     */
    public function handle(Request $request, Closure $next, string $permission): Response
    {
        $permissions = array_filter(array_map('trim', explode('|', $permission)));
        if ($permissions === []) {
            abort(403, 'Unauthorized action.');
        }

        $user = $request->user();
        $authorized = $user !== null && collect($permissions)->some(fn (string $p) => $user->hasPermissionTo($p));

        if (! $authorized) {
            abort(403, 'Unauthorized action.');
        }

        return $next($request);
    }
}
