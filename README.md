# Stiko

Stiko is a modern, full-stack e-commerce application tailored for premium die-cut stickers and holographic prints. Built with a decoupled architecture, it uses a Django REST Framework backend and a React (Vite) frontend.

## Features

### 🛍️ E-Commerce Core
- **Product Catalog**: Browse products with detailed categories, variants (size, material, finish), and dynamically adjusted prices based on variant selections.
- **Shopping Cart**: Real-time cart management with quantity adjustments, free shipping progress bar, and persistent storage.
- **Secure Checkout**: Integrated with Stripe for secure payment processing using `PaymentIntent` and elements, complete with robust backend webhook handlers to reliably record orders.
- **Discount Codes**: Apply and validate promotional codes during checkout.
- **Order Management**: Users can view their order history, check order status (Pending, Paid, Shipped, Delivered), and see detailed order breakdowns.

### 🎨 Design & UX
- **Dynamic 3D Hero Section**: An interactive, parallax-driven 3D sticker cluster powered by `framer-motion` greets users on the homepage.
- **Comprehensive Dark Mode**: A seamless dark mode toggle via `ThemeContext` that stores user preference and completely re-themes the application with adaptive CSS variables.
- **Micro-Animations**: Smooth page transitions, hover states, marquee banners, and satisfying button clicks implemented globally.
- **Lucide Icons**: Clean and consistent iconography utilized across the navigation and UI elements.

### 👤 User Features
- **Authentication**: JWT-based login and registration system.
- **Wishlist**: Save favorite stickers for later and move them to the cart instantly.
- **Product Reviews & Ratings**: Verified buyers can leave star ratings and reviews on products they've purchased.

---

## Tech Stack

### Frontend
- **React 18** (Bootstrapped with Vite)
- **React Router DOM** (Client-side routing)
- **Framer Motion** (Complex animations and 3D parallax effects)
- **Stripe React Elements** (Payment UI)
- **Lucide React** (Icons)
- **Vanilla CSS** (CSS variables for robust theme management)

### Backend
- **Django 5.x** (Core framework)
- **Django REST Framework (DRF)** (API endpoints)
- **Stripe Python SDK** (Payment processing & webhook verification)
- **SQLite** (Default database for local development)
- **SimpleJWT** (Authentication)

---

## Getting Started

### Prerequisites
- Node.js (v18+)
- Python (3.10+)
- Stripe Account (for payment processing)

### Backend Setup

1. **Navigate to the backend directory** (where `manage.py` lives).
2. **Activate the virtual environment**:
   ```bash
   .\venv\Scripts\activate
   ```
3. **Install Dependencies** (if not already installed):
   ```bash
   pip install -r requirements.txt
   ```
4. **Environment Variables**: Create a `.env` file in the root containing your Stripe Secret Key, Stripe Webhook Secret, and other configurations.
5. **Run Migrations & Seed**:
   ```bash
   python manage.py migrate
   python seed.py
   ```
6. **Start the Server**:
   ```bash
   python manage.py runserver 8000
   ```

### Frontend Setup

1. **Navigate to the frontend directory**:
   ```bash
   cd frontend
   ```
2. **Install Dependencies**:
   ```bash
   npm install
   ```
3. **Start the Development Server**:
   ```bash
   npm run dev
   ```
4. Open [http://localhost:5173](http://localhost:5173) to view the application.

---

## Development & Testing

- **Backend Tests**: Run Django unit tests focusing on the API logic and webhook resiliency using:
  ```bash
  python manage.py test
  ```
- **E2E Tests**: Playwright is configured to run end-to-end tests across the full application flow.
- **Stripe CLI**: To test checkouts locally, run the stripe CLI to forward webhooks to `http://localhost:8000/api/webhooks/stripe/`.
dashboard django:
Email: admin@stiko.com
Password: admin
