# Daraz-Like Marketplace Project

## Overview
This project is already positioned as a multi-vendor marketplace for electronics and trader inventory. The current codebase uses:

- Laravel 12 for backend APIs and server-side application logic
- React 19 + TypeScript for the web UI
- Inertia.js for the admin web application
- Laravel Passport for OAuth-style API authentication
- Spatie Permission for roles and permissions
- Scribe for API documentation

The closest practical direction is:

- Laravel as the marketplace backend and admin API
- React.js as the customer-facing storefront
- Inertia React for the admin panel and internal dashboards
- `/api/app` as public catalog APIs
- authenticated `/api/milestone2` and `/api/*` routes for user commerce flows

## Current Product Vision
Build a website similar to Daraz with:

- home page with banners, featured products, top-selling products, and popular stores
- catalog browsing by category, subcategory, brand, and store
- product detail pages with images, pricing, discounts, and reviews
- customer authentication with OTP/email verification
- cart, wishlist, checkout, and order history
- multi-vendor store support
- admin catalog, store, order, promotion, and supplier management
- shop management tools for stock, sales, and customers

## Tech Stack

### Backend
- PHP 8.2
- Laravel 12
- Laravel Passport
- Laravel Fortify
- Spatie Laravel Permission
- Scribe

### Frontend
- React 19
- TypeScript
- Inertia.js React adapter
- Vite
- Tailwind CSS v4
- Radix UI

### Development and QA
- Pest
- PHPUnit
- ESLint
- Prettier
- Laravel Telescope
- Log Viewer

## Architecture

### 1. Admin Web App
Current admin screens are implemented with Laravel routes returning Inertia pages under `resources/js/pages/admin/*`.

Implemented modules include:

- categories
- subcategories
- articles
- brands
- products
- stores
- promotions
- orders
- shipments
- payments
- suppliers
- vendors

### 2. Public App API
Public catalog-style APIs are exposed under `/api/app/*`.

These are suitable for:

- React storefront
- mobile app
- headless frontend integration

### 3. Authenticated Commerce APIs
Authenticated user flows are split across:

- `/api/user/*`
- `/api/suggestions/*`
- `/api/milestone2/*`

These power:

- profile
- cart
- wishlist
- addresses
- checkout
- orders
- product reviews

### 4. Internal/Admin APIs
Admin and back-office APIs are exposed under `/api/admin/*` with permission-based middleware.

## Current Feature Coverage

### Marketplace Catalog
- categories listing
- subcategories listing
- brands listing
- store listing and store detail
- product listing with filtering
- product detail with related products
- promotions listing
- home API with featured/top-selling/store highlights

### User and Auth
- register
- login
- refresh token
- logout
- email OTP verification
- password reset OTP
- password change
- profile update
- social login hooks for Apple

### Shopping Experience
- wishlist
- cart
- save for later
- checkout validation
- shipping addresses
- COD order placement
- order history and invoice endpoints
- product review endpoints

### Admin and Operations
- catalog CRUD for categories, subcategories, articles, brands, and products
- product publish/unpublish
- product image management
- store approval/suspension
- order status management
- payment management
- shipment management
- supplier management
- stock/shop management modules

## API Inventory

### Public Auth APIs
| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/register` | Register customer |
| POST | `/api/login` | Login and issue access token |
| POST | `/api/refresh` | Refresh access token |
| POST | `/api/auth/apple` | Apple login hook |
| POST | `/api/auth/check-user` | Check social login user existence |
| POST | `/api/otp/email/send` | Send email verification OTP |
| POST | `/api/otp/email/verify` | Verify email OTP |
| POST | `/api/otp/password/send` | Send reset OTP |
| POST | `/api/otp/password/verify` | Verify reset OTP |
| POST | `/api/password/reset` | Reset password |

### Public Storefront APIs
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/app/home` | Home page payload |
| GET | `/api/app/categories` | Category list |
| GET | `/api/app/subcategories` | Subcategory list |
| GET | `/api/app/brands` | Brand list |
| GET | `/api/app/stores` | Store list |
| GET | `/api/app/stores/{store}` | Store detail |
| GET | `/api/app/products` | Product listing |
| GET | `/api/app/products/{product}` | Product detail |
| GET | `/api/app/products/category-counts` | Category product counts |
| GET | `/api/app/promotions` | Promotion list |
| POST | `/api/app/voice-search` | Voice search hook |

### Authenticated User APIs
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/user` | Current user profile |
| POST | `/api/user/update-profile` | Update profile |
| POST | `/api/user/logout` | Logout |
| DELETE | `/api/user/account` | Delete account |
| POST | `/api/password/change` | Change password |
| GET | `/api/suggestions` | Search history |
| POST | `/api/suggestions` | Save search suggestion |
| DELETE | `/api/suggestions/{id}` | Delete one suggestion |
| DELETE | `/api/suggestions` | Clear all suggestions |
| GET | `/api/suggestions/autocomplete` | Search autocomplete |

### Commerce APIs
| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/milestone2/cart` | View cart |
| POST | `/api/milestone2/cart` | Add item to cart |
| PUT | `/api/milestone2/cart/{item}` | Update cart item |
| DELETE | `/api/milestone2/cart/{item}` | Remove cart item |
| POST | `/api/milestone2/cart/{item}/save-for-later` | Save for later |
| GET | `/api/milestone2/cart/validate` | Validate checkout |
| DELETE | `/api/milestone2/cart/clear` | Clear active cart |
| GET | `/api/milestone2/wishlist` | View wishlist |
| POST | `/api/milestone2/wishlist/toggle` | Toggle wishlist item |
| POST | `/api/milestone2/wishlist/{item}/move-to-cart` | Move wishlist item to cart |
| GET | `/api/milestone2/addresses` | List addresses |
| POST | `/api/milestone2/addresses` | Add address |
| PUT | `/api/milestone2/addresses/{address}` | Update address |
| DELETE | `/api/milestone2/addresses/{address}` | Delete address |
| POST | `/api/milestone2/checkout/place-order` | Place COD order |
| GET | `/api/milestone2/orders` | Customer order list |
| GET | `/api/milestone2/orders/{order}` | Customer order detail |
| POST | `/api/milestone2/orders/{order}/reorder` | Reorder |
| POST | `/api/milestone2/orders/{order}/cancel` | Cancel order |
| POST | `/api/milestone2/orders/{order}/return` | Request return |
| GET | `/api/milestone2/orders/{order}/invoice` | Invoice |
| GET | `/api/milestone2/products/{product}` | Enhanced product detail |
| GET | `/api/milestone2/products/{product}/reviews` | Product reviews |
| POST | `/api/milestone2/products/{product}/reviews` | Add review |

### Admin APIs
| Module | Base Endpoint | Notes |
|---|---|---|
| Categories | `/api/admin/categories` | CRUD |
| Subcategories | `/api/admin/subcategories` | CRUD |
| Articles | `/api/admin/articles` | CRUD |
| Brands | `/api/admin/brands` | CRUD |
| Products | `/api/admin/products` | CRUD, publish, images |
| Stores | `/api/admin/stores` | CRUD, approve, suspend |
| Promotions | `/api/admin/promotions` | CRUD |
| Orders | `/api/admin/orders` | index, show, status, timeline, cancel, invoice |
| Payments | `/api/admin/payments` | index, show, refund, export, configure |
| Shipments | `/api/admin/orders/{order}/shipments` and `/api/admin/shipments/{shipment}` | create/update |
| Suppliers | `/api/admin/suppliers` | CRUD |
| Supplier Transactions | `/api/admin/supplier-transactions` | CRUD |
| Supplier Payments | `/api/admin/supplier-payments` | CRUD |
| Inventory | `/api/admin/inventory` | listing + download placeholder |
| Vendors | `/api/admin/vendors` | super-admin management |

## Important Filters and Response Patterns

### Product Listing
Current product listing already supports:

- `q`
- `category_id`
- `subcategory_id`
- `store_id`
- `is_featured`
- `is_top_selling`
- `sort_by`
- `sort_dir`
- `per_page`
- `page`

### Store Listing
Current store listing supports:

- `q`
- `per_page`
- `page`

### Promotion Listing
Current promotion listing supports:

- `device_type`
- `per_page`
- `page`

### Response Shape
Most app APIs follow a consistent base response:

```json
{
  "success": true,
  "message": "Some message",
  "data": {}
}
```

That is a good foundation for the React storefront.

## Frontend Implementation Plan

### Existing Frontend State
The current React codebase mostly covers:

- admin dashboard
- admin catalog management
- admin operations
- auth pages
- shop management pages

What is missing for a Daraz-like public website:

- customer home page
- customer category listing page
- customer product listing grid
- product detail page
- cart page
- wishlist page
- checkout page
- order history page
- store profile page

### Recommended Frontend Split

#### Option A: Keep Admin on Inertia, Build Storefront in React
Recommended.

- keep admin pages inside current Inertia app
- build public React storefront under a separate entry or route group
- use `/api/app/*` and `/api/milestone2/*` from the React storefront

#### Option B: Full Headless Split
- Laravel only serves APIs
- React serves both admin and storefront

This is possible, but it is more work because the current admin already depends on Inertia.

### Recommended Storefront Pages
1. Home
2. Categories
3. Product Listing
4. Product Detail
5. Store Page
6. Cart
7. Wishlist
8. Checkout
9. Orders
10. Account/Profile

## Backend Implementation Notes

### Authentication
- Passport is already used for API tokens
- web admin uses session auth + Inertia
- OTP verification is already implemented for email/password flows

### Catalog
- categories, subcategories, brands, articles, and products already exist
- products support images, discounts, stock, and warranty fields
- stores are first-class marketplace entities

### Commerce
- cart and wishlist are implemented
- checkout currently supports COD only
- order placement decrements stock
- order cancellation restores stock

### Admin Permissions
- permissions are module-based
- admin access is handled with Spatie roles/permissions
- modules like `products.view`, `products.create`, `orders.view`, `stores.approve` already exist

## API Review Findings

### 1. Route Structure Is Overloaded
The codebase currently serves:

- public app APIs
- authenticated mobile-style APIs
- session-auth admin APIs
- passport-auth admin APIs
- debug routes
- documentation routes

under overlapping `/api/*` namespaces.

Impact:
- harder API documentation
- duplicate URIs in route list
- more difficult frontend integration and SDK generation

Recommendation:
- separate namespaces by purpose:
  - `/api/public/*`
  - `/api/customer/*`
  - `/api/admin/*`
  - keep web-only Inertia endpoints outside duplicated API contracts

### 2. Duplicate Endpoints Exist for Some Resources
Route inventory shows duplicate URIs for several resources, for example:

- `/api/users/{user}`
- `/api/roles/{role}`
- `/api/admin/vendors/{vendor}`
- `/api/admin/orders/{order}/status`

This comes from mixing API routes and web-session `/api` routes.

Impact:
- confusing docs
- possible maintenance drift
- harder testing and client generation

Recommendation:
- choose one authoritative route per contract
- reserve the web session layer for Inertia-only actions if needed

### 3. Some Admin Endpoints Are Placeholder-Level
There are routes that exist but are not fully implemented business flows yet, including:

- inventory download
- invoice generation
- resend confirmation
- payment export
- payment gateway configuration

Impact:
- frontend may assume features are production-ready when they are not

Recommendation:
- mark these as `planned` or `partial` in docs
- avoid building UI that treats them as complete features until finished

### 4. Public Website Frontend Is Not Built Yet
The codebase has strong admin coverage, but not a real Daraz-style customer React website yet.

Impact:
- backend is ahead of frontend
- you still need a dedicated storefront implementation

Recommendation:
- start with Home, Product Listing, Product Detail, Cart, Checkout, Orders

### 5. Production Hardening Needs Attention
Route inventory includes:

- `docs/api`
- `log-viewer/*`
- `telescope/*`

These are useful for development, but they should be reviewed before production deployment.

Impact:
- operational and security risk if exposed without strict control

Recommendation:
- disable or strictly protect them in production

## Recommended Daraz-Style Roadmap

### Phase 1: Foundation
- finalize API namespaces
- confirm auth flow for customer storefront
- document stable response contracts
- hide or secure dev-only routes

### Phase 2: Customer Storefront
- build React home page
- build product listing and filters
- build product detail page
- integrate store pages

### Phase 3: Customer Commerce
- login/register flow
- wishlist and cart
- address book
- checkout
- order history

### Phase 4: Marketplace Polish
- ratings and reviews UI
- promotions and banners
- search suggestions and voice search
- vendor storefront enhancements

### Phase 5: Operations
- payment gateway integration beyond COD
- shipping workflows
- invoice/PDF generation
- analytics and reports

## Recommended Directory Strategy

### Backend
- `routes/api.php` for token-based APIs
- `routes/web.php` for Inertia admin pages only
- `app/Http/Controllers/Api/Public/*`
- `app/Http/Controllers/Api/Customer/*`
- `app/Http/Controllers/Api/Admin/*`

### Frontend
- `resources/js/pages/admin/*` for current Inertia admin
- `resources/js/storefront/*` for the public React website
- `resources/js/storefront/pages/*`
- `resources/js/storefront/components/*`
- `resources/js/storefront/lib/api.ts`

## Suggested Next Build Targets
If the goal is a Daraz-like Laravel + React website, the highest-value next steps are:

1. build the public React storefront shell
2. connect Home to `/api/app/home`
3. connect Product Listing to `/api/app/products`
4. connect Product Detail to `/api/app/products/{id}`
5. connect Cart/Wishlist/Checkout to `/api/milestone2/*`
6. standardize API namespaces and documentation before frontend grows further

## File References Used In This Review
- [routes/api.php](/C:/laragon/www/TraderApp/routes/api.php)
- [routes/web.php](/C:/laragon/www/TraderApp/routes/web.php)
- [app/Http/Controllers/Api/App/ProductController.php](/C:/laragon/www/TraderApp/app/Http/Controllers/Api/App/ProductController.php)
- [app/Http/Controllers/Api/App/StoreController.php](/C:/laragon/www/TraderApp/app/Http/Controllers/Api/App/StoreController.php)
- [app/Http/Controllers/Api/Milestone2/CartController.php](/C:/laragon/www/TraderApp/app/Http/Controllers/Api/Milestone2/CartController.php)
- [app/Http/Controllers/Api/Milestone2/CheckoutController.php](/C:/laragon/www/TraderApp/app/Http/Controllers/Api/Milestone2/CheckoutController.php)
- [app/Http/Controllers/Api/Milestone2/WishlistController.php](/C:/laragon/www/TraderApp/app/Http/Controllers/Api/Milestone2/WishlistController.php)
- [app/Http/Controllers/Api/Auth/LoginController.php](/C:/laragon/www/TraderApp/app/Http/Controllers/Api/Auth/LoginController.php)
- [composer.json](/C:/laragon/www/TraderApp/composer.json)
- [package.json](/C:/laragon/www/TraderApp/package.json)
