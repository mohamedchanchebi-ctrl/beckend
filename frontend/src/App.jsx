import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';

// Pages
import Home from './pages/Home';
import Catalog from './pages/Catalog';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderConfirmation from './pages/OrderConfirmation';
import OrderHistory from './pages/OrderHistory';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import AccountSettings from './pages/AccountSettings';
import Login from './pages/Login';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />}>
        {/* Public Routes */}
        <Route index element={<Home />} />
        <Route path="products" element={<Catalog />} />
        <Route path="products/:id" element={<ProductDetail />} />
        <Route path="login" element={<Login />} />
        <Route path="register" element={<Register />} />
        
        {/* Protected Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="cart" element={<Cart />} />
          <Route path="checkout" element={<Checkout />} />
          <Route path="orders/:id/confirmation" element={<OrderConfirmation />} />
          <Route path="account" element={<AccountSettings />} />
          <Route path="account/orders" element={<OrderHistory />} />
          <Route path="account/orders/:id" element={<OrderDetail />} />
          <Route path="account/wishlist" element={<Wishlist />} />
        </Route>
      </Route>
    </Routes>
  );
}

export default App;
