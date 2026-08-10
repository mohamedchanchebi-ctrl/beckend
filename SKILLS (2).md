# Backend Specification — Custom Stickers & Wall Art E-Commerce Platform

## 0. RULES FOR THE AI — READ FIRST, TREAT AS LAW

These rules override any assumption, convention, or "best practice" the AI might otherwise
default to. They apply for the entire duration of the project, not just the first task.

1. **This file is the single source of truth.** Every model, field, endpoint, business rule,
   and page listed below is the full and final scope. Nothing outside this document should be
   built, added, renamed, or restructured unless the user explicitly asks for it in the
   conversation.
2. **Do not invent features, endpoints, models, or fields.** If a task seems to need something
   not defined here (a new field, a new route, a new table), STOP and ask the user instead of
   assuming or adding it silently. No AI/BI features, no recommendation engine, no custom
   design/quotation workflow — these were explicitly cut from scope and must stay cut unless
   the user reverses that decision.
3. **No hallucinated libraries, packages, or APIs.** Only use the tools named in Section 1
   (Django, DRF, PostgreSQL, simplejwt, Stripe, React/Next). If a different package seems
   necessary, ask the user before introducing it.
4. **Re-read this file before starting any new task, and whenever something unexpected
   happens** — an error, an ambiguous requirement, a request that seems to contradict what's
   written here, or a long gap since it was last checked. Treat re-reading this file as the
   default recovery step, the same way you'd re-check a spec or a legal document before acting.
5. **If the current request conflicts with this file, say so explicitly** before proceeding —
   don't silently overwrite the spec's intent. Point out the conflict, then follow the user's
   explicit instruction (the live conversation always outranks this file), and note that the
   file should be updated to reflect the change.
6. **Keep this file updated.** If the user approves a change in scope (new feature, new
   endpoint, different stack choice), update this document to match before or immediately
   after implementing it, so it never drifts out of sync with the actual codebase.
7. **When unsure, prefer asking over guessing.** Silent assumptions are the main source of
   scope creep and wasted work on this project — this file exists specifically to prevent that.

---

This document describes the full backend scope of the project: data model, API endpoints,
business rules, and the pages each endpoint supports. Use this as the reference spec when
building or extending the backend.

**Scope note:** This is a standard e-commerce backend. No AI/BI features, no custom-design
upload/quotation workflow. Catalog-only products with variants (size, material, finish, color).

---

## 1. Tech Stack (chosen)

| Layer | Choice | Notes |
|---|---|---|
| Backend framework | **Django + Django REST Framework (DRF)** | Gives auth, ORM, and admin panel largely out of the box |
| Database | **PostgreSQL** | Relational, strong fit for orders/variants/FKs |
| Frontend | **React (Vite)** | Locked in — uni project, simplicity over SEO; Next.js was considered and rejected for this reason |
| Auth | **`djangorestframework-simplejwt`** (JWT: access + refresh token) | Chosen because frontend and backend are decoupled apps |
| Roles | `customer`, `admin` — Django's built-in `is_staff`/groups, or a `role` field on a custom User model | |
| Payments | **Stripe** (test mode) | Payment intents flow |
| Image storage | Local disk for dev → S3/Cloudinary when deploying | |
| Admin dashboard | **Django Admin only — locked in, no custom admin UI will be built.** All 7 admin pages in Section 5 are covered by Django Admin (product/category/variant CRUD via inlines, order management, customer list, discount CRUD). Custom report views (sales/top-products/low-stock) are exposed as simple Django Admin custom pages or templates reusing the existing `/api/admin/reports/*` logic — not a separate React admin app. | |
| Deployment | Backend+DB: **Render/Railway** — Frontend: **Vercel** | Deferred per user request — build and test locally first |

### Project structure convention

```
backend/
  config/            # Django project settings, urls.py, wsgi/asgi
  users/             # custom User model, auth serializers/views
  catalog/           # Category, Product, ProductVariant
  cart/               # Cart, CartItem
  orders/            # Order, OrderItem, checkout logic, Stripe integration
  reviews/
  wishlist/
  discounts/
  reports/           # admin report endpoints (SQL aggregates)
  manage.py

frontend/
  src/
    pages/
    components/
    api/             # API client functions (fetch/axios wrappers)
    context/         # AuthContext, CartContext (React Context — no Redux/Zustand)
```

### Backend/Frontend contract

- All endpoints below are DRF `ViewSet`/`APIView` routes, prefixed `/api/`.
- JWT access token sent as `Authorization: Bearer <token>` header from the frontend.
- Frontend keeps access token in memory (or short-lived storage) and refresh token in an httpOnly cookie if possible, to reduce XSS risk.

---

## 2. Data Model

### User
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| name | string | |
| email | string | unique |
| password_hash | string | |
| role | enum | `customer`, `admin` |
| created_at | datetime | |

### Category
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| name | string | |
| slug | string | unique, URL-friendly |
| parent_id | FK → Category | nullable, for subcategories |

### Product
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| name | string | |
| description | text | |
| base_price | decimal | |
| category_id | FK → Category | |
| images | array/string[] | image URLs |
| is_active | boolean | soft hide/show |
| created_at | datetime | |

### ProductVariant
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| product_id | FK → Product | |
| size | string | e.g. "small", "20x30cm" |
| material | string | e.g. "vinyl", "canvas" |
| finish | string | e.g. "matte", "glossy" |
| color | string | nullable |
| price_modifier | decimal | added/subtracted from base_price |
| stock_qty | int | |
| sku | string | unique |

### Cart
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| user_id | FK → User | |
| created_at | datetime | |

### CartItem
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| cart_id | FK → Cart | |
| variant_id | FK → ProductVariant | |
| quantity | int | |

### Order
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| user_id | FK → User | |
| status | enum | `pending`, `paid`, `processing`, `shipped`, `delivered`, `cancelled` |
| total | decimal | |
| shipping_address | json/string | |
| payment_ref | string | Stripe payment intent id |
| discount_code | string | nullable |
| created_at | datetime | |

### OrderItem
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| order_id | FK → Order | |
| variant_id | FK → ProductVariant | |
| quantity | int | |
| unit_price | decimal | price at time of purchase (snapshot) |

### Review
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| product_id | FK → Product | |
| user_id | FK → User | |
| rating | int | 1–5 |
| comment | text | nullable |
| created_at | datetime | |

### Wishlist
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| user_id | FK → User | |
| product_id | FK → Product | |

### Discount
| Field | Type | Notes |
|---|---|---|
| id | uuid/int | PK |
| code | string | unique |
| type | enum | `percentage`, `fixed` |
| value | decimal | |
| expires_at | datetime | |
| is_active | boolean | |

---

## 3. API Endpoints

### Auth
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| POST | /api/auth/register | Public | Create customer account | Register page |
| POST | /api/auth/login | Public | Login, returns token | Login page |
| POST | /api/auth/logout | Authenticated | Invalidate session/token | Navbar action |
| POST | /api/auth/refresh | Authenticated | Refresh access token | (background) |
| GET | /api/auth/me | Authenticated | Get current user profile | Account page |
| PUT | /api/auth/me | Authenticated | Update profile | Account settings page |

### Categories
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/categories | Public | List all categories (nested) | Navbar/menu, category filter |
| POST | /api/categories | Admin | Create category | Admin: category management |
| PUT | /api/categories/:id | Admin | Edit category | Admin: category management |
| DELETE | /api/categories/:id | Admin | Delete category | Admin: category management |

### Products
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/products | Public | List products (supports `?category=`, `?search=`, `?minPrice=`, `?maxPrice=`, `?sort=`, `?page=`) | Catalog / search results page |
| GET | /api/products/:id | Public | Product detail incl. variants + reviews | Product detail page |
| POST | /api/products | Admin | Create product | Admin: add product |
| PUT | /api/products/:id | Admin | Edit product | Admin: edit product |
| DELETE | /api/products/:id | Admin | Delete/deactivate product | Admin: product list |
| POST | /api/products/:id/variants | Admin | Add variant | Admin: edit product |
| PUT | /api/variants/:id | Admin | Edit variant (incl. stock) | Admin: edit product / inventory |
| DELETE | /api/variants/:id | Admin | Remove variant | Admin: edit product |

### Cart
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/cart | Customer | Get current cart | Cart page |
| POST | /api/cart/items | Customer | Add item to cart | Product page "Add to cart" |
| PUT | /api/cart/items/:id | Customer | Update quantity | Cart page |
| DELETE | /api/cart/items/:id | Customer | Remove item | Cart page |
| DELETE | /api/cart | Customer | Clear cart | Cart page |

### Checkout / Orders
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| POST | /api/checkout | Customer | Validate cart, apply discount, create payment intent | Checkout page |
| POST | /api/orders | Customer | Confirm order after payment success, deduct stock | Checkout success step |
| GET | /api/orders | Customer | List own orders | Order history page |
| GET | /api/orders/:id | Customer | Order detail + status/tracking | Order detail page |
| GET | /api/admin/orders | Admin | List all orders (filter by status) | Admin: orders page |
| PUT | /api/admin/orders/:id/status | Admin | Update order status | Admin: order detail |

### Reviews
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/products/:id/reviews | Public | List reviews for a product | Product detail page |
| POST | /api/products/:id/reviews | Customer | Submit review (only if purchased) | Product detail / order history |
| DELETE | /api/reviews/:id | Owner/Admin | Remove review | Account page / Admin moderation |

### Wishlist
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/wishlist | Customer | List wishlist items | Wishlist page |
| POST | /api/wishlist | Customer | Add product to wishlist | Product card/detail heart icon |
| DELETE | /api/wishlist/:productId | Customer | Remove from wishlist | Wishlist page |

### Discounts
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| POST | /api/discounts/validate | Customer | Check if a code is valid | Checkout page |
| GET | /api/admin/discounts | Admin | List discount codes | Admin: promotions page |
| POST | /api/admin/discounts | Admin | Create discount code | Admin: promotions page |
| PUT | /api/admin/discounts/:id | Admin | Edit discount code | Admin: promotions page |
| DELETE | /api/admin/discounts/:id | Admin | Delete discount code | Admin: promotions page |

### Customers (Admin)
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/admin/customers | Admin | List customers | Admin: customers page |
| GET | /api/admin/customers/:id | Admin | Customer detail + order history | Admin: customer detail |

### Reports (simple, no ML)
| Method | Endpoint | Access | Purpose | Powers page |
|---|---|---|---|---|
| GET | /api/admin/reports/sales?range= | Admin | Revenue totals by day/week/month | Admin dashboard |
| GET | /api/admin/reports/top-products | Admin | Best sellers by units/revenue | Admin dashboard |
| GET | /api/admin/reports/low-stock | Admin | Variants below stock threshold | Admin dashboard |

### Notifications (email triggers, not stored endpoints necessarily)
| Trigger | Channel | Purpose |
|---|---|---|
| Order placed | Email | Order confirmation |
| Order status changed | Email | Shipping/delivery updates |
| Low stock (admin) | Email/dashboard alert | Restock reminder |
| Account registered | Email | Welcome/confirmation email |

---

## 4. Business Rules (backend must enforce these)

- Stock is decremented only when an order is confirmed as paid, not when added to cart.
- Cart items should validate stock availability before checkout proceeds.
- `OrderItem.unit_price` is a snapshot — never recompute from current product price after purchase.
- A review can only be created by a user who has a `delivered` order containing that product.
- Discount codes: check `is_active` and `expires_at` before applying; reject expired/inactive codes.
- Only `admin` role can access any `/api/admin/*` route — enforce via middleware, not per-endpoint checks.
- Category deletion should be blocked or cascade-handled if products still reference it.

---

## 5. Frontend Pages This Backend Supports

**Public / Customer**
1. Home page
2. Catalog / category listing page (with filters + search)
3. Product detail page
4. Cart page
5. Checkout page (address, payment, discount code)
6. Order confirmation page
7. Order history page
8. Order detail / tracking page
9. Wishlist page
10. Account settings page
11. Login / Register pages

**Admin — covered entirely by Django Admin, no custom pages to build:**
1. Admin dashboard (summary stats: revenue, top products, low stock) — custom Django Admin page/template reusing `/api/admin/reports/*` logic
2. Product management (list, add, edit, delete) — Django Admin, `ProductVariantInline` already configured
3. Category management — Django Admin
4. Inventory / variant stock management — Django Admin (via `ProductVariantInline`)
5. Order management (list, filter by status, update status) — Django Admin, customize list_display/list_filter
6. Customer management (list, detail) — Django Admin
7. Discount/promotion management — Django Admin

---

## 6. Frontend Build Plan (React + Vite)

**Scope:** 11 customer-facing pages only. No admin frontend — Django Admin covers all admin
needs (see Section 5). SEO is not a priority for this project, so plain client-rendered React
is the right choice; no Next.js, no SSR.

### Project setup
- `npm create vite@latest frontend -- --template react`
- Routing: `react-router-dom`
- API client: a single `api/client.js` wrapping `fetch` (or `axios`), attaching the JWT
  `Authorization: Bearer <token>` header automatically, and handling 401 → refresh token retry
- State management: React Context is enough at this scale — one `AuthContext` (user, token,
  login/logout) and one `CartContext` (items, add/remove/update, totals). No Redux needed.
- Styling: keep simple — plain CSS modules or a lightweight utility framework. Aim for clean and professional-looking. Prioritize finishing all 11 pages functionally over polishing visual effects.

### Pages, routes, and what each one needs

| # | Page | Route | Key API calls | Notes |
|---|---|---|---|---|
| 1 | Home | `/` | `GET /api/products` (featured/recent subset), `GET /api/categories` | Simple landing page, category links, a few product cards |
| 2 | Catalog / category listing | `/products` or `/category/:slug` | `GET /api/products?category=&search=&minPrice=&maxPrice=&sort=&page=` | Filter sidebar, search bar, pagination |
| 3 | Product detail | `/products/:id` | `GET /api/products/:id`, `GET /api/products/:id/reviews`, `POST /api/cart/items`, `POST /api/wishlist`, `POST /api/products/:id/reviews` | Variant selector (size/material/finish/color) drives which `variant_id` gets added to cart; show `final_price` per variant |
| 4 | Cart | `/cart` | `GET /api/cart`, `PUT /api/cart/items/:id`, `DELETE /api/cart/items/:id`, `DELETE /api/cart` | Quantity steppers, remove buttons, running total |
| 5 | Checkout | `/checkout` | `POST /api/discounts/validate`, `POST /api/checkout` (creates Stripe PaymentIntent), Stripe.js `confirmCardPayment` | Address form, discount code field, Stripe Elements card input |
| 6 | Order confirmation | `/orders/:id/confirmation` | `GET /api/orders/:id` | Shown right after successful payment; simple thank-you + order summary |
| 7 | Order history | `/account/orders` | `GET /api/orders` | List of past orders with status badges, links to detail |
| 8 | Order detail / tracking | `/account/orders/:id` | `GET /api/orders/:id` | Full item list, status, shipping address |
| 9 | Wishlist | `/account/wishlist` | `GET /api/wishlist`, `DELETE /api/wishlist/:productId` | Grid of saved products, remove + add-to-cart actions |
| 10 | Account settings | `/account` | `GET /api/auth/me`, `PUT /api/auth/me` | Edit profile fields |
| 11 | Login / Register | `/login`, `/register` | `POST /api/auth/login`, `POST /api/auth/register` | On success, store tokens in `AuthContext`, redirect |

### Cross-cutting concerns

- **Protected routes**: `/checkout`, `/account/*` require auth — redirect to `/login` if no
  valid token, preserving the intended destination for post-login redirect
- **Cart persistence**: cart lives server-side (per SKILLS.md's `Cart` model tied to `User`), so
  on login, immediately `GET /api/cart` to hydrate `CartContext` — don't try to merge a
  logged-out local cart, since this spec has no anonymous/guest cart
- **Stripe integration**: use `@stripe/stripe-js` + `@stripe/react-stripe-js` on the Checkout
  page; the backend already exposes the PaymentIntent client secret from `POST /api/checkout`
- **Error handling**: a shared API error handler that surfaces DRF's `{"detail": "..."}` or
  field-level validation errors consistently across forms

### Suggested build order for the frontend

1. Project scaffold + routing + `AuthContext` + API client with token refresh
2. Login/Register pages — get auth working end-to-end first, everything else depends on it
3. Catalog + Product detail pages (read-only, no auth needed) — confirms the API integration works
4. Cart page + `CartContext` — add-to-cart from product detail, then build out the cart page
5. Checkout page + Stripe integration — the most involved page, budget the most time here
6. Order confirmation, history, and detail pages
7. Wishlist page
8. Account settings page
9. Polish pass: loading states, error states, empty states (empty cart, no orders yet, etc.)



## 7. Suggested Build Order (overall project)

### Backend (Steps 1–10 — ✅ COMPLETE, see PROGRESS.md)
1. **Project setup** — Django project + DRF installed, custom User model with `role` field, PostgreSQL connected, `simplejwt` configured
2. **Auth** — register/login/refresh endpoints, role-based permission classes (`IsAdminUser`, custom `IsCustomer`)
3. **Category + Product + Variant** — Django models + migrations, DRF serializers/viewsets, register in Django Admin for quick manual data entry, public GET routes for frontend
4. **Cart endpoints** — cart tied to authenticated user
5. **Checkout + Order creation + Stripe integration** — payment intent creation, webhook to confirm payment, stock deduction on confirmed order
6. **Order history/detail + admin order management** — customer-facing + admin-facing views
7. **Reviews + Wishlist**
8. **Discounts**
9. **Admin reports + Admin customers** — simple DRF endpoints wrapping Django ORM `.aggregate()`/`.annotate()` queries (no ML)
10. **Email notifications** — Django signals on order status changes and low-stock threshold crossings

### Frontend (Step 11 — next up, see Section 6 for full breakdown)
11. **Frontend build** — React + Vite, 11 customer-facing pages, following the build order in Section 6. No admin frontend needed — Django Admin covers all admin functionality.

### Deployment (Step 12 — deferred)
12. **Deployment** — currently deferred per user decision; build and test everything locally first. When ready: backend+DB to Render/Railway, frontend to Vercel, Stripe switched to live keys last.
