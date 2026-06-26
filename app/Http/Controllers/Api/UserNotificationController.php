<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\AppBaseController;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group User Notifications
 */
class UserNotificationController extends AppBaseController
{
    /**
     * List notifications for the authenticated user.
     *
     * @authenticated
     *
     * @queryParam unread_only boolean Return only unread notifications. Example: true
     * @queryParam per_page integer Items per page (default 20). Example: 20
     *
     * @response 200 {
     *   "success": true,
     *   "message": "Notifications retrieved",
     *   "data": {
     *     "unread_count": 3,
     *     "items": [
     *       {
     *         "id": 1,
     *         "type": "order_placed",
     *         "title": "Order placed",
     *         "body": "Your order ORD-XYZ has been placed successfully.",
     *         "data": {"order_code": "ORD-XYZ"},
     *         "read_at": null,
     *         "created_at": "2026-05-25T10:00:00.000000Z"
     *       }
     *     ],
     *     "pagination": {"total": 10, "per_page": 20, "current_page": 1, "last_page": 1}
     *   }
     * }
     */
    public function index(Request $request): JsonResponse
    {
        $user = $request->user('api');
        $perPage = min((int) $request->get('per_page', 20), 50);

        $query = $user->appNotifications()->latest();

        if ($request->boolean('unread_only')) {
            $query->whereNull('read_at');
        }

        $notifications = $query->paginate($perPage);
        $unreadCount = $user->appNotifications()->whereNull('read_at')->count();

        return $this->successResponse([
            'unread_count' => $unreadCount,
            'items' => $notifications->getCollection()->map(fn ($n) => [
                'id' => $n->id,
                'type' => $n->type,
                'title' => $n->title,
                'body' => $n->body,
                'data' => $n->data,
                'read_at' => $n->read_at,
                'created_at' => $n->created_at,
            ]),
            'pagination' => [
                'total' => $notifications->total(),
                'per_page' => $notifications->perPage(),
                'current_page' => $notifications->currentPage(),
                'last_page' => $notifications->lastPage(),
            ],
        ], 'Notifications retrieved');
    }

    /**
     * Mark a single notification as read.
     *
     * @authenticated
     *
     * @urlParam id integer required Notification ID. Example: 1
     *
     * @response 200 {"success": true, "message": "Notification marked as read", "data": null}
     */
    public function markRead(Request $request, int $id): JsonResponse
    {
        $notification = $request->user('api')->appNotifications()->findOrFail($id);
        $notification->markAsRead();

        return $this->successResponse(null, 'Notification marked as read');
    }

    /**
     * Mark all notifications as read.
     *
     * @authenticated
     *
     * @response 200 {"success": true, "message": "All notifications marked as read", "data": null}
     */
    public function markAllRead(Request $request): JsonResponse
    {
        $request->user('api')
            ->appNotifications()
            ->whereNull('read_at')
            ->update(['read_at' => now()]);

        return $this->successResponse(null, 'All notifications marked as read');
    }

    /**
     * Delete a notification.
     *
     * @authenticated
     *
     * @urlParam id integer required Notification ID. Example: 1
     *
     * @response 200 {"success": true, "message": "Notification deleted", "data": null}
     */
    public function destroy(Request $request, int $id): JsonResponse
    {
        $notification = $request->user('api')->appNotifications()->findOrFail($id);
        $notification->delete();

        return $this->successResponse(null, 'Notification deleted');
    }
}
