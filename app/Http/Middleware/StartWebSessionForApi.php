<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * Enables Laravel web session cookies on selected API routes so the admin
 * dashboard (Inertia) can authenticate via session while mobile keeps Bearer auth.
 */
class StartWebSessionForApi
{
    /** @var array<int, class-string> */
    private array $sessionMiddleware = [
        \Illuminate\Cookie\Middleware\EncryptCookies::class,
        \Illuminate\Cookie\Middleware\AddQueuedCookiesToResponse::class,
        \Illuminate\Session\Middleware\StartSession::class,
    ];

    public function handle(Request $request, Closure $next): Response
    {
        $pipeline = array_reduce(
            array_reverse($this->sessionMiddleware),
            fn ($next, $middleware) => fn ($request) => app($middleware)->handle($request, $next),
            $next
        );

        return $pipeline($request);
    }
}
