<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

trait IssueTokenTrait
{
    public function issueToken(Request $request, $scope = '*')
    {
        $clientId = config('passport.password_grant_client_id');
        $clientSecret = config('passport.password_grant_client_secret');
        $grantType = $request->grant_type ?: 'password';

        if (! $clientId || ! $clientSecret) {
            Log::error('OAuth client credentials missing in config(passport.*).');
            throw new \Exception('OAuth client credentials are not configured on the server.');
        }

        $tokenRequest = Request::create('/oauth/token', 'POST', [
            'grant_type' => $grantType,
            'client_id' => $clientId,
            'client_secret' => $clientSecret,
            'username' => $request->username ?? $request->email,
            'password' => $request->password,
            'scope' => $grantType === 'refresh_token' ? null : $scope,
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
