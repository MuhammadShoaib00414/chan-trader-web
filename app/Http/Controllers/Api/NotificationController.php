<?php

namespace App\Http\Controllers\Api;

use App\Enums\NotificationAction;
use App\Http\Controllers\AppBaseController;
use App\Http\Requests\Api\SendNotificationRequest;
use App\Http\Requests\Api\SendTokenNotificationRequest;
use App\Models\User;
use App\Services\Notifications\AppNotificationService;
use App\Services\Notifications\PushNotificationService;
use Illuminate\Http\JsonResponse;

class NotificationController extends AppBaseController
{
    public function __construct(
        private AppNotificationService $notifications,
        private PushNotificationService $push,
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

    /**
     * Send a push notification directly to an FCM device token.
     *
     * @group Notifications
     *
     * @bodyParam token string required FCM device token. Example: ddsYPs1PTY...
     * @bodyParam title string required Notification title. Example: Hello
     * @bodyParam body string required Notification body. Example: Test message
     * @bodyParam data object optional Key-value string pairs attached to the message.
     *
     * @authenticated
     */
    public function sendToToken(SendTokenNotificationRequest $request): JsonResponse
    {
        $validated = $request->validated();

        $sent = $this->push->sendRaw(
            $validated['token'],
            $validated['title'],
            $validated['body'],
            $validated['data'] ?? [],
        );

        return $this->successResponse([
            'sent'  => $sent,
            'token' => $validated['token'],
        ], $sent ? 'Push notification sent' : 'Push notification failed (check FCM config)');
    }
}
