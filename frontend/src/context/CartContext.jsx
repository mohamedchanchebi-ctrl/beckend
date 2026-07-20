import React, { createContext, useState, useEffect, useContext } from 'react';
import apiClient from '../api/client';
import { AuthContext } from './AuthContext';

export const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const { isAuthenticated } = useContext(AuthContext);
  const [cart, setCart] = useState(null); // The cart object containing items
  const [loading, setLoading] = useState(true);

  const fetchCart = async () => {
    try {
      const res = await apiClient.get('/cart/');
      setCart(res.data);
    } catch (err) {
      console.error('Failed to fetch cart', err);
      setCart(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      setLoading(true);
      fetchCart();
    } else {
      setCart(null);
      setLoading(false);
    }
  }, [isAuthenticated]);

  const addItem = async (variantId, quantity = 1) => {
    if (!isAuthenticated) return;
    try {
      await apiClient.post('/cart/items/', { variant: variantId, quantity });
      await fetchCart(); // Re-fetch to get updated state (or we could update locally)
    } catch (err) {
      console.error('Failed to add item to cart', err);
      throw err;
    }
  };

  const updateQuantity = async (itemId, quantity) => {
    try {
      await apiClient.put(`/cart/items/${itemId}/`, { quantity });
      await fetchCart();
    } catch (err) {
      console.error('Failed to update quantity', err);
      throw err;
    }
  };

  const removeItem = async (itemId) => {
    try {
      await apiClient.delete(`/cart/items/${itemId}/`);
      await fetchCart();
    } catch (err) {
      console.error('Failed to remove item', err);
      throw err;
    }
  };

  const clearCart = async () => {
    try {
      await apiClient.delete('/cart/');
      await fetchCart();
    } catch (err) {
      console.error('Failed to clear cart', err);
      throw err;
    }
  };

  const cartTotal = cart?.items?.reduce((total, item) => {
    const variant = item.variant_details;
    if (!variant || !variant.product_details) return total;
    
    const basePrice = parseFloat(variant.product_details.base_price || 0);
    const modifier = parseFloat(variant.price_modifier || 0);
    const price = basePrice + modifier;
    
    return total + (price * item.quantity);
  }, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, addItem, updateQuantity, removeItem, clearCart, cartTotal }}>
      {children}
    </CartContext.Provider>
  );
};
