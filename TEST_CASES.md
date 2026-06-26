# API Test Cases — TraderApp

> **Base URL:** `http://localhost/api`  
> **Auth Header:** `Authorization: Bearer {access_token}`  
> **Content-Type:** `application/json` (unless noted)

---

## Table of Contents

1. [Authentication](#1-authentication)
2. [OTP Verification](#2-otp-verification)
3. [Password Management](#3-password-management)
4. [Profile](#4-profile)
5. [FCM Token](#5-fcm-token)
6. [In-App Notifications (User)](#6-in-app-notifications-user)
7. [Push Notification (Admin Send)](#7-push-notification-admin-send)
8. [Cart](#8-cart)
9. [Checkout & Order Placement](#9-checkout--order-placement)
10. [Customer Orders](#10-customer-orders)
11. [Admin — Order Management](#11-admin--order-management)
12. [Admin — Payment Management](#12-admin--payment-management)
13. [Admin — Vendor Management](#13-admin--vendor-management)
14. [Negative / Edge Cases](#14-negative--edge-cases)

---

## 1. Authentication

### TC-AUTH-01 — Register New User

**POST** `/register`  
No auth required.

**Request Body**
```json
{
  "full_name": "John Doe",
  "email": "john@example.com",
  "phone_number": "03001234567",
  "password": "password123",
  "password_confirmation": "password123",
  "shop_name": "John's Store",
  "city_district": "Lahore",
  "address": "123 Main Street, Lahore"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "OTP has been sent. Please check your email to verify your account.",
  "data": null
}
```

**Side Effects**
- User created in DB with `status = 0` (inactive), `email_verified_at = null`
- Role `user` assigned
- OTP email sent to `john@example.com` (type: `verification`)
- No notification stored in `app_notifications` yet

---

### TC-AUTH-02 — Register with Avatar

**POST** `/register`  
`Content-Type: multipart/form-data`

**Request Body** (form-data)
```
full_name    = John Doe
email        = john2@example.com
phone_number = 03001234568
password     = password123
password_confirmation = password123
shop_name    = John Shop
city_district = Karachi
address      = 456 Test Road
avatar       = [image file ≤ 1MB]
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "OTP has been sent. Please check your email to verify your account.",
  "data": null
}
```

**Side Effects**
- Avatar stored in `storage/public/avatars/`

---

### TC-AUTH-03 — Register with Duplicate Email

**POST** `/register`

**Request Body**
```json
{
  "full_name": "Jane Doe",
  "email": "john@example.com",
  "phone_number": "03009999999",
  "password": "password123",
  "password_confirmation": "password123",
  "shop_name": "Jane Shop",
  "city_district": "Lahore",
  "address": "789 Road"
}
```

**Expected: 422 Unprocessable Entity**
```json
{
  "success": false,
  "message": "The email has already been taken.",
  "data": null
}
```

---

### TC-AUTH-04 — Login Before Email Verification

**POST** `/login`

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected: 403 Forbidden**
```json
{
  "success": false,
  "message": "Email not verified. Please verify your email first.",
  "data": {
    "verification_required": true,
    "email": "john@example.com",
    "otp": "1234",
    "instructions": "A new OTP has been sent to your email address."
  }
}
```

**Side Effects**
- New OTP email sent

---

### TC-AUTH-05 — Login with Valid Credentials

**POST** `/login`

> Prerequisite: Email verified (see TC-OTP-02)

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "password123"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "User logged in successfully",
  "data": {
    "user": {
      "id": 1,
      "full_name": "John Doe",
      "email": "john@example.com"
    },
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 31536000,
    "refresh_token": "def502..."
  }
}
```

---

### TC-AUTH-06 — Login with Wrong Password

**POST** `/login`

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "wrongpassword"
}
```

**Expected: 401 Unauthorized**
```json
{
  "success": false,
  "message": "The provided credentials are incorrect.",
  "data": null
}
```

---

### TC-AUTH-07 — Logout

**POST** `/user/logout`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Successfully logged out",
  "data": null
}
```

**Side Effects**
- Access token revoked in `oauth_access_tokens`

---

### TC-AUTH-08 — Refresh Token

**POST** `/refresh`

**Request Body**
```json
{
  "refresh_token": "def502..."
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Token refreshed successfully",
  "data": {
    "access_token": "eyJ...",
    "token_type": "Bearer",
    "expires_in": 31536000,
    "refresh_token": "def503..."
  }
}
```

---

## 2. OTP Verification

### TC-OTP-01 — Send Email Verification OTP

**POST** `/otp/email/send`

**Request Body**
```json
{
  "email": "john@example.com"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Verification code has been sent to your email",
  "data": {
    "email": "john@example.com",
    "otp": "1234"
  }
}
```

**Side Effects**
- OTP email sent (subject: "Verify your email")
- No `app_notifications` record created

---

### TC-OTP-02 — Verify Email OTP (First Registration)

**POST** `/otp/email/verify`

**Request Body**
```json
{
  "email": "john@example.com",
  "otp": "1234"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Account verified successfully",
  "data": null
}
```

**Side Effects**
- `email_verified_at` set on user
- `status` set to `1` (active)
- ✅ **Welcome email** queued (subject: "Welcome to {App}!")
- ✅ **Welcome push notification** sent to user's FCM token
- ✅ **`app_notifications` record** created: `type = welcome`

---

### TC-OTP-03 — Verify Email OTP — Wrong OTP

**POST** `/otp/email/verify`

**Request Body**
```json
{
  "email": "john@example.com",
  "otp": "0000"
}
```

**Expected: 400 Bad Request**
```json
{
  "success": false,
  "message": "Invalid OTP",
  "data": null
}
```

---

### TC-OTP-04 — Verify Already-Verified Email

**POST** `/otp/email/verify`

**Request Body**
```json
{
  "email": "john@example.com",
  "otp": "1234"
}
```

**Expected: 400 Bad Request**
```json
{
  "success": false,
  "message": "Email already verified",
  "data": null
}
```

---

### TC-OTP-05 — Send Password Reset OTP

**POST** `/otp/password/send`

**Request Body**
```json
{
  "email": "john@example.com"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Password reset code has been sent to your email",
  "data": {
    "email": "john@example.com",
    "otp": "5678"
  }
}
```

**Side Effects**
- Password reset OTP email sent (subject: "Reset your password")
- No `app_notifications` record created

---

### TC-OTP-06 — Verify Password Reset OTP

**POST** `/otp/password/verify`

**Request Body**
```json
{
  "email": "john@example.com",
  "otp": "5678"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "OTP verified successfully",
  "data": {
    "user": { "id": 1, "full_name": "John Doe", "email": "john@example.com" },
    "reset_token": "abc123xyz..."
  }
}
```

**Side Effects**
- Reset token stored in `password_reset_tokens`

---

## 3. Password Management

### TC-PWD-01 — Reset Password

**POST** `/password/reset`

**Request Body**
```json
{
  "email": "john@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Password reset successfully. Please log in with your new password.",
  "data": {
    "user": { "id": 1, "full_name": "John Doe", "email": "john@example.com" }
  }
}
```

**Side Effects**
- Password updated in DB
- All tokens revoked
- Reset token deleted from `password_reset_tokens`
- ✅ **Password reset email** sent (subject: "Your password has been reset")
- ✅ **`app_notifications` record** created: `type = password_reset`
- Push NOT sent (no active session/token at reset time)

---

### TC-PWD-02 — Change Password (Authenticated)

**POST** `/password/change`  
Auth required.

**Request Body**
```json
{
  "current_password": "newpassword123",
  "new_password": "anotherpass456",
  "new_password_confirmation": "anotherpass456"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Password changed successfully. Please log in again.",
  "data": null
}
```

**Side Effects**
- Password updated
- All tokens revoked
- ✅ **Password changed email** sent (subject: "Your password has been changed")
- ✅ **Password changed push** sent to user's FCM token
- ✅ **`app_notifications` record** created: `type = password_changed`

---

### TC-PWD-03 — Change Password — Wrong Current Password

**POST** `/password/change`  
Auth required.

**Request Body**
```json
{
  "current_password": "wrongcurrent",
  "new_password": "anotherpass456",
  "new_password_confirmation": "anotherpass456"
}
```

**Expected: 422 Unprocessable Entity**
```json
{
  "success": false,
  "message": "The current password is incorrect.",
  "data": null
}
```

---

### TC-PWD-04 — Change Password — Throttle (>5 attempts/min)

**POST** `/password/change` (6th request within 1 minute)  
Auth required.

**Expected: 429 Too Many Requests**
```json
{
  "message": "Too Many Attempts."
}
```

---

## 4. Profile

### TC-PROF-01 — Get Own Profile

**GET** `/user`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "User retrieved",
  "data": {
    "id": 1,
    "full_name": "John Doe",
    "first_name": "John",
    "last_name": "Doe",
    "email": "john@example.com",
    "phone_number": "03001234567",
    "avatar": null,
    "fcm_token": null,
    "roles": ["user"]
  }
}
```

---

### TC-PROF-02 — Update Profile

**POST** `/user/update-profile`  
Auth required.

**Request Body**
```json
{
  "first_name": "Johnny",
  "phone_number": "03111111111"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Profile updated successfully",
  "data": {
    "user": { "id": 1, "first_name": "Johnny", "phone_number": "03111111111" }
  }
}
```

---

## 5. FCM Token

### TC-FCM-01 — Register FCM Token

**POST** `/user/fcm-token`  
Auth required.

**Request Body**
```json
{
  "fcm_token": "ddsYPs1PTYCAhelDZAJ67x:APA91bH..."
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "FCM token saved",
  "data": null
}
```

**Side Effects**
- `fcm_token` updated on `users` table

---

### TC-FCM-02 — Remove FCM Token

**DELETE** `/user/fcm-token`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "FCM token removed",
  "data": null
}
```

---

## 6. In-App Notifications (User)

### TC-NOTIF-01 — List All Notifications

**GET** `/user/notifications`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Notifications retrieved",
  "data": {
    "unread_count": 2,
    "items": [
      {
        "id": 5,
        "type": "order_placed",
        "title": "Order placed",
        "body": "Your order ORD-ABC123 has been placed successfully.",
        "data": {
          "order_code": "ORD-ABC123",
          "grand_total": "2500",
          "currency": "PKR"
        },
        "read_at": null,
        "created_at": "2026-05-25T10:00:00.000000Z"
      },
      {
        "id": 4,
        "type": "welcome",
        "title": "Welcome!",
        "body": "Welcome to TraderApp! Your account is now active.",
        "data": {},
        "read_at": "2026-05-25T09:00:00.000000Z",
        "created_at": "2026-05-25T08:00:00.000000Z"
      }
    ],
    "pagination": {
      "total": 2,
      "per_page": 20,
      "current_page": 1,
      "last_page": 1
    }
  }
}
```

---

### TC-NOTIF-02 — List Unread Notifications Only

**GET** `/user/notifications?unread_only=true`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Notifications retrieved",
  "data": {
    "unread_count": 2,
    "items": [
      {
        "id": 5,
        "type": "order_placed",
        "title": "Order placed",
        "body": "Your order ORD-ABC123 has been placed successfully.",
        "data": { "order_code": "ORD-ABC123" },
        "read_at": null,
        "created_at": "2026-05-25T10:00:00.000000Z"
      }
    ],
    "pagination": { "total": 1, "per_page": 20, "current_page": 1, "last_page": 1 }
  }
}
```

---

### TC-NOTIF-03 — Paginate Notifications

**GET** `/user/notifications?per_page=5`  
Auth required.

**Expected: 200 OK** — `pagination.per_page = 5`, correct `last_page` calculated.

---

### TC-NOTIF-04 — Mark Single Notification as Read

**POST** `/user/notifications/5/read`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Notification marked as read",
  "data": null
}
```

**Side Effects**
- `read_at` set on `app_notifications` row 5

---

### TC-NOTIF-05 — Mark Already-Read Notification

**POST** `/user/notifications/5/read` (already read from TC-NOTIF-04)  
Auth required.

**Expected: 200 OK** — no error; idempotent.

---

### TC-NOTIF-06 — Mark All Notifications as Read

**POST** `/user/notifications/read-all`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "All notifications marked as read",
  "data": null
}
```

**Side Effects**
- All `read_at = null` rows for this user set to `now()`

---

### TC-NOTIF-07 — Mark All When No Unread

**POST** `/user/notifications/read-all`  
Auth required.

**Expected: 200 OK** — no error; 0 rows updated.

---

### TC-NOTIF-08 — Delete a Notification

**DELETE** `/user/notifications/5`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Notification deleted",
  "data": null
}
```

**Side Effects**
- Row deleted from `app_notifications`

---

### TC-NOTIF-09 — Delete Another User's Notification

**DELETE** `/user/notifications/99` (belongs to a different user)  
Auth required.

**Expected: 404 Not Found**
```json
{
  "message": "No query results for model [App\\Models\\AppNotification] 99"
}
```

---

### TC-NOTIF-10 — Access Notifications Without Auth

**GET** `/user/notifications` (no token)

**Expected: 401 Unauthorized**
```json
{
  "message": "Unauthenticated."
}
```

---

### TC-NOTIF-11 — Verify unread_count Decrements

1. Call `GET /user/notifications` → note `unread_count = N`
2. Call `POST /user/notifications/{id}/read`
3. Call `GET /user/notifications` → confirm `unread_count = N - 1`

**Expected:** Count decreases by exactly 1.

---

## 7. Push Notification (Admin Send)

### TC-PUSH-01 — Send Notification to User by ID

**POST** `/user/notifications/send`  
Auth required (admin).

**Request Body**
```json
{
  "user_id": 1,
  "action": "order_placed",
  "payload": {
    "order_code": "ORD-MANUAL01",
    "message": "Your test order has been placed."
  },
  "channels": ["push", "email"]
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Notification dispatched",
  "data": {
    "channels": { "email": true, "push": true },
    "action": "order_placed",
    "user_id": 1
  }
}
```

---

### TC-PUSH-02 — Send Raw Push to FCM Token

**POST** `/user/notifications/send-to-token`  
Auth required.

**Request Body**
```json
{
  "token": "ddsYPs1PTYCAhelDZAJ67x:APA91bH...",
  "title": "Hello",
  "body": "Test message",
  "data": {
    "user_id": "13",
    "order_id": "ORD-2026-1001",
    "type": "order_update",
    "screen": "order_details"
  }
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Push notification sent",
  "data": {
    "sent": true,
    "token": "ddsYPs1PTYCAhelDZAJ67x:APA91bH..."
  }
}
```

---

### TC-PUSH-03 — Send Raw Push — Shorthand Data Fields

**POST** `/user/notifications/send-to-token`  
Auth required.

> Top-level `user_id`, `order_id`, `type`, `screen` are automatically merged into `data[]` by `prepareForValidation`.

**Request Body**
```json
{
  "token": "ddsYPs1PTYCAhelDZAJ67x:APA91bH...",
  "title": "Order Update",
  "body": "Your order is shipped",
  "user_id": "13",
  "order_id": "ORD-2026-1001",
  "type": "order_update",
  "screen": "order_details"
}
```

**Expected: 200 OK** — same as TC-PUSH-02.

---

### TC-PUSH-04 — Send Push — Invalid Token

**POST** `/user/notifications/send-to-token`  
Auth required.

**Request Body**
```json
{
  "token": "invalid_token_xyz",
  "title": "Test",
  "body": "Test body"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Push notification failed (check FCM config)",
  "data": {
    "sent": false,
    "token": "invalid_token_xyz"
  }
}
```

---

### TC-PUSH-05 — List Notification Actions

**GET** `/user/notifications/actions`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Notification actions retrieved",
  "data": [
    {
      "value": "welcome",
      "label": "Welcome",
      "supports_email": true,
      "supports_push": true
    },
    {
      "value": "email_verification_otp",
      "label": "Email Verification Otp",
      "supports_email": true,
      "supports_push": false
    }
  ]
}
```

**Expected count:** 22 actions returned.

---

## 8. Cart

### TC-CART-01 — Add Item to Cart

**POST** `/milestone2/cart`  
Auth required.

**Request Body**
```json
{
  "product_id": 1,
  "quantity": 2
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Item added to cart"
}
```

---

### TC-CART-02 — View Cart

**GET** `/milestone2/cart`  
Auth required.

**Expected: 200 OK** — returns cart items with product details.

---

### TC-CART-03 — Update Cart Item Quantity

**PUT** `/milestone2/cart/{item_id}`  
Auth required.

**Request Body**
```json
{ "quantity": 3 }
```

**Expected: 200 OK**

---

### TC-CART-04 — Clear Cart

**DELETE** `/milestone2/cart/clear`  
Auth required.

**Expected: 200 OK**

---

## 9. Checkout & Order Placement

### TC-CHECKOUT-01 — Add Shipping Address

**POST** `/milestone2/addresses`  
Auth required.

**Request Body**
```json
{
  "title": "Home",
  "name": "John Doe",
  "phone": "03001234567",
  "address_line_1": "123 Main Street",
  "city": "Lahore",
  "state": "Punjab",
  "postal_code": "54000",
  "is_default": true
}
```

**Expected: 201 Created**
```json
{
  "success": true,
  "message": "Address added",
  "data": { "id": 1 }
}
```

---

### TC-CHECKOUT-02 — Place Order (COD)

**POST** `/milestone2/checkout/place-order`  
Auth required.

> Prerequisite: Cart has at least one in-stock item. Address exists.

**Request Body**
```json
{
  "address_id": 1,
  "payment_method": "cod",
  "special_instructions": "Deliver after 5pm"
}
```

**Expected: 201 Created**
```json
{
  "success": true,
  "message": "Order placed successfully",
  "data": {
    "order_id": 10,
    "order_number": "ORD-ABCDEFGHIJKL",
    "status": "pending",
    "items": [
      {
        "id": 1,
        "product_id": 1,
        "product_name": "Sample Product",
        "sku": "SKU-001",
        "quantity": 2,
        "unit_price": 500.00,
        "subtotal": 1000.00,
        "feature_image": null
      }
    ],
    "price_breakdown": {
      "subtotal": 1000.00,
      "tax": 0.00,
      "delivery": 10.00,
      "total": 1010.00,
      "currency": "PKR"
    },
    "shipping_address": {
      "id": 1,
      "title": "Home",
      "name": "John Doe",
      "phone": "03001234567",
      "address_line_1": "123 Main Street",
      "city": "Lahore"
    },
    "payment_method": "Cash on Delivery (COD)",
    "notes": "Deliver after 5pm",
    "created_at": "2026-05-25T10:00:00.000000Z"
  }
}
```

**Side Effects**
- Order created in DB (`status = pending`, `payment_status = unpaid`)
- Stock decremented for each product
- Cart cleared
- Payment record created (`method = cod`, `status = initiated`)
- ✅ **OrderPlaced email** sent to customer (subject: "Order placed successfully")
- ✅ **OrderPlaced push** sent to customer's FCM token
- ✅ **`app_notifications` record** created for customer: `type = order_placed`
- ✅ **AdminNewOrder push** sent to all admin/super-admin FCM tokens
- ✅ **`app_notifications` records** created for each admin: `type = admin_new_order`
- ✅ **VendorNewOrder push** sent to store owner(s) in order
- ✅ **`app_notifications` records** created for each vendor: `type = vendor_new_order`

---

### TC-CHECKOUT-03 — Place Order — Empty Cart

**POST** `/milestone2/checkout/place-order`  
Auth required.

**Request Body**
```json
{ "address_id": 1, "payment_method": "cod" }
```

**Expected: 422 / 400**
```json
{
  "success": false,
  "message": "Your cart is empty."
}
```

---

### TC-CHECKOUT-04 — Place Order — Out of Stock

**POST** `/milestone2/checkout/place-order`  
Auth required.

> Cart contains a product with stock = 0.

**Expected: 422 / 400**
```json
{
  "success": false,
  "message": "Product 'Sample Product' is out of stock."
}
```

---

### TC-CHECKOUT-05 — Place Order — Invalid Address

**POST** `/milestone2/checkout/place-order`  
Auth required.

**Request Body**
```json
{ "address_id": 9999, "payment_method": "cod" }
```

**Expected: 422 Unprocessable Entity** (address not found / not owned by user)

---

## 10. Customer Orders

### TC-ORDER-01 — List My Orders

**GET** `/milestone2/orders`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Orders retrieved",
  "data": {
    "items": [
      {
        "id": 10,
        "code": "ORD-ABCDEFGHIJKL",
        "status": "pending",
        "grand_total": 1010.00,
        "created_at": "2026-05-25T10:00:00.000000Z",
        "items": [...]
      }
    ],
    "pagination": { "total": 1, "per_page": 10, "current_page": 1, "last_page": 1 }
  }
}
```

---

### TC-ORDER-02 — Filter Orders by Status

**GET** `/milestone2/orders?status=pending`  
Auth required.

**Expected: 200 OK** — only pending orders returned.

---

### TC-ORDER-03 — Get Order Details

**GET** `/milestone2/orders/10`  
Auth required.

**Expected: 200 OK** — full order object with items, address, price breakdown.

---

### TC-ORDER-04 — Cancel Pending Order

**POST** `/milestone2/orders/10/cancel`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Order cancelled successfully",
  "data": null
}
```

**Side Effects**
- Order `status` set to `cancelled`
- Stock restored for each item
- ✅ **OrderCancelled email** sent to customer (subject: "Order cancelled")
- ✅ **OrderCancelled push** sent to customer
- ✅ **`app_notifications` record** created for customer: `type = order_cancelled`
- ✅ **AdminNewOrder push** sent to admins (message: "Order cancelled by customer")
- ✅ **`app_notifications` records** created for admins: `type = admin_new_order`

---

### TC-ORDER-05 — Cancel Non-Pending Order

**POST** `/milestone2/orders/10/cancel`  
Auth required.

> Order status is `shipped`.

**Expected: 422 / 400**
```json
{
  "success": false,
  "message": "Only pending orders can be cancelled."
}
```

---

### TC-ORDER-06 — Request Return (Delivered Order)

**POST** `/milestone2/orders/10/return`  
Auth required.

> Order status must be `delivered`.

**Request Body**
```json
{
  "reason": "Item was damaged on arrival"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Return request submitted",
  "data": null
}
```

**Side Effects**
- Order `status` set to `refunded`
- ✅ **ReturnRequested email** sent to customer (subject: "Return request received")
- ✅ **ReturnRequested push** sent to customer
- ✅ **`app_notifications` record** for customer: `type = return_requested`
- ✅ **ReturnRequested push** sent to admins
- ✅ **`app_notifications` records** for admins: `type = return_requested`

---

### TC-ORDER-07 — Request Return on Non-Delivered Order

**POST** `/milestone2/orders/10/return`  
Auth required.

> Order status = `pending`.

**Expected: 422 / 400**
```json
{
  "success": false,
  "message": "Only delivered orders can be returned."
}
```

---

### TC-ORDER-08 — Reorder Previous Order

**POST** `/milestone2/orders/10/reorder`  
Auth required.

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Items added to cart from previous order",
  "data": null
}
```

**Side Effects**
- Cart items created/updated for all products in the original order

---

## 11. Admin — Order Management

> All endpoints require `Authorization: Bearer {admin_token}` with `super-admin` role.

### TC-ADMIN-ORD-01 — List All Orders

**GET** `/admin/orders`  
Auth required (super-admin).

**Expected: 200 OK**
```json
{
  "success": true,
  "data": [...],
  "pagination": { "total": 50, "per_page": 20, "current_page": 1, "last_page": 3 }
}
```

---

### TC-ADMIN-ORD-02 — Filter Orders by Status

**GET** `/admin/orders?status=pending`

**Expected: 200 OK** — only pending orders returned.

---

### TC-ADMIN-ORD-03 — Filter Orders by Code

**GET** `/admin/orders?code=ORD-ABC`

**Expected: 200 OK** — orders with matching code substring.

---

### TC-ADMIN-ORD-04 — Get Single Order

**GET** `/admin/orders/10`

**Expected: 200 OK** — full order with user, items, payments, shipping address.

---

### TC-ADMIN-ORD-05 — Update Order Status to `confirmed` (Notify Customer)

**PUT** `/admin/orders/10/status`

**Request Body**
```json
{
  "to_status": "confirmed",
  "comment": "Payment verified",
  "notify_customer": true
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "data": { "id": 10, "status": "confirmed", ... }
}
```

**Side Effects**
- `orders.status` updated to `confirmed`
- `order_status_histories` record created
- ✅ **OrderConfirmed email** sent to customer (subject: "Order confirmed")
- ✅ **OrderConfirmed push** sent to customer
- ✅ **`app_notifications` record** for customer: `type = order_confirmed`

---

### TC-ADMIN-ORD-06 — Update Status to `shipped` (Notify Customer)

**PUT** `/admin/orders/10/status`

**Request Body**
```json
{
  "to_status": "shipped",
  "notify_customer": true
}
```

**Side Effects**
- ✅ Email: "Your order has shipped"
- ✅ Push sent
- ✅ `app_notifications`: `type = order_shipped`

---

### TC-ADMIN-ORD-07 — Update Status to `delivered` (Notify Customer)

**PUT** `/admin/orders/10/status`

**Request Body**
```json
{
  "to_status": "delivered",
  "notify_customer": true
}
```

**Side Effects**
- ✅ Email: "Your order was delivered"
- ✅ Push sent
- ✅ `app_notifications`: `type = order_delivered`

---

### TC-ADMIN-ORD-08 — Update Status — No Customer Notification

**PUT** `/admin/orders/10/status`

**Request Body**
```json
{
  "to_status": "packed",
  "notify_customer": false
}
```

**Side Effects**
- ✅ **`app_notifications` record created** for customer: `type = order_status_updated` ← always persisted
- ❌ Email NOT sent
- ❌ Push NOT sent

---

### TC-ADMIN-ORD-09 — Update Status — `notify_customer` Omitted

**PUT** `/admin/orders/10/status`

**Request Body**
```json
{
  "to_status": "packed"
}
```

**Side Effects** — same as TC-ADMIN-ORD-08 (defaults to false).

---

### TC-ADMIN-ORD-10 — Admin Cancel Order

**POST** `/admin/orders/10/cancel`

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Order cancelled successfully"
}
```

**Side Effects**
- Order `status = cancelled`
- Stock restored
- ✅ **OrderCancelled email** to customer
- ✅ **OrderCancelled push** to customer
- ✅ **`app_notifications`**: `type = order_cancelled`

---

### TC-ADMIN-ORD-11 — Admin Cancel Shipped Order

**POST** `/admin/orders/10/cancel`

> Order is already `shipped`.

**Expected: 400 Bad Request**
```json
{
  "success": false,
  "message": "Cannot cancel an order that has already been shipped or delivered."
}
```

---

### TC-ADMIN-ORD-12 — Resend Order Confirmation

**POST** `/admin/orders/10/resend-confirmation`

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Order confirmation resent successfully"
}
```

**Side Effects**
- ✅ **OrderConfirmed email** sent to customer
- ✅ **OrderConfirmed push** sent to customer
- ✅ **`app_notifications`**: `type = order_confirmed`

---

### TC-ADMIN-ORD-13 — Update Status — Invalid Status Value

**PUT** `/admin/orders/10/status`

**Request Body**
```json
{ "to_status": "flying" }
```

**Expected: 422 Unprocessable Entity**

---

## 12. Admin — Payment Management

### TC-ADMIN-PAY-01 — List Payments

**GET** `/admin/payments`

**Expected: 200 OK** — paginated list.

---

### TC-ADMIN-PAY-02 — Capture Payment

**POST** `/admin/payments/10` (order_id = 10)

**Request Body**
```json
{
  "method": "cod",
  "amount": 1010.00
}
```

**Expected: 201 Created**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "order_id": 10,
    "method": "cod",
    "amount": 1010.00,
    "status": "succeeded"
  }
}
```

**Side Effects**
- Payment record created with `status = succeeded`
- Order `payment_status` updated to `paid`
- ✅ **PaymentReceived email** to customer (subject: "Payment received")
- ✅ **PaymentReceived push** to customer
- ✅ **`app_notifications`**: `type = payment_received`, body includes amount

---

### TC-ADMIN-PAY-03 — Process Refund

**POST** `/admin/payments/refund/10` (order_id = 10)

**Request Body**
```json
{
  "amount": 1010.00,
  "reason": "Customer return approved"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": 6,
    "order_id": 10,
    "status": "refunded"
  }
}
```

**Side Effects**
- Payment record created with `status = refunded`
- Order `payment_status` updated to `refunded`
- ✅ **PaymentRefunded email** to customer (subject: "Payment refunded")
- ✅ **PaymentRefunded push** to customer
- ✅ **`app_notifications`**: `type = payment_refunded`, body includes amount

---

### TC-ADMIN-PAY-04 — Refund Order With No User

**POST** `/admin/payments/refund/10`

> Order exists but `user_id` is null / user is deleted.

**Expected: 200 OK** — no crash; notification silently skipped.

---

## 13. Admin — Vendor Management

### TC-ADMIN-VEN-01 — Create Vendor

**POST** `/admin/vendors`  
Auth required (super-admin).

**Request Body**
```json
{
  "first_name": "Ali",
  "last_name": "Khan",
  "email": "ali@vendor.com",
  "password": "vendorpass123",
  "password_confirmation": "vendorpass123",
  "store_name": "Ali's Store",
  "phone_number": "03121234567",
  "city_district": "Karachi",
  "address": "Shop 5, Market Road"
}
```

**Expected: 201 Created**
```json
{
  "success": true,
  "message": "Vendor created successfully",
  "data": {
    "vendor": {
      "id": 5,
      "name": "Ali Khan",
      "email": "ali@vendor.com",
      "phone_number": "03121234567"
    },
    "store": {
      "id": 3,
      "name": "Ali's Store",
      "slug": "alis-store"
    }
  }
}
```

**Side Effects**
- User created with role `vendor`, `email_verified_at = now()`
- Store created linked to vendor
- ✅ **VendorCreated email** sent to `ali@vendor.com` (subject: "Vendor account created")
- ✅ **`app_notifications` record** for vendor: `type = vendor_created`
- Push NOT sent (vendor has no FCM token yet)

---

### TC-ADMIN-VEN-02 — Create Vendor — Duplicate Email

**POST** `/admin/vendors`

**Request Body** (same email as existing vendor)

**Expected: 422 Unprocessable Entity**
```json
{
  "message": "The email has already been taken."
}
```

---

### TC-ADMIN-VEN-03 — Get Vendor

**GET** `/admin/vendors/5`

**Expected: 200 OK**
```json
{
  "success": true,
  "data": {
    "id": 5,
    "name": "Ali Khan",
    "email": "ali@vendor.com",
    "store": { "id": 3, "name": "Ali's Store", "status": "active" }
  }
}
```

---

### TC-ADMIN-VEN-04 — Update Vendor

**PUT** `/admin/vendors/5`

**Request Body**
```json
{
  "first_name": "Ali",
  "last_name": "Ahmed",
  "store_name": "Ahmed Store"
}
```

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Vendor updated successfully"
}
```

---

### TC-ADMIN-VEN-05 — Verify (Approve) Vendor Store

**POST** `/admin/vendors/5/verify`

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Vendor store verified successfully",
  "data": {
    "store_id": 3,
    "verified_at": "2026-05-25T12:00:00.000000Z"
  }
}
```

**Side Effects**
- `stores.verified_at` set to now
- `stores.status` set to `active`
- ✅ **StoreApproved email** to vendor (subject: "Store approved")
- ✅ **StoreApproved push** to vendor's FCM token
- ✅ **`app_notifications` record** for vendor: `type = store_approved`

---

### TC-ADMIN-VEN-06 — Verify Vendor With No Store

**POST** `/admin/vendors/5/verify`

> Vendor has no store record.

**Expected: 404 Not Found**
```json
{
  "success": false,
  "message": "Vendor has no store"
}
```

---

### TC-ADMIN-VEN-07 — Verify Non-Vendor User

**POST** `/admin/vendors/1/verify`

> User ID 1 is a regular user, not a vendor.

**Expected: 404 Not Found** (`abort_unless($vendor->hasRole('vendor'), 404)`)

---

### TC-ADMIN-VEN-08 — Delete Vendor

**DELETE** `/admin/vendors/5`

**Expected: 200 OK**
```json
{
  "success": true,
  "message": "Vendor deleted successfully"
}
```

**Side Effects**
- Vendor user soft-deleted
- Associated store soft-deleted

---

### TC-ADMIN-VEN-09 — List Vendors

**GET** `/admin/vendors`

**Expected: 200 OK** — array of vendors with store details.

---

## 14. Negative / Edge Cases

### TC-EDGE-01 — Access Admin Route as Regular User

**GET** `/admin/orders`  
Auth required (regular user token).

**Expected: 403 Forbidden**

---

### TC-EDGE-02 — Access Admin Route Unauthenticated

**GET** `/admin/orders` (no token)

**Expected: 401 Unauthorized**

---

### TC-EDGE-03 — Notification Delivery When FCM Token Missing

**Flow:**
1. Register and verify user (no FCM token registered)
2. Place an order

**Expected:**
- `app_notifications` row created ✅
- Email sent ✅
- Push silently skipped (no FCM token) — no error thrown, `push = false` in result

---

### TC-EDGE-04 — Notification Delivery When Email Disabled in Settings

**Setup:** Set `settings` where `group = notifications`, `key = email_notifications_enabled`, `value = false`.

**Flow:** Trigger any notification event.

**Expected:**
- `app_notifications` row created ✅
- Push sent ✅
- Email NOT sent ❌ (`EmailNotificationService` checks this setting)

---

### TC-EDGE-05 — Notification Delivery When Push Disabled in Settings

**Setup:** Set `push_notifications_enabled = false` in settings.

**Flow:** Trigger any notification event.

**Expected:**
- `app_notifications` row created ✅
- Email sent ✅
- Push NOT sent ❌

---

### TC-EDGE-06 — Order Placed With Multiple Vendors

**Flow:**
1. Add products from 2 different stores to cart
2. Place order

**Expected:**
- ✅ 1 `order_placed` notification for customer
- ✅ 1 `admin_new_order` notification per admin user
- ✅ 1 `vendor_new_order` notification per store owner (2 vendors notified)

---

### TC-EDGE-07 — Mark Notification From Wrong User

**POST** `/user/notifications/{id}/read`

> Notification ID belongs to a different user (user B trying to mark user A's notification).

**Expected: 404 Not Found**

---

### TC-EDGE-08 — Delete Notification From Wrong User

**DELETE** `/user/notifications/{id}`

> Same as above — enforced via `user->appNotifications()->findOrFail(id)`.

**Expected: 404 Not Found**

---

### TC-EDGE-09 — Place Order — Unsupported Payment Method

**POST** `/milestone2/checkout/place-order`

**Request Body**
```json
{ "address_id": 1, "payment_method": "card" }
```

**Expected: 422 Unprocessable Entity** (only `cod` is accepted)

---

### TC-EDGE-10 — Password Reset With Non-Existent Email

**POST** `/password/reset`

**Request Body**
```json
{
  "email": "notfound@example.com",
  "password": "newpassword123",
  "password_confirmation": "newpassword123"
}
```

**Expected: 404 Not Found**
```json
{
  "success": false,
  "message": "User not found"
}
```

---

### TC-EDGE-11 — OTP Expired

**Flow:**
1. Request OTP
2. Wait for OTP to expire (default: 15 minutes)
3. Submit expired OTP

**POST** `/otp/email/verify`

**Expected: 400 Bad Request**
```json
{
  "success": false,
  "message": "OTP has expired"
}
```

---

### TC-EDGE-12 — Concurrent Notification Persistence

**Flow:**
1. Trigger 3 separate notification events quickly (e.g., place 3 orders)

**Expected:**
- 3 separate `app_notifications` rows created for customer
- `unread_count = 3` returned by `GET /user/notifications`

---

## Summary Matrix — Notifications per Event

| Event | Customer Email | Customer Push | Customer In-App | Admin In-App | Vendor In-App |
|-------|:-:|:-:|:-:|:-:|:-:|
| Email verified | ✅ | ✅ | ✅ | — | — |
| Password reset | ✅ | — | ✅ | — | — |
| Password changed | ✅ | ✅ | ✅ | — | — |
| Order placed | ✅ | ✅ | ✅ | ✅ | ✅ |
| Order cancelled (customer) | ✅ | ✅ | ✅ | ✅ | — |
| Return requested | ✅ | ✅ | ✅ | ✅ | — |
| Order status updated | optional | optional | ✅ | — | — |
| Order cancelled (admin) | ✅ | ✅ | ✅ | — | — |
| Confirmation resent | ✅ | ✅ | ✅ | — | — |
| Payment captured | ✅ | ✅ | ✅ | — | — |
| Payment refunded | ✅ | ✅ | ✅ | — | — |
| Vendor created | ✅ | — | ✅ | — | — |
| Store approved | ✅ | ✅ | ✅ | — | — |

> **optional** = controlled by `notify_customer` flag in admin order status update request.
