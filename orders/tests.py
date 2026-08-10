import json
import time
import hmac
import hashlib
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.conf import settings
from users.models import User
from catalog.models import Category, Product, ProductVariant
from cart.models import Cart, CartItem
from orders.models import Order, OrderItem

class StripeWebhookTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.secret = 'whsec_test_secret'
        settings.STRIPE_WEBHOOK_SECRET = self.secret

        self.user = User.objects.create_user(email='test@example.com', password='password')
        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.product = Product.objects.create(name='Test Product', description='Test', base_price='10.00', category=self.category)
        self.variant = ProductVariant.objects.create(product=self.product, size='M', material='Vinyl', finish='Matte', stock_qty=5, sku='TEST-SKU-1', price_modifier='2.00')

        # Create a pending order as CheckoutView would
        self.payment_intent_id = 'pi_test_123'
        self.order = Order.objects.create(
            user=self.user,
            status='pending',
            total='12.00',
            shipping_address={"line1": "123 Test St"},
            payment_ref=self.payment_intent_id
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant,
            quantity=2,
            unit_price='12.00'
        )
        
        # Create a cart that should be cleared by the webhook (actually CheckoutView clears cart, 
        # but the prompt said "stock is deducted, and the cart is cleared" in webhook.
        # Wait, if CheckoutView clears cart, the webhook shouldn't have to.
        # But let's create a cart and see if the webhook tries to clear it or if we should add cart clearing to webhook)
        self.cart = Cart.objects.create(user=self.user)
        self.cart_item = CartItem.objects.create(cart=self.cart, variant=self.variant, quantity=2)

    def generate_signature(self, payload_body):
        timestamp = str(int(time.time()))
        signed_payload = f"{timestamp}.{payload_body}"
        signature = hmac.new(
            self.secret.encode('utf-8'),
            signed_payload.encode('utf-8'),
            hashlib.sha256
        ).hexdigest()
        return f"t={timestamp},v1={signature}"

    def test_webhook_success(self):
        payload = {
            "id": "evt_test",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": self.payment_intent_id
                }
            }
        }
        payload_body = json.dumps(payload)
        sig_header = self.generate_signature(payload_body)

        response = self.client.post(
            reverse('stripe-webhook'),
            data=payload_body,
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE=sig_header
        )
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        # Verify order status
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'paid')
        
        # Verify stock deduction
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_qty, 3) # 5 - 2 = 3
        
        # Cart clearing test
        self.assertEqual(CartItem.objects.filter(cart=self.cart).count(), 0)

    def test_webhook_invalid_signature(self):
        payload = {
            "id": "evt_test",
            "type": "payment_intent.succeeded",
            "data": {
                "object": {
                    "id": self.payment_intent_id
                }
            }
        }
        payload_body = json.dumps(payload)
        sig_header = "t=12345,v1=bad_signature"

        response = self.client.post(
            reverse('stripe-webhook'),
            data=payload_body,
            content_type='application/json',
            HTTP_STRIPE_SIGNATURE=sig_header
        )
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        # Verify order status hasn't changed
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'pending')
        
        # Verify stock hasn't changed
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_qty, 5)

from unittest.mock import patch

class FallbackCheckoutTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test_fallback@example.com', password='password')
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.product = Product.objects.create(name='Test Product', description='Test', base_price='10.00', category=self.category)
        self.variant = ProductVariant.objects.create(product=self.product, size='M', material='Vinyl', finish='Matte', stock_qty=5, sku='TEST-SKU-1', price_modifier='2.00')

        self.payment_intent_id = 'pi_test_fallback'
        self.order = Order.objects.create(
            user=self.user,
            status='pending',
            total='12.00',
            shipping_address={"line1": "123 Test St"},
            payment_ref=self.payment_intent_id
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant,
            quantity=2,
            unit_price='12.00'
        )

    @patch('orders.views.stripe.PaymentIntent.retrieve')
    def test_fallback_success(self, mock_retrieve):
        """Confirm the fallback properly finalizes the order when given the correct payment_intent_id."""
        class MockIntent:
            status = 'succeeded'
        mock_retrieve.return_value = MockIntent()

        payload = {'payment_intent_id': self.payment_intent_id}
        response = self.client.post(reverse('order-list'), data=payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'paid')
        
        self.variant.refresh_from_db()
        self.assertEqual(self.variant.stock_qty, 3)
        
    @patch('orders.views.stripe.PaymentIntent.retrieve')
    def test_fallback_fails_with_wrong_key(self, mock_retrieve):
        """Simulate the old bug where frontend sent payment_ref instead of payment_intent_id."""
        payload = {'payment_ref': self.payment_intent_id}
        response = self.client.post(reverse('order-list'), data=payload, format='json')
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data['error'], 'payment_intent_id is required.')
        
        self.order.refresh_from_db()
        self.assertEqual(self.order.status, 'pending')

class OrderDetailDataTestCase(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(email='test_orderdetail@example.com', password='password')
        self.client.force_authenticate(user=self.user)
        self.category = Category.objects.create(name='Test Category', slug='test-category')
        self.product = Product.objects.create(name='Expected Product Name', description='Test', base_price='10.00', category=self.category, images=['http://example.com/image.jpg'])
        self.variant = ProductVariant.objects.create(product=self.product, size='M', material='Vinyl', finish='Matte', stock_qty=5, sku='TEST-SKU-1', price_modifier='2.00')

        self.order = Order.objects.create(
            user=self.user,
            status='paid',
            total='12.00',
            shipping_address={"line1": "123 Test St"},
            payment_ref='pi_test'
        )
        self.order_item = OrderItem.objects.create(
            order=self.order,
            variant=self.variant,
            quantity=1,
            unit_price='12.00'
        )

    def test_order_detail_includes_product_name_and_image(self):
        """Check that the API response contains the nested product fields required by the frontend."""
        response = self.client.get(reverse('order-detail', args=[self.order.id]))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        
        data = response.json()
        self.assertEqual(len(data['items']), 1)
        item = data['items'][0]
        
        # Verify the deeply nested path used by OrderDetail.jsx exists
        self.assertIn('variant_details', item)
        variant_details = item['variant_details']
        self.assertIn('product_details', variant_details)
        product_details = variant_details['product_details']
        
        self.assertEqual(product_details['name'], 'Expected Product Name')
        self.assertEqual(product_details['images'], ['http://example.com/image.jpg'])
