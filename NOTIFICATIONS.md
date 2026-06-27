# Notifications & Emails Documentation

## Overview

The notification system dispatches **in-app notifications** (stored in `app_notifications` DB table), **push notifications** (Firebase Cloud Messaging), and **emails** (queued via Laravel Mail) from a single call to `AppNotificationService::notify()`.

---

## Database Table: `app_notifications`

| Column     | Type      | Description                          |
|------------|-----------|--------------------------------------|
| id         | bigint    | Primary key                          |
| user_id    | bigint FK | Target user                          |
| type       | string    | `NotificationAction` enum value      |
| title      | string    | Short push/in-app title              |
| body       | text      | Full notification body               |
| data       | JSON      | Extra scalar payload (order_code, …) |
| read_at    | timestamp | Null = unread                        |
| created_at | timestamp |                                      |
| updated_at | timestamp |                                      |

---

## Notification Channels

| Channel       | Mechanism                                      |
|---------------|------------------------------------------------|
| In-app        | Stored in `app_notifications` table            |
| Push          | Firebase Cloud Messaging (FCM) HTTP v1 API     |
| Email         | Laravel queued `Mailable` classes              |

---

## Where Notifications & Emails Are Triggered

### 1. User Registration (`POST /api/register`)
- **File:** `OtpController::verifyEmail()` (triggered when user verifies OTP)
- **Action:** `Welcome`
- **Channels:** Email ✓ · Push ✓ · In-app ✓
- **Email subject:** "Welcome to {App}!"
- **Notes:** Sent after OTP verification confirms the account. OTP email itself is sent by `OtpTrait::generateAndSaveOTP()` (direct mail, not via service).

---

### 2. OTP — Email Verification (`POST /api/otp/email/send`)
- **File:** `OtpTrait::generateAndSaveOTP()`
- **Action:** `EmailVerificationOtp`
- **Channels:** Email ✓ · Push ✗ · In-app ✗ (transient; not persisted)
- **Email subject:** "Verify your email"

---

### 3. OTP — Password Reset (`POST /api/otp/password/send`)
- **File:** `OtpTrait::generateAndSaveOTP()`
- **Action:** `PasswordResetOtp`
- **Channels:** Email ✓ · Push ✗ · In-app ✗ (transient; not persisted)
- **Email subject:** "Reset your password"

---

### 4. Password Reset (`POST /api/password/reset`)
- **File:** `PasswordController::resetPassword()`
- **Action:** `PasswordReset`
- **Channels:** Email ✓ · Push ✗ · In-app ✓
- **Email subject:** "Your password has been reset"
- **Notes:** Push is skipped because the user has no active session to receive it.

---

### 5. Password Change (`POST /api/password/change`)
- **File:** `PasswordController::changePassword()`
- **Action:** `PasswordChanged`
- **Channels:** Email ✓ · Push ✓ · In-app ✓
- **Email subject:** "Your password has been changed"

---

### 6. Order Placement (`POST /api/milestone2/checkout/place-order`)
- **File:** `CheckoutController::placeOrder()`
- **Three notifications dispatched:**

  | Recipient    | Action          | Email | Push | In-app |
  |--------------|-----------------|-------|------|--------|
  | Customer     | `OrderPlaced`   | ✓     | ✓    | ✓      |
  | Admin/super-admin | `AdminNewOrder` | ✓ | ✓  | ✓      |
  | Store owners (vendors) | `VendorNewOrder` | ✗ | ✓ | ✓ |

- **Customer email subject:** "Order placed successfully"
- **Admin email subject:** "New order received {code}" — rich `AdminNewOrderMail` (`resources/views/emails/admin-new-order.blade.php`) listing customer name, order number, line items, amount, date/time, and a "View Order Details" button linking to `/admin/orders/{id}`.
- **Notes:** Vendor notification is sent to the owner of every store that has items in the order. Notifications are dispatched **after** the DB transaction commits. The admin payload carries `order_id` + `placed_at` so the email/push can deep-link to the order. Admin push uses FCM `webpush.fcm_options.link` so a clicked desktop notification opens the order page.

---

### 7. Order Status Update — Admin (`PUT /api/admin/orders/{order}/status`)
- **File:** `Admin\OrderController::updateStatus()`
- **Action:** Chosen based on `to_status`:

  | `to_status`  | Action                  |
  |--------------|-------------------------|
  | `confirmed`  | `OrderConfirmed`        |
  | `shipped`    | `OrderShipped`          |
  | `delivered`  | `OrderDelivered`        |
  | `cancelled`  | `OrderCancelled`        |
  | `refunded`   | `PaymentRefunded`       |
  | other        | `OrderStatusUpdated`    |

- **Channels:**
  - In-app notification is **always** created for the customer.
  - Email + Push are sent **only when** `notify_customer: true` is included in the request body.

---

### 8. Order Cancellation — Admin (`POST /api/admin/orders/{order}/cancel`)
- **File:** `Admin\OrderController::cancel()`
- **Action:** `OrderCancelled`
- **Channels:** Email ✓ · Push ✓ · In-app ✓ (customer)

---

### 9. Resend Order Confirmation — Admin (`POST /api/admin/orders/{order}/resend-confirmation`)
- **File:** `Admin\OrderController::resendConfirmation()`
- **Action:** `OrderConfirmed`
- **Channels:** Email ✓ · Push ✓ · In-app ✓ (customer)

---

### 10. Order Cancellation — Customer (`POST /api/milestone2/orders/{order}/cancel`)
- **File:** `Milestone2\OrderController::cancel()`
- **Two notifications dispatched:**

  | Recipient | Action          | Email | Push | In-app |
  |-----------|-----------------|-------|------|--------|
  | Customer  | `OrderCancelled` | ✓   | ✓    | ✓      |
  | Admins    | `AdminNewOrder` | ✗    | ✓    | ✓      |

---

### 11. Return / Refund Request — Customer (`POST /api/milestone2/orders/{order}/return`)
- **File:** `Milestone2\OrderController::requestReturn()`
- **Two notifications dispatched:**

  | Recipient | Action             | Email | Push | In-app |
  |-----------|--------------------|-------|------|--------|
  | Customer  | `ReturnRequested`  | ✓     | ✓    | ✓      |
  | Admins    | `ReturnRequested`  | ✗     | ✓    | ✓      |

- **Email subject:** "Return request received"

---

### 12. Payment Captured — Admin (`POST /api/admin/payments/{order}`)
- **File:** `Admin\PaymentController::store()`
- **Action:** `PaymentReceived`
- **Channels:** Email ✓ · Push ✓ · In-app ✓ (customer)
- **Email subject:** "Payment received"

---

### 13. Payment Refunded — Admin (`POST /api/admin/payments/refund/{order}`)
- **File:** `Admin\PaymentController::refund()`
- **Action:** `PaymentRefunded`
- **Channels:** Email ✓ · Push ✓ · In-app ✓ (customer)
- **Email subject:** "Payment refunded"

---

### 14. Vendor Account Created — Admin (`POST /api/admin/vendors`)
- **File:** `Admin\VendorController::store()`
- **Action:** `VendorCreated`
- **Channels:** Email ✓ · Push ✗ · In-app ✓ (vendor)
- **Email subject:** "Vendor account created"
- **Notes:** Push is skipped since the vendor has no FCM token at creation time.

---

### 15. Vendor Store Approved — Admin (`POST /api/admin/vendors/{vendor}/verify`)
- **File:** `Admin\VendorController::verify()`
- **Action:** `StoreApproved`
- **Channels:** Email ✓ · Push ✓ · In-app ✓ (vendor)
- **Email subject:** "Store approved"

---

## Notification API Endpoints

All endpoints require `Authorization: Bearer {token}` (authenticated user).

| Method   | URL                                        | Description                         |
|----------|--------------------------------------------|-------------------------------------|
| `GET`    | `/api/user/notifications`                  | List notifications (paginated)      |
| `GET`    | `/api/user/notifications?unread_only=true` | List unread notifications only      |
| `POST`   | `/api/user/notifications/read-all`         | Mark all notifications as read      |
| `POST`   | `/api/user/notifications/{id}/read`        | Mark a single notification as read  |
| `DELETE` | `/api/user/notifications/{id}`             | Delete a notification               |
| `GET`    | `/api/user/notifications/actions`          | List all `NotificationAction` types |
| `POST`   | `/api/user/notifications/send`             | Send notification to a user (admin) |
| `POST`   | `/api/user/notifications/send-to-token`    | Send raw push to an FCM token       |

### GET `/api/user/notifications` — Response

```json
{
  "success": true,
  "message": "Notifications retrieved",
  "data": {
    "unread_count": 3,
    "items": [
      {
        "id": 1,
        "type": "order_placed",
        "title": "Order placed",
        "body": "Your order ORD-XYZ has been placed successfully.",
        "data": { "order_code": "ORD-XYZ", "grand_total": "2500", "currency": "PKR" },
        "read_at": null,
        "created_at": "2026-05-25T10:00:00.000000Z"
      }
    ],
    "pagination": {
      "total": 10,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

---

## NotificationAction Enum — All Values

| Value                   | Email | Push | In-app | Trigger                         |
|-------------------------|-------|------|--------|---------------------------------|
| `welcome`               | ✓     | ✓    | ✓      | Email verified (new reg)        |
| `email_verification_otp`| ✓     | ✗    | ✗      | Verification OTP sent           |
| `password_reset_otp`    | ✓     | ✗    | ✗      | Password reset OTP sent         |
| `password_changed`      | ✓     | ✓    | ✓      | User changes password           |
| `password_reset`        | ✓     | ✗    | ✓      | User resets forgotten password  |
| `order_placed`          | ✓     | ✓    | ✓      | Customer places order           |
| `order_confirmed`       | ✓     | ✓    | ✓      | Admin confirms order            |
| `order_status_updated`  | ✓     | ✓    | ✓      | Admin updates status (general)  |
| `order_cancelled`       | ✓     | ✓    | ✓      | Order cancelled                 |
| `order_shipped`         | ✓     | ✓    | ✓      | Order marked as shipped         |
| `order_delivered`       | ✓     | ✓    | ✓      | Order marked as delivered       |
| `payment_received`      | ✓     | ✓    | ✓      | Admin captures payment          |
| `payment_failed`        | ✓     | ✓    | ✓      | Payment failure                 |
| `payment_refunded`      | ✓     | ✓    | ✓      | Admin processes refund          |
| `store_approved`        | ✓     | ✓    | ✓      | Admin verifies vendor store     |
| `store_suspended`       | ✓     | ✓    | ✓      | Admin suspends store            |
| `vendor_created`        | ✓     | ✗    | ✓      | Admin creates vendor account    |
| `return_requested`      | ✓     | ✓    | ✓      | Customer requests return        |
| `review_submitted`      | ✓     | ✓    | ✓      | Product review submitted        |
| `account_deleted`       | ✓     | ✓    | ✓      | User account deleted            |
| `admin_new_order`       | ✓     | ✓    | ✓      | New/cancelled order (to admins) |
| `vendor_new_order`      | ✗     | ✓    | ✓      | New order (to store owners)     |

---

## Architecture

```
Controller
  └─► AppNotificationService::notify(User, Action, Payload)
        ├─► EmailNotificationService::send()     → queued Mail
        ├─► PushNotificationService::send()      → FCM HTTP v1
        └─► AppNotification::create()            → app_notifications table

AppNotificationService::notifyAdmins(Action, Payload)
  └─► Loops all super-admin/admin users → notify() (push + in-app, no email)

AppNotificationService::notifyVendorsForOrder(Order, Payload)
  └─► Finds store owners from order items → notify() (push + in-app, no email)
```

### Key Files

| File | Purpose |
|------|---------|
| `app/Enums/NotificationAction.php` | All notification types, email subjects, push titles, body templates |
| `app/Services/Notifications/AppNotificationService.php` | Central dispatcher |
| `app/Services/Notifications/EmailNotificationService.php` | Email routing logic |
| `app/Services/Notifications/PushNotificationService.php` | FCM integration |
| `app/Models/AppNotification.php` | In-app notification model |
| `app/Http/Controllers/Api/UserNotificationController.php` | User-facing notification API |
| `database/migrations/2026_05_25_000001_create_app_notifications_table.php` | Schema |

### FCM Configuration (`.env`)

```
FCM_ENABLED=true
FCM_PROJECT_ID=chantrader          # Must match credentials file's project_id
FCM_CREDENTIALS_PATH=storage/app/firebase-credentials.json
```

### Email Configuration (`.env`)

Standard Laravel mail settings (`MAIL_MAILER`, `MAIL_HOST`, etc.) with queue driver configured for background dispatch.

---

## Admin Panel Notifications

When a customer places an order, **all users with `super-admin` or `admin` role** receive:
- An **email** (rich new-order summary with a deep link to the order)
- An in-app notification (visible via the dashboard bell / `GET /api/admin/notifications`)
- A push notification to their registered FCM device token (mobile or web)

The same in-app + push applies when a customer cancels an order or requests a return (those stay email-free).

### Web (desktop / browser) notifications

The admin dashboard registers the browser for Firebase Cloud Messaging web push:

| Piece | File |
|-------|------|
| Browser SDK init + token registration + foreground handler | `resources/js/lib/firebase.ts` (`registerFcm()`) |
| Service worker (background push + click-to-order) | served by `GET /firebase-messaging-sw.js` → `App\Http\Controllers\FirebaseSwController` |
| Session token save endpoint | `POST/DELETE /api/admin/fcm-token` → `Admin\FcmTokenController` |
| In-dashboard notification bell (30s poll + FCM refresh) | `resources/js/components/notification-bell.tsx` (mounted in `app-sidebar-header.tsx`) |
| Session in-app notification API | `GET /api/admin/notifications`, `POST /api/admin/notifications/{id}/read`, `POST /api/admin/notifications/read-all` → `Admin\NotificationController` |

`registerFcm()` requests `Notification` permission, gets a token via the VAPID key, and POSTs it to `/api/admin/fcm-token` (stored on `users.fcm_token`). Background pushes show a desktop notification whose click opens `/admin/orders/{id}`; foreground messages refresh the bell and raise a `Notification` too.

### Web push setup (`.env`)

These are the **public** Firebase Web App config + Web Push (VAPID) key from the Firebase console (project `chantrader`). Web/desktop notifications stay inactive until they are filled:

```
VITE_FIREBASE_API_KEY=
VITE_FIREBASE_AUTH_DOMAIN=
VITE_FIREBASE_PROJECT_ID=chantrader
VITE_FIREBASE_STORAGE_BUCKET=
VITE_FIREBASE_MESSAGING_SENDER_ID=
VITE_FIREBASE_APP_ID=
VITE_FIREBASE_VAPID_KEY=
```

> Emails are **queued** (`QUEUE_CONNECTION=database`) — run `php artisan queue:work` for admin order emails to actually send.

---

## Settings

Notification delivery can be toggled globally via the `settings` table:

| Group           | Key                        | Default | Effect                        |
|-----------------|----------------------------|---------|-------------------------------|
| `notifications` | `email_notifications_enabled` | `true`  | Enables/disables all emails |
| `notifications` | `push_notifications_enabled`  | `true`  | Enables/disables all pushes |
