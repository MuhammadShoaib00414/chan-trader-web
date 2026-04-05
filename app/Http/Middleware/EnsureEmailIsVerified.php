<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Redirect;
use Illuminate\Support\Facades\URL;
use Symfony\Component\HttpFoundation\Response;

/**
 * Same behavior as Laravel's EnsureEmailIsVerified, but uses HTTP 303 for HTML redirects.
 *
 * Inertia (and fetch) may follow 302 while keeping the original method (e.g. PATCH), which
 * hits GET-only routes like verify-email and triggers MethodNotAllowedHttpException.
 * 303 requires the follow-up request to use GET.
 */
class EnsureEmailIsVerified
{
    public function handle(Request $request, Closure $next, ?string $redirectToRoute = null): Response
    {
        if (! $request->user() ||
            ($request->user() instanceof MustVerifyEmail &&
            ! $request->user()->hasVerifiedEmail())) {
            return $request->expectsJson()
                ? abort(403, 'Your email address is not verified.')
                : Redirect::guest(URL::route($redirectToRoute ?: 'verification.notice'), 303);
        }

        return $next($request);
    }
}
