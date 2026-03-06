# TraderApp Marketplace — Database & Admin API Specification

Scope
- Multi-vendor marketplace for electronic parts
- Roles: Super Admin, Vendor, User (customer)
- Covers database structure, access rules, and admin-side REST API

Principles
- Normalize core entities; use JSON only for flexible metadata
- Soft deletes where appropriate; keep status enums to drive UI
- Consistent slugs/uuids for public URLs; numeric ids for internal joins
- Guard admin routes with Passport + spatie/permission

Roles & Access
- Super Admin: full access to all modules
- Vendor: manages own store, products, orders, promotions, support
- User: browses, carts, orders, reviews, follows stores

Key Entities
- Store, Category, Product, Variant, Inventory, Order, Shipment, Payment
- Review, Wishlist, Follow, Coupon, Banner, CMS Page, Ticket
- Address (polymorphic), Media (images), Audit (status history)

High-Level ERD (ASCII)
```
users (spatie roles/permissions used)
  └─< store_staff >─┐
stores ─────────────┘
   │ 1..*                        categories (self parent_id)
   └─< products >─┐              brands
                   ├─< product_images >
                   ├─< product_variants >─< inventory_movements >
                   └─< product_attributes (key/value or attribute_id) >

users ─< addresses (morph) >
users ─< carts ─< cart_items >
users ─< wishlists > products
users ─< store_follows > stores

orders ─< order_items > products/variants
orders ─< payments >
orders ─< shipments >
orders ─< order_status_history >

products ─< product_reviews > users
stores   ─< store_reviews > users

coupons ─< coupon_user >
cms_pages, banners, settings
support_tickets ─< ticket_messages >
```

Core Tables (MySQL)
- stores
  - id BIGINT PK
  - owner_id BIGINT FK users.id
  - name VARCHAR(150), slug VARCHAR(160) UNIQUE
  - logo VARCHAR(255), banner VARCHAR(255)
  - email VARCHAR(150) NULL, phone VARCHAR(30) NULL
  - description TEXT NULL
  - socials JSON NULL
  - rating_avg DECIMAL(3,2) DEFAULT 0.00
  - followers_count INT DEFAULT 0, products_count INT DEFAULT 0
  - status ENUM('pending','active','suspended') DEFAULT 'pending'
  - verified_at TIMESTAMP NULL
  - created_at, updated_at, deleted_at
  - Indexes: (owner_id), (slug), (status)

- store_staff
  - id BIGINT PK
  - store_id BIGINT FK stores.id
  - user_id BIGINT FK users.id
  - role ENUM('owner','manager','staff') DEFAULT 'staff'
  - is_primary BOOLEAN DEFAULT 0
  - UNIQUE (store_id, user_id)

- categories
  - id BIGINT PK
  - parent_id BIGINT NULL FK categories.id
  - name VARCHAR(120), slug VARCHAR(140) UNIQUE
  - icon VARCHAR(120) NULL
  - sort_order INT DEFAULT 0
  - is_active BOOLEAN DEFAULT 1
  - created_at, updated_at, deleted_at
  - Indexes: (parent_id), (is_active, sort_order)

- brands
  - id BIGINT PK
  - name VARCHAR(120) UNIQUE, slug VARCHAR(140) UNIQUE
  - logo VARCHAR(255) NULL, description TEXT NULL
  - created_at, updated_at, deleted_at

- products
  - id BIGINT PK
  - store_id BIGINT FK stores.id
  - category_id BIGINT FK categories.id
  - brand_id BIGINT NULL FK brands.id
  - name VARCHAR(180), slug VARCHAR(200) UNIQUE
  - sku VARCHAR(64) UNIQUE
  - short_description VARCHAR(300) NULL
  - description LONGTEXT NULL
  - price DECIMAL(12,2), compare_at DECIMAL(12,2) NULL
  - unit VARCHAR(32) NULL, warranty_months SMALLINT NULL
  - is_published BOOLEAN DEFAULT 0, published_at TIMESTAMP NULL
  - rating_avg DECIMAL(3,2) DEFAULT 0.00, rating_count INT DEFAULT 0
  - created_at, updated_at, deleted_at
  - Indexes: (store_id, category_id), (is_published, updated_at), (slug), FULLTEXT(description) (if supported)

- product_images
  - id BIGINT PK
  - product_id BIGINT FK products.id
  - path VARCHAR(255), alt VARCHAR(150) NULL
  - sort_order INT DEFAULT 0, is_primary BOOLEAN DEFAULT 0
  - Indexes: (product_id, sort_order)

- product_variants
  - id BIGINT PK
  - product_id BIGINT FK products.id
  - sku VARCHAR(80) UNIQUE NULL
  - variant_key VARCHAR(255) NULL  -- e.g. "Package:TO-247|Voltage:1000V"
  - price DECIMAL(12,2) NULL, compare_at DECIMAL(12,2) NULL
  - stock INT DEFAULT 0
  - weight DECIMAL(8,3) NULL, length DECIMAL(8,2) NULL, width DECIMAL(8,2) NULL, height DECIMAL(8,2) NULL
  - is_active BOOLEAN DEFAULT 1
  - Indexes: (product_id), (is_active), (variant_key)

- product_attributes
  - id BIGINT PK
  - product_id BIGINT FK products.id
  - name VARCHAR(80)  -- e.g., "Voltage Rating"
  - value VARCHAR(160) -- e.g., "1000V"
  - unit VARCHAR(32) NULL
  - UNIQUE (product_id, name)

- inventory_movements
  - id BIGINT PK
  - product_variant_id BIGINT NULL FK product_variants.id
  - product_id BIGINT FK products.id
  - qty INT, type ENUM('in','out','reserve','release','adjust')
  - reason VARCHAR(120) NULL, reference_id BIGINT NULL, reference_type VARCHAR(60) NULL
  - created_at
  - Indexes: (product_id), (product_variant_id), (type, created_at)

- addresses (morph)
  - id BIGINT PK
  - addressable_id BIGINT, addressable_type VARCHAR(80)
  - label VARCHAR(60) NULL
  - first_name VARCHAR(80), last_name VARCHAR(80), phone VARCHAR(30)
  - line1 VARCHAR(180), line2 VARCHAR(180) NULL
  - city VARCHAR(100), state VARCHAR(100), postal_code VARCHAR(20), country VARCHAR(2)
  - lat DECIMAL(10,7) NULL, lng DECIMAL(10,7) NULL
  - is_default BOOLEAN DEFAULT 0
  - created_at, updated_at, deleted_at
  - Indexes: (addressable_type, addressable_id), (is_default)

- carts
  - id BIGINT PK
  - user_id BIGINT NULL FK users.id
  - session_id VARCHAR(64) NULL
  - store_id BIGINT NULL FK stores.id  -- optional for store-scoped carts
  - currency CHAR(3) DEFAULT 'USD'
  - created_at, updated_at
  - Indexes: (user_id), (session_id)

- cart_items
  - id BIGINT PK
  - cart_id BIGINT FK carts.id
  - product_id BIGINT FK products.id
  - product_variant_id BIGINT NULL FK product_variants.id
  - quantity INT, unit_price DECIMAL(12,2)
  - subtotal DECIMAL(12,2)
  - Indexes: (cart_id), UNIQUE(cart_id, product_id, product_variant_id)

- orders
  - id BIGINT PK
  - user_id BIGINT FK users.id
  - code VARCHAR(24) UNIQUE -- e.g., ORD-2026-0001
  - status ENUM('pending','confirmed','packed','shipped','delivered','cancelled','refunded') DEFAULT 'pending'
  - shipping_address_id BIGINT FK addresses.id
  - currency CHAR(3) DEFAULT 'USD'
  - subtotal DECIMAL(12,2), shipping_cost DECIMAL(12,2) DEFAULT 0.00, discount_total DECIMAL(12,2) DEFAULT 0.00, tax_total DECIMAL(12,2) DEFAULT 0.00, grand_total DECIMAL(12,2)
  - payment_status ENUM('unpaid','paid','partial','refunded') DEFAULT 'unpaid'
  - notes TEXT NULL
  - created_at, updated_at
  - Indexes: (user_id), (status, created_at), (code)

- order_items
  - id BIGINT PK
  - order_id BIGINT FK orders.id
  - store_id BIGINT FK stores.id
  - product_id BIGINT FK products.id
  - product_variant_id BIGINT NULL FK product_variants.id
  - name VARCHAR(180)
  - sku VARCHAR(80) NULL
  - quantity INT
  - unit_price DECIMAL(12,2), subtotal DECIMAL(12,2)
  - status ENUM('pending','confirmed','packed','shipped','delivered','cancelled','refunded') DEFAULT 'pending'
  - Indexes: (order_id), (store_id), (status)

- order_status_history
  - id BIGINT PK
  - order_id BIGINT FK orders.id
  - store_id BIGINT NULL FK stores.id
  - from_status VARCHAR(40) NULL, to_status VARCHAR(40)
  - changed_by BIGINT FK users.id
  - comment VARCHAR(255) NULL
  - created_at

- payments
  - id BIGINT PK
  - order_id BIGINT FK orders.id
  - method ENUM('cod','card','bank','wallet')
  - amount DECIMAL(12,2)
  - status ENUM('initiated','succeeded','failed','refunded') DEFAULT 'initiated'
  - provider_txn_id VARCHAR(120) NULL
  - paid_at TIMESTAMP NULL
  - created_at, updated_at

- shipments
  - id BIGINT PK
  - order_id BIGINT FK orders.id
  - store_id BIGINT FK stores.id
  - carrier VARCHAR(80) NULL, tracking_no VARCHAR(120) NULL
  - status ENUM('pending','shipped','in_transit','delivered','failed','returned') DEFAULT 'pending'
  - shipped_at TIMESTAMP NULL, delivered_at TIMESTAMP NULL
  - cost DECIMAL(12,2) DEFAULT 0.00
  - created_at, updated_at

- coupons
  - id BIGINT PK
  - code VARCHAR(40) UNIQUE
  - type ENUM('fixed','percent'), value DECIMAL(10,2)
  - min_order_total DECIMAL(12,2) NULL
  - max_uses INT NULL, max_uses_per_user INT NULL
  - starts_at TIMESTAMP NULL, ends_at TIMESTAMP NULL, is_active BOOLEAN DEFAULT 1
  - created_at, updated_at

- coupon_user
  - id BIGINT PK
  - coupon_id BIGINT FK coupons.id
  - user_id BIGINT FK users.id
  - order_id BIGINT NULL FK orders.id
  - used_at TIMESTAMP NULL
  - UNIQUE(coupon_id, user_id, order_id)

- product_reviews
  - id BIGINT PK
  - product_id BIGINT FK products.id
  - user_id BIGINT FK users.id
  - rating TINYINT CHECK 1..5, title VARCHAR(120) NULL, body TEXT NULL
  - status ENUM('pending','approved','rejected') DEFAULT 'pending'
  - created_at, updated_at
  - Indexes: (product_id), (status)

- store_follows
  - id BIGINT PK
  - user_id BIGINT FK users.id
  - store_id BIGINT FK stores.id
  - UNIQUE(user_id, store_id)

- wishlists
  - id BIGINT PK
  - user_id BIGINT FK users.id
  - product_id BIGINT FK products.id
  - UNIQUE(user_id, product_id)

- banners
  - id BIGINT PK
  - title VARCHAR(120), image VARCHAR(255), link VARCHAR(255) NULL
  - placement ENUM('home_top','home_mid','category') DEFAULT 'home_top'
  - is_active BOOLEAN DEFAULT 1
  - starts_at TIMESTAMP NULL, ends_at TIMESTAMP NULL
  - created_at, updated_at, deleted_at

- cms_pages
  - id BIGINT PK
  - slug VARCHAR(120) UNIQUE
  - title VARCHAR(180)
  - content LONGTEXT
  - is_published BOOLEAN DEFAULT 1
  - created_at, updated_at
  - Seed: 'terms-and-conditions', 'privacy-policy', 'help-and-support'

- support_tickets
  - id BIGINT PK
  - user_id BIGINT FK users.id
  - store_id BIGINT NULL FK stores.id
  - subject VARCHAR(180), status ENUM('open','waiting','closed') DEFAULT 'open'
  - created_at, updated_at

- ticket_messages
  - id BIGINT PK
  - ticket_id BIGINT FK support_tickets.id
  - user_id BIGINT FK users.id
  - body TEXT
  - created_at

Admin Modules (What to build on admin side)
- Dashboard & Reports
- User Management (users, roles/permissions)
- Vendor/Store Management (approve, suspend, verify; staff)
- Catalog
  - Categories
  - Brands
  - Products (images, attributes, variants, inventory)
- Orders
  - Order list/detail, statuses, refunds
  - Payments & transactions
  - Shipments
- Marketing
  - Coupons
  - Banners
- Content
  - CMS Pages (Terms, Privacy, Help & Support)
- Reviews & Moderation (approve/reject)
- Support Tickets
- Settings
  - General (name, currency, tax rate)
  - OTP/email templates and expiry
  - Shipping methods and zones

Admin REST API (prefix /api/admin)
- Auth
  - POST /login
  - POST /logout

- Users
  - GET /users
  - POST /users
  - GET /users/{id}
  - PATCH /users/{id}
  - DELETE /users/{id}
  - POST /users/{id}/ban

- Vendors & Stores
  - GET /stores?status=pending|active|suspended
  - POST /stores
  - GET /stores/{id}
  - PATCH /stores/{id}
  - POST /stores/{id}/approve
  - POST /stores/{id}/suspend
  - GET /stores/{id}/staff
  - POST /stores/{id}/staff
  - DELETE /stores/{id}/staff/{userId}

- Categories
  - GET /categories
  - POST /categories
  - GET /categories/{id}
  - PATCH /categories/{id}
  - DELETE /categories/{id}

- Brands
  - CRUD as above

- Products
  - GET /products?store_id=&category_id=&q=
  - POST /products
  - GET /products/{id}
  - PATCH /products/{id}
  - DELETE /products/{id}
  - POST /products/{id}/images
  - DELETE /products/{id}/images/{imageId}
  - POST /products/{id}/variants
  - PATCH /products/{id}/variants/{variantId}
  - DELETE /products/{id}/variants/{variantId}
  - POST /products/{id}/attributes
  - PATCH /products/{id}/attributes/{attrId}
  - DELETE /products/{id}/attributes/{attrId}
  - POST /products/{id}/publish
  - POST /products/{id}/unpublish

- Orders
  - GET /orders?status=&code=&store_id=&user_id=
  - GET /orders/{id}
  - PATCH /orders/{id}/status {to_status}
  - POST /orders/{id}/refund {amount, reason}
  - GET /orders/{id}/timeline

- Payments
  - GET /payments?order_id=
  - POST /orders/{id}/payments (manual capture)

- Shipments
  - POST /orders/{id}/shipments
  - PATCH /shipments/{id} (update status/tracking)

- Reviews
  - GET /reviews/products?status=pending
  - PATCH /reviews/products/{id}/approve
  - PATCH /reviews/products/{id}/reject

- Coupons
  - CRUD endpoints

- Banners
  - CRUD endpoints

- CMS Pages
  - CRUD endpoints

- Tickets
  - GET /tickets
  - GET /tickets/{id}
  - POST /tickets/{id}/reply
  - PATCH /tickets/{id} (status)

Vendor REST API (prefix /api/vendor)
- Stores: GET self store, PATCH profile, addresses
- Products: same as admin but scoped to own store
- Orders: list own orders, update item/parcel statuses, print packing slips
- Coupons: scoped to own store (optional)
- Tickets: create and reply

App-Facing (public) Essentials (prefix /api/v1)
- Catalog: categories, brands, store list, product list/detail, search
- Social: follow store, wishlist
- Cart: create cart, add item, update, get totals
- Checkout: create order from cart, COD payment flag
- Orders: list my orders, order detail, cancel
- Reviews: create, list

Eloquent Models (suggested)
- Store, StoreStaff
- Category, Brand
- Product, ProductImage, ProductVariant, ProductAttribute
- InventoryMovement
- Cart, CartItem
- Order, OrderItem, OrderStatusHistory
- Payment, Shipment
- Coupon, CouponUser
- ProductReview, StoreFollow, Wishlist
- Banner, CmsPage
- SupportTicket, TicketMessage
- Address (morph)

Permissions (spatie examples)
- users.view/create/update/delete
- stores.view/approve/suspend/manage_staff
- categories.manage, brands.manage
- products.view/create/update/delete/publish
- orders.view/update/refund
- payments.view/capture
- shipments.view/update
- reviews.moderate
- coupons.manage, banners.manage, pages.manage
- settings.manage

Status Enums (reference)
- Order: pending, confirmed, packed, shipped, delivered, cancelled, refunded
- Payment: initiated, succeeded, failed, refunded
- Shipment: pending, shipped, in_transit, delivered, failed, returned
- Review: pending, approved, rejected
- Store: pending, active, suspended

Notes for Implementation in Laravel
- Use uuid/ulids for public references (order code), keep numeric PKs for joins
- Create policies per module and gate with spatie permissions
- Use API Resources for consistent response shapes
- Use form requests for validation and enum casting
- Maintain counters with Eloquent events (e.g., products_count on stores)
- Add jobs for email/OTP sending and order events

Mapping to Screens
- Stores list/details → stores, store_follows, products (by store)
- Category listing & grid → categories, products
- Product detail → products, images, variants, attributes, reviews
- Cart & Checkout → carts/items, orders/items, payments, shipments, addresses
- Profile, Wishlist, Followed Stores → users, wishlists, store_follows, addresses
- Terms, Privacy, Help & Support → cms_pages, support_tickets/messages

Migration Order
1) categories, brands, stores, store_staff
2) products, product_images, product_variants, product_attributes
3) addresses, carts, cart_items
4) orders, order_items, order_status_history, payments, shipments
5) reviews, wishlists, store_follows
6) coupons (+ coupon_user), banners, cms_pages
7) support_tickets (+ ticket_messages)

This spec aligns with the existing Laravel 12 + Passport + spatie/permission stack in this repository and is ready to implement with standard Eloquent models and resource controllers.

