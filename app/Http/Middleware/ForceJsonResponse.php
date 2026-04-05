<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Mobile clients often send a broad Accept header (any type) so Laravel treats
 * the request like a browser (HTML redirects on validation errors).
 * API routes should always get JSON responses (422, 401, etc.).
 */
class ForceJsonResponse
{
    public function handle(Request $request, Closure $next): Response
    {
        $request->headers->set('Accept', 'application/json');

        return $next($request);
    }
}
