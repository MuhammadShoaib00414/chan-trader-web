<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

trait IssueTokenTrait
{
    public function issueToken(Request $request, $scope = '*')
    {
        // use provided credentials or fall back to environment/config values
        $clientId = $request->client_id ?? config('passport.password_grant_client_id');
        $clientSecret = $request->client_secret ?? config('passport.password_grant_client_secret');

        $tokenRequest = Request::create('/oauth/token', 'POST', [
            'grant_type' => $request->grant_type,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'username' => $request->username ?? $request->email,
            'password' => $request->password,
            'scope' => $request->grant_type === 'refresh_token' ? null : $scope,
            'refresh_token' => $request->refresh_token ?? null,
        ], [], [], [
            'HTTP_Accept' => 'application/json',
        ]);

        $response = app()->handle($tokenRequest);
        $tokenResponse = json_decode($response->getContent(), true);

        if ($response->getStatusCode() !== 200) {
            Log::error('Token generation failed with non-200 status', [
                'status_code' => $response->getStatusCode(),
                'response' => $tokenResponse,
            ]);
            throw new \Exception('Failed to generate token: '.$response->getContent());
        }

        return $tokenResponse;
    }
}
