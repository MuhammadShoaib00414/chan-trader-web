<?php

namespace App\Http\Controllers\Api;

use App\Enums\NotificationAction;
use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\SendNotificationRequest;
use App\Models\User;
use App\Services\Notifications\AppNotificationService;
use Illuminate\Http\JsonResponse;

class NotificationController extends AppBaseController
{
    public function __construct(
        private AppNotificationService $notifications,
    ) {}

    /**
     * List available notification actions.
     *
     * @group Notifications
     *
     * @authenticated
     */
    public function actions(): JsonResponse
    {
        $actions = collect(NotificationAction::all())->map(fn (NotificationAction $action) => [
            'value' => $action->value,
            'label' => $action->label(),
            'supports_email' => $action->supportsEmail(),
            'supports_push' => $action->supportsPush(),
        ]);

        return $this->successResponse($actions, 'Notification actions retrieved');
    }

    /**
     * Send email and/or push notification for an app action.
     *
     * @group Notifications
     *
     * @bodyParam user_id int required Target user ID. Example: 1
     * @bodyParam action string required Notification action key. Example: order_placed
     * @bodyParam payload object optional Extra data (order_code, status, message, otp, etc.)
     * @bodyParam channels array optional Channels to use: email, push. Example: ["email","push"]
     *
     * @authenticated
     */
    public function send(SendNotificationRequest $request): JsonResponse
    {
        $validated = $request->validated();
        $user = User::query()->findOrFail($validated['user_id']);
        $action = NotificationAction::from($validated['action']);
        $channels = $validated['channels'] ?? ['email', 'push'];

        $result = $this->notifications->notify(
            $user,
            $action,
            $validated['payload'] ?? [],
            in_array('email', $channels, true),
            in_array('push', $channels, true),
        );

        return $this->successResponse([
            'channels' => $result,
            'action' => $action->value,
            'user_id' => $user->id,
        ], 'Notification dispatched');
    }
}
