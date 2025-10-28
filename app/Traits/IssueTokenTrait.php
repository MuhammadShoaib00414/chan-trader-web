<?php

namespace App\Traits;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

trait IssueTokenTrait
{
    public function issueToken(Request $request, $scope = '*')
    {
        $tokenRequest = Request::create('/oauth/token', 'POST', [
            'grant_type' => $request->grant_type,
            'client_id' => $request->client_id,
            'client_secret' => $request->client_secret,
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
