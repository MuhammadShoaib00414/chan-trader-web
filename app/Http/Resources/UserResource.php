<?php

namespace App\Http\Resources;

use Illuminate\Http\Request;
use Illuminate\Http\Resources\Json\JsonResource;

class UserResource extends JsonResource
{
    /**
     * Transform the resource into an array.
     *
     * @return array<string, mixed>
     */
    public function toArray(Request $request): array
    {
        return [
            'id' => $this->id,
            'first_name' => $this->first_name,
            'last_name' => $this->last_name,
            'name' => $this->name,
            'email' => $this->email,
            'pending_email' => $this->pending_email,
            'avatar' => $this->avatar ? asset('storage/'.$this->avatar) : null,
            'google_id' => $this->google_id,
            'apple_id' => $this->apple_id,
            'social_provider' => $this->social_provider,
            'status' => $this->status,
            'email_verified_at' => $this->email_verified_at,
            'roles' => $this->whenLoaded('roles', function () {
                return $this->roles->map(function ($role) {
                    return [
                        'id' => $role->id,
                        'name' => $role->name,
                        'permissions' => $role->permissions->pluck('name'),
                    ];
                });
            }),
            'permissions' => $this->whenLoaded('roles', function () {
                return $this->getAllPermissions()->pluck('name');
            }),
            'created_at' => $this->created_at,
            'updated_at' => $this->updated_at,
        ];
    }
}
