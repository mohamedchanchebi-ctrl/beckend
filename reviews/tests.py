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
from reviews.models import Review
from wishlist.models import WishlistItem


class ReviewsAndWishlistTestCase(TestCase):

    def setUp(self):
        self.client = APIClient()
        # Create users
        self.customer = User.objects.create_user(email='customer@example.com', password='pass', role='customer')
        self.other_customer = User.objects.create_user(email='other@example.com', password='pass', role='customer')

        # Create catalog
        self.category = Category.objects.create(name='Stickers', slug='stickers')
        self.product = Product.objects.create(
            name='Circle Sticker', description='Round', base_price='5.00', category=self.category
        )
        self.variant = ProductVariant.objects.create(
            product=self.product, size='S', material='Vinyl', finish='Matte',
            stock_qty=10, sku='STK-001', price_modifier='1.00'
        )

        # Create a DELIVERED order for the customer (only then can they review)
        self.order = Order.objects.create(
            user=self.customer, status='delivered', total='6.00',
            shipping_address={'line1': '1 Test St'}, payment_ref='pi_delivered_001'
        )
        self.order_item = OrderItem.objects.create(
            order=self.order, variant=self.variant, quantity=1, unit_price='6.00'
        )

        # Create a PAID-but-not-delivered order for other_customer (must still be rejected)
        self.paid_order = Order.objects.create(
            user=self.other_customer, status='paid', total='6.00',
            shipping_address={'line1': '2 Test St'}, payment_ref='pi_paid_001'
        )
        self.paid_order_item = OrderItem.objects.create(
            order=self.paid_order, variant=self.variant, quantity=1, unit_price='6.00'
        )

    # ── Reviews ──────────────────────────────────────────────────────────────

    def test_get_product_reviews_is_public(self):
        """GET /api/products/:id/reviews is accessible without auth."""
        url = f'/api/products/{self.product.id}/reviews/'
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_post_review_requires_purchase(self):
        """other_customer has only a paid (not delivered) order — must get 403."""
        self.client.force_authenticate(user=self.other_customer)
        url = f'/api/products/{self.product.id}/reviews/'
        response = self.client.post(url, {'rating': 5, 'comment': 'Great!'})
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_post_review_allowed_after_purchase(self):
        """customer has a *delivered* order, can submit a review."""
        self.client.force_authenticate(user=self.customer)
        url = f'/api/products/{self.product.id}/reviews/'
        response = self.client.post(url, {'rating': 4, 'comment': 'Solid sticker'})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['rating'], 4)
        self.assertEqual(Review.objects.filter(product=self.product, user=self.customer).count(), 1)

    def test_duplicate_review_rejected(self):
        """Same user cannot review the same product twice."""
        self.client.force_authenticate(user=self.customer)
        url = f'/api/products/{self.product.id}/reviews/'
        self.client.post(url, {'rating': 4, 'comment': 'First review'})
        response = self.client.post(url, {'rating': 3, 'comment': 'Second attempt'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_rating_must_be_1_to_5(self):
        """Rating out of range must fail validation."""
        self.client.force_authenticate(user=self.customer)
        url = f'/api/products/{self.product.id}/reviews/'
        response = self.client.post(url, {'rating': 6, 'comment': 'Too high'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_owner_can_delete_own_review(self):
        """Review owner can delete their review via DELETE /api/reviews/:id."""
        review = Review.objects.create(product=self.product, user=self.customer, rating=5)
        self.client.force_authenticate(user=self.customer)
        url = f'/api/reviews/{review.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)

    def test_non_owner_cannot_delete_review(self):
        """A different customer cannot delete another user's review."""
        review = Review.objects.create(product=self.product, user=self.customer, rating=5)
        self.client.force_authenticate(user=self.other_customer)
        url = f'/api/reviews/{review.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── Wishlist ──────────────────────────────────────────────────────────────

    def test_wishlist_requires_auth(self):
        """GET /api/wishlist is auth-gated."""
        response = self.client.get('/api/wishlist/')
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_add_to_wishlist(self):
        """POST /api/wishlist adds a product."""
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/wishlist/', {'product': self.product.id})
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertTrue(WishlistItem.objects.filter(user=self.customer, product=self.product).exists())

    def test_duplicate_wishlist_rejected(self):
        """Adding the same product twice is rejected."""
        self.client.force_authenticate(user=self.customer)
        self.client.post('/api/wishlist/', {'product': self.product.id})
        response = self.client.post('/api/wishlist/', {'product': self.product.id})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_delete_from_wishlist_by_product_id(self):
        """DELETE /api/wishlist/:productId removes item by product id."""
        WishlistItem.objects.create(user=self.customer, product=self.product)
        self.client.force_authenticate(user=self.customer)
        url = f'/api/wishlist/{self.product.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(WishlistItem.objects.filter(user=self.customer, product=self.product).exists())
