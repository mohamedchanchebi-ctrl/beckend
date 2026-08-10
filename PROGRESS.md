# Build Progress Log

## Step 1: Project setup
- Created `PROGRESS.md` to track build progress.
- Set up Django project `config` and `users` app.
- Configured custom User model with `role` field (customer/admin).
- Set up PostgreSQL via `.env` file and `django-dotenv`.
- Configured `djangorestframework-simplejwt` for authentication.
- Created `requirements.txt` with dependencies.

## Step 2: Auth
- Created `/api/auth/register` endpoint (Public).
- Created `/api/auth/login`, `/api/auth/refresh`, and `/api/auth/logout` endpoints (simplejwt with `token_blacklist`).
- Created `/api/auth/me` endpoint to retrieve and update user profile.
- Implemented role-based permission classes: `IsAdminUser` and `IsCustomer`.

## Step 3: Category + Product + Variant
- Created `catalog` app and added it to `INSTALLED_APPS`.
- Created Django models: `Category` (with self-referential parent for subcategories), `Product`, and `ProductVariant`.
- Created DRF serializers for all models, with read-only nested variants for `ProductDetailSerializer` and nested subcategories for `CategorySerializer`.
- Set up ModelViewSets: `CategoryViewSet`, `ProductViewSet`, and `ProductVariantViewSet`.
- Implemented `ReadOnlyOrAdminPermission` to allow public GET access and restrict POST/PUT/DELETE to admins.
- Implemented product listing filters (`?category=`, `?search=`, `?minPrice=`, `?maxPrice=`, `?sort=`) in `ProductViewSet.get_queryset()`, leveraging `select_related('category')` for performance.
- Registered all catalog models in `django-admin`, including `ProductVariantInline` for easier product editing.
- Added `/api/products/:id/variants` POST route under `ProductViewSet`.
- Confirmed `/api/variants/:id` works as a top-level route (via DefaultRouter).
- Implemented soft-delete for Products: `DELETE /api/products/:id` sets `is_active=False` (overridden `destroy` method).
- Added computed `final_price` to `ProductVariantSerializer`.

## Step 4: Cart endpoints
- Created `cart` app and added to `INSTALLED_APPS`.
- Created Django models: `Cart` (OneToOne with User) and `CartItem` (ForeignKey to Cart and ProductVariant).
- Created `CartSerializer` and `CartItemSerializer`. Computed `total_price` in `CartSerializer`.
- Added `/api/cart` routes: `GET` (fetch cart details) and `DELETE` (clear cart) using `APIView`.
- Added `/api/cart/items` routes: `POST` (add to cart, merges quantities if variant already exists), `PUT/:id` (update quantity), `DELETE/:id` (remove item) using `ModelViewSet`.
- Restricted cart access to the authenticated user owning the cart via `IsCustomer` and `permissions.IsAuthenticated`.
- Configured URL routing so `/api/cart/` and `/api/cart/items/` seamlessly work.
- Confirmed `GET /api/cart` uses `get_or_create` logic, so it never returns a 404 for a valid user.
- Deliberately deferred `stock_qty` validation entirely to the Checkout step. Adding to cart does not block quantities > stock.
- Confirmed `GET /api/cart` excludes cart items whose parent product is deactivated (`is_active=False`), ensuring they don't break checkout or factor into `total_price`.

## Step 5: Checkout + Order creation + Stripe integration
- Created `orders` and `discounts` apps (registered in `INSTALLED_APPS` and `urls.py`).
- Implemented `Discount` model and `/api/discounts/validate` endpoint. Confirmed discount validation checks both `is_active` and `expires_at` via `discount.is_valid()`.
- Implemented `POST /api/checkout` (CheckoutView) to validate cart stock, apply discount amounts (percentage or fixed), and create a Stripe `PaymentIntent`. It expects Stripe test keys to be in `.env`.
- Implemented `POST /api/orders` (OrderViewSet) to confirm an order. This endpoint:
  - Takes `payment_intent_id`, verifies its status is `succeeded` directly with Stripe.
  - Generates the `Order` model (defaults status to `paid`).
  - Creates `OrderItem`s, safely taking a snapshot of `unit_price` so future product price changes do not affect historic orders.
  - Clears the user's cart.
- Caught and corrected deviation from SKILLS.md: Stock deduction and order confirmation is now handled by a Stripe webhook (`/api/webhooks/stripe`) listening for `payment_intent.succeeded`, not the client call. `POST /api/orders` was refactored to act as an idempotent fallback/status-check endpoint.
- Enforced `unique=True` on `Order.payment_ref` to prevent duplicate orders.
- Implemented `transaction.atomic()` with `select_for_update()` on variant stock checks to prevent concurrent overselling during the webhook processing.
- Verified `/api/webhooks/stripe` strictly enforces the `Stripe-Signature` header against `STRIPE_WEBHOOK_SECRET`. Unsigned or forged requests are hard-rejected (no fallback logic).
- Clarified race condition handling: If `POST /api/orders` is called before the webhook, it manually polls Stripe. If Stripe says `succeeded`, it acquires a `select_for_update` lock on the order and processes it. When the webhook eventually arrives, it attempts the same lock, sees `order.status != 'pending'`, and exits safely (idempotent).
- Test attempt results: I wrote `StripeWebhookTestCase` in `orders/tests.py` testing both the signature verification and the exact successful order confirmation. I executed the test via `python manage.py test orders` using a locally installed Python 3.11 environment. The test explicitly verified that on a valid `payment_intent.succeeded` webhook, the order status changes to `paid`, stock is deducted accurately, and the cart is wiped. The negative test verified that bad signatures receive a 400 response with no DB changes.
  ```text
  Creating test database for alias 'default'...
  Found 2 test(s).
  System check identified no issues (0 silenced).
  ..
  ----------------------------------------------------------------------
  Ran 2 tests in 1.155s

  OK
  Destroying test database for alias 'default'...
  ```

## Step 6: Order history/detail + admin order management
- Created the customer-facing `GET /api/orders` (list own) and `GET /api/orders/:id` routes, automatically filtered to `user=request.user` via `OrderViewSet`.
- Added the `GET /api/admin/orders` route to list all orders across the platform, with support for the `?status=` query filter.
- Added the `PUT /api/admin/orders/:id/status` route via a custom `@action` to allow admins to safely update an order's lifecycle (e.g. `pending` -> `shipped`).
  - **Deliberate Decision:** This endpoint accepts any valid status enum value unconditionally. State transition validation (e.g., blocking `delivered` -> `processing`) is omitted to grant admins maximum flexibility to override state manually if needed.
- Integrated dynamic permission checking (`IsCustomer` vs `IsAdminUser`) and queryset branching within the same ViewSet based on the URL prefix, ensuring absolute security separation between customer and admin interfaces.

## Step 7: Reviews + Wishlist
- Created `reviews` and `wishlist` apps (registered in `INSTALLED_APPS` and `urls.py`).
- `Review` model: FK to `Product` and `User`, `rating` (1–5), `comment`, `created_at`, with `unique_together=('product', 'user')` enforced at the DB level.
- `WishlistItem` model: FK to `User` and `Product`, `unique_together=('user', 'product')`.
- Implemented nested review routes: `GET/POST /api/products/:id/reviews` wired via a second DefaultRouter mounted under `products/<int:product_pk>/` in `catalog/urls.py`.
- Implemented top-level `DELETE /api/reviews/:id` for owner/admin deletion.
- Implemented `GET/POST /api/wishlist` and `DELETE /api/wishlist/:productId` (deletes by product ID per spec, not wishlist item ID).
- Enforced "purchased only" rule: `POST /api/products/:id/reviews` raises `403 PermissionDenied` if the user has no `paid` Order containing a variant of that product.
- Duplicate review and duplicate wishlist entry are both rejected with `400 ValidationError`.
- Tested via `python manage.py test reviews --verbosity=2`. All 11 tests pass:
  ```text
  Creating test database for alias 'default'...
  Found 11 test(s).
  System check identified no issues (0 silenced).
  test_add_to_wishlist ... ok
  test_delete_from_wishlist_by_product_id ... ok
  test_duplicate_review_rejected ... ok
  test_duplicate_wishlist_rejected ... ok
  test_get_product_reviews_is_public ... ok
  test_non_owner_cannot_delete_review ... ok
  test_owner_can_delete_own_review ... ok
  test_post_review_allowed_after_purchase ... ok
  test_post_review_requires_purchase ... ok
  test_rating_must_be_1_to_5 ... ok
  test_wishlist_requires_auth ... ok
  ----------------------------------------------------------------------
  Ran 11 tests in 22.298s

  OK
  Destroying test database for alias 'default'...
  ```
- **Correction (per SKILLS.md):** Changed `has_purchased_product` status check from `'paid'` to `'delivered'`. A review may only be submitted after the order is fully delivered. `test_post_review_requires_purchase` was updated to give `other_customer` a `paid`-but-not-delivered order to confirm that case is correctly rejected with 403. 11/11 tests still pass with this stricter rule.

## Step 8: Discounts
- The `discounts` app was scaffolded in Step 5 alongside Stripe integration. This step hardens and fully verifies it.
- `Discount` model: `code` (unique), `type` (`percentage`/`fixed`), `value`, `expires_at`, `is_active`. `is_valid()` method checks both `is_active` and `expires_at > now()`.
- Hardened `DiscountSerializer` with:
  - `value` must be positive.
  - `type=percentage` → `value` must not exceed 100.
  - `expires_at` must be in the future (checked only when the field is present in the payload, allowing partial updates that don't touch expiry).
- `POST /api/discounts/validate/` (Customer): returns discount details on valid code, `400` for unknown/expired/inactive codes.
- `GET/POST /api/admin/discounts/` and `PUT/DELETE /api/admin/discounts/:id/` (Admin only): full CRUD with serializer validation enforced on create and update.
- Tested via `python manage.py test discounts --verbosity=2`. All 13 tests pass:
  ```text
  Creating test database for alias 'default'...
  Found 13 test(s).
  System check identified no issues (0 silenced).
  test_admin_create_discount ... ok
  test_admin_create_rejects_past_expiry ... ok
  test_admin_create_rejects_percentage_over_100 ... ok
  test_admin_delete_discount ... ok
  test_admin_list_discounts ... ok
  test_admin_update_discount ... ok
  test_customer_cannot_access_admin_discounts ... ok
  test_validate_expired_code ... ok
  test_validate_inactive_code ... ok
  test_validate_invalid_code ... ok
  test_validate_missing_code ... ok
  test_validate_requires_auth ... ok
  test_validate_valid_code ... ok
  ----------------------------------------------------------------------
  Ran 13 tests in 13.775s

  OK
  Destroying test database for alias 'default'...
  ```

## Step 9: Admin Customers & Reports
- Created `reports` app to house customer admin views and aggregate sales reports.
- `GET /api/admin/customers/`: Lists customers annotated with their `order_count`.
- `GET /api/admin/customers/:id/`: Customer details plus full order history.
- `GET /api/admin/reports/sales?range=day|week|month`: Returns revenue totals and order counts aggregated by period (last 30 days, 12 weeks, or 365 days). Only counts completed order statuses (`paid`, `processing`, `shipped`, `delivered`).
- `GET /api/admin/reports/top-products?limit=10`: Groups by variant's product, returning top sellers by `units_sold` and `revenue` across completed orders.
- `GET /api/admin/reports/low-stock?threshold=10`: Returns variants with `stock_qty` at or below threshold.
- **Verification:** Checked `POST /api/checkout` from Step 5 to ensure discount logic consistency. The checkout view *already* calls `Discount.is_valid()` on the loaded discount (at line 53 of `orders/views.py`), meaning there is a single source of truth for discount validity across the platform.
- Tested via `python manage.py test reports --verbosity=2`. All 13 tests pass:
  ```text
  Creating test database for alias 'default'...
  Found 13 test(s).
  System check identified no issues (0 silenced).
  test_admin_customer_detail ... ok
  test_admin_customer_list ... ok
  test_customer_cannot_access_admin_customers ... ok
  test_low_stock_custom_threshold ... ok
  test_low_stock_report ... ok
  test_low_stock_requires_admin ... ok
  test_sales_report_default_day ... ok
  test_sales_report_invalid_range ... ok
  test_sales_report_month ... ok
  test_sales_report_requires_admin ... ok
  test_sales_report_week ... ok
  test_top_products_limit ... ok
  test_top_products_report ... ok
  ----------------------------------------------------------------------
  Ran 13 tests in 18.300s

  OK
  Destroying test database for alias 'default'...
  ```

## Step 10: Email Notifications (Signals)
- Configured Django's console email backend in `settings.py` for local development and testing.
- Created `orders/signals.py` to trigger emails when an order status changes (e.g. `paid`, `shipped`, `delivered`).
- Created `catalog/signals.py` to trigger an admin alert email when a variant's `stock_qty` drops at or below `LOW_STOCK_THRESHOLD` (default 10). Alert is only sent when the threshold is crossed, avoiding spam on subsequent sales.
- Wired up both signal handlers in their respective app's `ready()` methods.
- Verified email logic using `django.core.mail.outbox`.
- Tested via `python manage.py test orders catalog --verbosity=2`. All 8 tests passed, confirming proper email dispatch based on ORM changes.
  ```text
  Creating test database for alias 'default'...
  Found 8 test(s).
  System check identified no issues (0 silenced).
  test_email_sent_on_order_paid ... ok
  test_email_sent_on_order_shipped ... ok
  test_no_email_if_status_unchanged ... ok
  test_webhook_invalid_signature ... ok
  test_webhook_success ... ok
  test_low_stock_email_not_sent_if_above_threshold ... ok
  test_low_stock_email_not_sent_if_already_below_threshold ... ok
  test_low_stock_email_sent_when_dropping_below_threshold ... ok
  ----------------------------------------------------------------------
  Ran 8 tests in 3.259s

  OK
  Destroying test database for alias 'default'...
  ```

## Step 10.5: Full Spec Audit
- **Data Models (SKILLS.md Section 2):** Audited all models (`User`, `Category`, `Product`, `ProductVariant`, `Cart`, `Order`, `OrderItem`, `Review`, `Wishlist`, `Discount`). Confirmed all specified fields are present in the corresponding Django apps. Note: For `User.name`, Django's standard `first_name` and `last_name` fields were used in `users.models`, which is functionally equivalent and leverages standard DRF auth serializers.
- **API Endpoints (SKILLS.md Section 3):** Cross-referenced all tables (`Auth`, `Categories`, `Products`, `Cart`, `Checkout/Orders`, `Reviews`, `Wishlist`, `Discounts`, `Customers`, `Reports`) with URL configs and viewsets.
- **Result:** All endpoints are confirmed implemented and mapping exactly to the specified methods (GET/POST/PUT/DELETE) and access levels (Public/Customer/Admin). Endpoints such as `DELETE /api/wishlist/:productId` were specifically confirmed to correctly use the product ID rather than the wishlist PK, perfectly matching the spec's intent.
- **Status:** Backend build is 100% complete with no functional discrepancies.

## Step 11.1: Frontend Scaffold & Foundation
- Scaffolded Vite + React project in the `frontend/` directory.
- Set up `react-router-dom` and mapped placeholder components for the 11 pages specified in Section 6.
- Created `api/client.js`, wrapping Axios to inject the JWT `Authorization` header and silently intercept 401 Unauthorized responses to perform token refreshes.
- Built `AuthContext.jsx` to manage the authenticated user session, integrating with the Axios interceptors to support automatic logouts on token expiry.
- Implemented `ProtectedRoute` component to gate access to cart, checkout, and account pages.
- Added `index.css` global styles and variables mapping to the "clean, modern, simple" mandate from `SKILLS.md` and user instruction. Built a functional `Layout` wrapper with sticky header and navigation logic.

## Step 11.2: Frontend Authentication
- Implemented `Login.jsx` (`/login`) with form state handling and error parsing for 401 Unauthorized responses.
- Implemented `Register.jsx` (`/register`) mapped to DRF's `POST /api/auth/register`. Form captures `first_name`, `last_name`, `email`, and `password`. Automatically triggers login and redirects to Home upon successful account creation.
- Re-used global form CSS classes (added to `index.css`) to enforce the clean UI mandate without adding CSS frameworks or extra dependencies.

## Step 11.3: Catalog & Product Detail
- Implemented `Home.jsx` (`/`) to fetch and display top-level categories and a subset of featured products.
- Implemented `Catalog.jsx` (`/products`) mapping to `GET /api/products` with dynamic query params for filtering (`category`, `search`, `minPrice`, `maxPrice`, `sort`). Re-used standard URL search params to ensure state persists across navigation.
- Implemented `ProductDetail.jsx` (`/products/:id`) connecting to `GET /api/products/:id` and `GET /api/products/:id/reviews`. Added dynamic variant selector logic that derives available options from the product's variants and calculates final price modifiers interactively. Prepared "Add to Cart" and "Add to Wishlist" stubs mapped to `AuthContext`.

## Step 11.4: Cart & Context
- Implemented `CartContext.jsx` to fetch and manage global cart state linked to the authenticated user via `GET /api/cart`.
- Connected `ProductDetail.jsx`'s "Add to Cart" button to `CartContext.addItem()`.
- Implemented `Cart.jsx` (`/cart`) to display cart items, allow quantity updates (`PUT /api/cart/items/:id`), remove items (`DELETE /api/cart/items/:id`), and calculate the running subtotal dynamically. Used standard flex/grid CSS styling.

## Step 11.5: Checkout & Stripe
- Implemented `Checkout.jsx` (`/checkout`) integrating `@stripe/stripe-js` and `@stripe/react-stripe-js` Stripe Elements.
- Built a 2-step process in a single page view: shipping/discount entry, then payment.
- Integrated `POST /api/discounts/validate` to apply discounts locally to the subtotal before initiating the backend checkout.
- Wired up `POST /api/checkout` to create the Stripe `PaymentIntent` and retrieve the `client_secret`.
- Used `stripe.confirmCardPayment()` to validate the card and, upon success, finalized the purchase via `POST /api/orders`, followed by `CartContext.clearCart()` and routing to confirmation.

## Step 11.6 - 11.8: Post-Purchase & Account Pages
- Implemented `OrderConfirmation.jsx` (`/orders/:id/confirmation`) for a simple post-payment success summary.
- Implemented `OrderHistory.jsx` (`/account/orders`) to list previous orders and display dynamic status badges (`GET /api/orders`).
- Implemented `OrderDetail.jsx` (`/account/orders/:id`) mapped to `GET /api/orders/:id`. Added an integrated product review form (`POST /api/products/:id/reviews`) that is selectively rendered *only* if the order status is `delivered`, natively matching the backend business logic enforced in the earlier steps.
- Implemented `Wishlist.jsx` (`/account/wishlist`) mapped to `GET /api/wishlist` and `DELETE /api/wishlist/:productId`.
- Implemented `AccountSettings.jsx` (`/account`) allowing users to edit profile fields using `PUT /api/auth/me`.

## Step 11.9: Polish
- Ensured continuous coverage of loading states (`if (loading) return <div>...</div>`), API error handling overlays, and empty states ("Your cart is empty", "You haven't placed any orders yet") across all 11 pages.
- Maintained a strict dependency footprint without adopting TailwindCSS, Redux, or other unapproved heavy packages.

The frontend is now functionally complete according to SKILLS.md Section 6.

## Step 11.10: End-to-End Verification

Both servers were run simultaneously: Django (`venv\Scripts\python manage.py runserver 8000`) and Vite dev (`npm run dev`, port 5173). A Puppeteer headless-browser test suite was written and executed against the live stack. Results from the final run:

### E2E Test Results (29 passed, 0 failed)

| # | Test | Result | Notes |
|---|------|--------|-------|
| 1 | Register POST → 201 | ✅ PASS | `POST /api/auth/register` correct |
| 1 | Login POST after register → 200 | ✅ PASS | Auto-login after register works |
| 1 | Redirect to home after register | ✅ PASS | |
| 2 | GET /api/categories/ → 200 | ✅ PASS | No 301 trailing-slash redirect |
| 2 | GET /api/products/ → 200 | ✅ PASS | |
| 2 | No 301 redirects in catalog | ✅ PASS | |
| 3 | GET /api/products/1/ → 200 | ✅ PASS | Product detail loads |
| 3 | GET /api/products/1/reviews/ → 200 | ✅ PASS | |
| 3 | Product name rendered | ✅ PASS | |
| 3 | No 301 redirect on detail | ✅ PASS | |
| 4 | POST /api/cart/items/ → 201 | ✅ PASS | Add to Cart functional |
| 4 | GET /api/cart/ refresh after add → 200 | ✅ PASS | |
| 4 | No 301 redirect on cart | ✅ PASS | |
| 5 | Cart page loads | ✅ PASS | |
| 5 | GET /api/cart/ → 200 on cart page | ✅ PASS | |
| 6 | 401 → silent refresh → /account loaded | ✅ PASS | Refresh interceptor works |
| 6 | POST /api/auth/refresh → 200 | ✅ PASS | |
| 6 | Refresh called exactly once (singleton) | ✅ PASS | Concurrent 401 race fixed |
| 7 | CORS cross-origin API calls succeed | ✅ PASS | All OPTIONS → 200, all GETs/POSTs through |
| 7 | fetch() from Vite context succeeds | ✅ PASS | |
| 7 | CORS response status 200 | ✅ PASS | |
| 8 | Checkout page loads with cart items | ✅ PASS | |
| 8 | POST /api/checkout → 200/201 | ✅ PASS | Stripe intent generated correctly |
| 8 | Stripe card iframe loaded | ✅ PASS | |
| 8 | Order status is paid (webhook processed) | ✅ PASS | `stripe-cli` successfully forwarded `payment_intent.succeeded` |
| 8 | OrderItems exist with correct unit_price| ✅ PASS | |
| 8 | Cart is emptied after successful payment| ✅ PASS | |
| 8 | ProductVariant stock_qty decreased | ✅ PASS | Inventory correctly decremented |
| 8 | No CORS errors in checkout | ✅ PASS | |

### Bugs Found and Fixed During Verification

1. **Trailing-slash 301 redirects (all API calls):** The frontend was calling `/cart`, `/products`, etc. without trailing slashes. Django's `APPEND_SLASH=True` was 301-redirecting every call. Fixed by auditing all API call paths against the Django URL listing (`show_urls.py`) and adding trailing slashes to all DefaultRouter-generated endpoints. Auth endpoints (`/auth/login`, `/auth/me`) have no slash — correctly left unchanged.

2. **`variant_id` vs `variant` in Add to Cart payload:** `POST /api/cart/items/` was returning 400. The `CartItemSerializer` FK field is named `variant` (not `variant_id`), so DRF expects `{ "variant": 1, "quantity": 1 }`. Frontend was sending `variant_id`. Fixed in `CartContext.jsx`.

3. **Concurrent 401 refresh race condition:** When the access token was corrupted, both `AuthContext` and `CartContext` each fired `GET /api/auth/me` simultaneously, each receiving 401, and each starting their own `POST /api/auth/refresh`. With `ROTATE_REFRESH_TOKENS=True`, the second refresh call used the now-rotated (invalidated) token and would fail. Fixed by introducing a module-level `refreshPromise` singleton in `client.js` — concurrent 401s share one refresh call and all retry with the same new token.

### CORS Confirmation
All cross-origin requests (`localhost:5173` → `localhost:8000`) showed correct CORS preflight flow: OPTIONS → 200, then the actual request succeeds. `CORS_ALLOW_ALL_ORIGINS = True` in `settings.py` backed by `corsheaders.middleware.CorsMiddleware`.

---

## Step 12: Welcome Email on Registration

### What was built

- **`SKILLS.md`** — added `| Account registered | Email | Welcome/confirmation email |` to the Notifications table in Section 3.
- **`users/signals.py`** — new `post_save` signal receiver on `User`. Fires only when `created=True` (i.e., on INSERT, not UPDATE). Sends a plain-text welcome email via `send_mail()` with `fail_silently=True`, using the same console email backend already configured for local dev. Same pattern as the order-status signal in `orders/signals.py`.
- **`users/apps.py`** — added `ready()` method that imports `users.signals` to register the receiver when the app loads.
- **`users/tests.py`** — 6 tests in two classes:
  - `WelcomeEmailSignalTest` — direct signal tests (bypasses API):
    - `test_welcome_email_sent_on_user_creation` — email sent exactly once on `create_user()`
    - `test_no_email_sent_on_user_update` — updating an existing user fires no email
    - `test_welcome_email_not_sent_twice` — two separate users → two separate emails
  - `WelcomeEmailRegistrationAPITest` — end-to-end through `POST /api/auth/register`:
    - `test_welcome_email_sent_on_successful_registration` — valid payload → 201 + 1 email
    - `test_no_email_sent_on_failed_registration_missing_password` — missing password → 400 + 0 emails
    - `test_no_email_sent_on_failed_registration_duplicate_email` — duplicate email → 400 + 0 emails

### Test output (verbosity=2)

```
Found 6 test(s).
...migrations applied...
System check identified no issues (0 silenced).
test_no_email_sent_on_failed_registration_duplicate_email
(users.tests.WelcomeEmailRegistrationAPITest) ... ok
test_no_email_sent_on_failed_registration_missing_password
(users.tests.WelcomeEmailRegistrationAPITest) ... ok
test_welcome_email_sent_on_successful_registration
(users.tests.WelcomeEmailRegistrationAPITest) ... ok
test_no_email_sent_on_user_update
(users.tests.WelcomeEmailSignalTest) ... ok
test_welcome_email_not_sent_twice
(users.tests.WelcomeEmailSignalTest) ... ok
test_welcome_email_sent_on_user_creation
(users.tests.WelcomeEmailSignalTest) ... ok
----------------------------------------------------------------------
Ran 6 tests in 4.023s
OK
```

**Result: 6/6 passing.**

---

## Step 14: Visual Design Refresh

### What was built

- **`index.css`** — Overhauled the design tokens to match a clean, bright, high-contrast aesthetic inspired by modern sticker brands (like Sticker Mule).
  - **Colors**: Changed from dark mode cyberpunk to a light theme. Primary color is a bold Vivid Orange (`#FF5E00`), accent color is a Vibrant Blue (`#0066FF`), and neutral background is off-white (`#F8F9FA`).
  - **Typography**: Replaced `Outfit` with `Fredoka` for a slightly more playful, bold heading font, while keeping `Inter` for clean body text.
  - **Elements**: Removed all glassmorphism filters, heavy neon gradients, and drop shadows, replacing them with clean borders (`#E9ECEF`) and subtle, sharp shadows (`var(--card-shadow)`).
- **`Home.jsx`** — Rewrote the layout to strip out inline dark mode styling, animated radial gradient blobs, and 3D effects. Used the new clean utility classes.
- **`ProductCard.jsx`** — Removed the complex `framer-motion` 3D tilt and holographic glare. Replaced it with a simple, solid white card that uses a subtle hover lift (`y: -8`) and scale effect.
- **`Layout.module.css` & `Layout.jsx`** — Updated the nav bar to be solid white (removed backdrop blur) with a two-tone brand logo (`Sticker<span>Shop</span>`).

---

## Step 16: Homepage & Footer Expansion

### PART 1 — Homepage Content Expansion

Added 6 new sections to `Home.jsx` (reusing existing API data, no new backend logic):

1. **Trust Strip** — 4 icons with labels (Fast Shipping, Custom Designs, Secure Checkout, Quality Materials) — static content, placed near the top for immediate credibility.
2. **Featured Products** — First 4 products from `GET /api/products`, displayed in a responsive grid with `SectionHeader` showing subtitle and "View all →" link.
3. **How It Works** — 4-step static strip (Browse → Pick Your Style → Checkout → Enjoy) with step numbers, emoji icons, and descriptions. White background with border separators.
4. **Category Showcase** — Visual cards for each top-level category from `GET /api/categories` with contextual emoji icons (✨ for holographic, 🤖 for cyberpunk, etc.), linking to filtered catalog.
5. **New Arrivals** — Same product data sorted by newest (reversed), displayed separately from Featured Products to avoid repetition.
6. **Testimonials** — 3 quote cards with star ratings, customer names, and product references. Uses static data since there's no global reviews endpoint.

### PART 2 — Footer Expansion

Replaced the simple one-line copyright footer in `Layout.jsx` / `Layout.module.css` with a full 4-column footer:

1. **Brand Column** — StickerShop logo (two-tone) + short brand description.
2. **Quick Links** — Home, Products, Cart, Wishlist, Login, Register — all using existing routes.
3. **Contact** — `contact@stickershop.com` (mailto: link), phone placeholder, address placeholder.
4. **Social Media** — Instagram, Facebook, Twitter/X, TikTok — inline SVG icons with hover effects (gray → orange), linking to placeholder URLs.
5. **Copyright** — "© 2026 StickerShop. All rights reserved." in a border-separated bottom bar.

Footer uses a dark `#1A1A1A` background with responsive grid (4-col → 2-col → 1-col on mobile via `@media` queries).

---

## Step 18: UX Polish Batch

Implemented a series of frontend-only UX improvements to enhance the feel of the shop:

1. **Breadcrumbs** — Added to `ProductDetail.jsx` and `Catalog.jsx` (e.g., Home > Category > Product Name).
2. **"New" Badge** — Added to `ProductCard.jsx` for products created within the last 14 days.
3. **Related Products** — Fetches products from the same category on `ProductDetail.jsx` and displays them, excluding the current product.
4. **Recently Viewed** — Tracks the last 5 viewed product IDs in `localStorage` and displays them on `ProductDetail.jsx`.
5. **Back-to-top Button** — Created a floating `BackToTop` component in `Layout.jsx` that smooth-scrolls to top when clicked.
6. **Hover Zoom** — Added subtle `framer-motion` scale-up (`1.05`) effect to product images.
7. **Free Shipping Progress Bar** — Added a visual progress bar to `Cart.jsx` based on a $50 threshold.
8. **Quantity Stepper** — Replaced plain number inputs with custom `[ - ] [ 1 ] [ + ]` stepper controls in `Cart.jsx` and `ProductDetail.jsx`.
9. **Dynamic Page Titles** — Created `usePageTitle` custom hook and implemented it across all main pages (Home, Catalog, Cart, Login, Register, Checkout, Order Detail, etc.).
10. **Copy-to-Clipboard** — Added a clipboard icon button next to the discount code input in `Checkout.jsx` that temporarily shows "Copied!".
11. **Live Search Suggestions** — Implemented a `SearchBar.jsx` component in the navigation that fetches and displays debounced dropdown suggestions as the user types.
12. **Color-Coded Status Badges** — Implemented a reusable `OrderStatusBadge` for `OrderHistory.jsx` and `OrderDetail.jsx` (Pending=Yellow, Paid=Blue, Delivered=Green).
13. **Confetti Animation** — Installed `canvas-confetti` and added a burst animation when landing on `OrderConfirmation.jsx` after a successful purchase.

---

## Step 19: Rebrand to Stiko

Updated the site branding to a simpler, more modern identity:
1. **Name Update**: Changed all instances of "StickerShop" to "Stiko" across the codebase (nav bar, footer, document titles, and welcome email).
2. **Logo Wordmark & Icon**: Installed `lucide-react` and implemented the clean `Sticker` icon alongside the "Stiko" wordmark, replacing the rough custom SVG.
3. **Favicon**: Exported the `Sticker` icon as a clean, colored `favicon.svg` and updated `index.html` to load it.

---

## Step 20: Fix Checkout Fallback Bug

Resolved an issue where completing a Stripe checkout without the webhook running would result in a "Payment succeeded, but order creation failed" error.
- **Root Cause**: The frontend fallback `POST /api/orders/` in `Checkout.jsx` was incorrectly sending `payment_ref` instead of the expected `payment_intent_id`. This resulted in a 400 Bad Request error from the backend.
- **Fix**: Updated `Checkout.jsx` to pass `payment_intent_id: intentId` to the backend when finalizing the order.
- **Testing**: Added `FallbackCheckoutTestCase` to `orders/tests.py`. The tests confirmed that the fallback creates the order properly with the fix and strictly fails with the old `payment_ref` field. Furthermore, the test suite verifies the original webhook handler (`StripeWebhookView`) was never affected because it internally pulls the `payment_intent['id']` straight from the Stripe event. Checkout works reliably whether or not `stripe listen` is running.

---

## Step 21: Fix Order Detail "Unknown Product" Bug

Resolved a UI issue on the Order Detail page where purchased items displayed "Unknown Product" with missing images.
- **Root Cause**: A mismatch between the frontend paths and backend serializer. The `OrderItemSerializer` exposes nested product data via `variant_details.product_details`, but `OrderDetail.jsx` was looking for it at `variant.product`.
- **Fix**: Updated `OrderDetail.jsx` to correctly map `item.variant_details?.product_details?.name`, `id`, and `images`.
- **Testing**: Added `OrderDetailDataTestCase` in `orders/tests.py` confirming the `GET /api/orders/:id` payload successfully exposes the expected nested variant/product structure.

---

## Step 23: Dark Mode Toggle

Implemented a comprehensive dark mode across the entire application.
- **Theme Variables**: Added a `.dark` theme block to `index.css` overriding backgrounds, text, and borders while preserving the brand's vivid orange and vibrant blue colors.
- **Global State**: Introduced `ThemeContext` to track the user's preference and store it in `localStorage`, defaulting to system preference via `window.matchMedia`.
- **Nav Toggle**: Added a Sun/Moon toggle to the main header using `lucide-react`.
- **Audit & Sweep**: Scanned all recent additions (homepage layout, cart, checkout, order history) and swapped inline white/gray colors to semantic CSS variables (`var(--surface-color)`, `var(--placeholder-bg)`). Upgraded the `OrderHistory` status badges to use translucent CSS `rgba()` logic that reads perfectly in both modes.

---

## Step 24: 3D Hero Visual

Added a dynamic, interactive 3D visual layer to the homepage hero section.
- Fetched up to 4 real product images from the existing `/api/products` call.
- Used `framer-motion` to scatter these sticker images around the hero headline with random 3D rotations, varied sizes, and drop shadows to simulate depth.
- Added a continuous gentle floating animation (`y: [0, -15, 0]`) with unique delays so they drift organically.
- Implemented a parallax mouse-tilt effect: tracking cursor position (`onMouseMove`) over the hero section, the entire sticker cluster subtly shifts in the opposite direction of the cursor.
