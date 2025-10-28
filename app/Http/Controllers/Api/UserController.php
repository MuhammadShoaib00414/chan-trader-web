<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use App\Http\Resources\UserResource;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class UserController extends AppBaseController
{
    /**
     * Get authenticated user
     *
     * @group User
     *
     * Get the currently authenticated user's information.
     *
     * @response 200 scenario="success" {
     *   "success": true,
     *   "message": "User profile retrieved successfully",
     *   "data": {
     *     "user": {
     *       "id": 1,
     *       "full_name": "John Doe",
     *       "first_name": "John",
     *       "last_name": "Doe",
     *       "email": "john@example.com",
     *       "pending_email": "john@example.com",
     *       "avatar": "http://localhost/storage/avatars/example.jpg",
     *       "email_verified_at": "2024-01-01T00:00:00.000000Z",
     *       "created_at": "2024-01-01T00:00:00.000000Z",
     *       "updated_at": "2024-01-01T00:00:00.000000Z"
     *     }
     *   }
     * }
     * @response 401 scenario="unauthenticated" {
     *   "message": "Unauthenticated."
     * }
     *
     * @authenticated
     */
    public function me(Request $request): JsonResponse
    {
        return $this->successResponse([
            'user' => new UserResource($request->user()),
        ], 'User profile retrieved successfully');
    }
}
