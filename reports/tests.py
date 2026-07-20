from datetime import timedelta
from decimal import Decimal
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User
from catalog.models import Category, Product, ProductVariant
from orders.models import Order, OrderItem


class AdminReportsTestCase(APITestCase):

    def setUp(self):
        self.admin = User.objects.create_user(email='admin@example.com', password='pass', role='admin')
        self.customer1 = User.objects.create_user(email='c1@example.com', password='pass', role='customer')
        self.customer2 = User.objects.create_user(email='c2@example.com', password='pass', role='customer')

        self.category = Category.objects.create(name='Stickers', slug='stickers')
        self.product1 = Product.objects.create(
            name='Circle Sticker', description='Round', base_price='5.00', category=self.category
        )
        self.product2 = Product.objects.create(
            name='Square Sticker', description='Square', base_price='6.00', category=self.category
        )
        self.variant1 = ProductVariant.objects.create(
            product=self.product1, size='S', material='Vinyl', finish='Matte',
            stock_qty=3, sku='STK-001', price_modifier='0.00'
        )
        self.variant2 = ProductVariant.objects.create(
            product=self.product2, size='M', material='Vinyl', finish='Gloss',
            stock_qty=15, sku='STK-002', price_modifier='1.00'
        )

        # Paid order for customer1
        self.order1 = Order.objects.create(
            user=self.customer1, status='paid', total='10.00',
            shipping_address={'line1': '1 A St'}, payment_ref='pi_001'
        )
        OrderItem.objects.create(order=self.order1, variant=self.variant1, quantity=2, unit_price='5.00')

        # Delivered order for customer2 (counted in reports too)
        self.order2 = Order.objects.create(
            user=self.customer2, status='delivered', total='7.00',
            shipping_address={'line1': '2 B St'}, payment_ref='pi_002'
        )
        OrderItem.objects.create(order=self.order2, variant=self.variant2, quantity=1, unit_price='7.00')

    # ── Customer list ────────────────────────────────────────────────────────

    def test_admin_customer_list(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/customers/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        emails = [c['email'] for c in response.data]
        self.assertIn('c1@example.com', emails)
        self.assertIn('c2@example.com', emails)
        # admin should NOT appear in customer list
        self.assertNotIn('admin@example.com', emails)

    def test_admin_customer_detail(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get(f'/api/admin/customers/{self.customer1.id}/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['email'], 'c1@example.com')
        self.assertEqual(len(response.data['orders']), 1)
        self.assertEqual(response.data['orders'][0]['payment_ref'], 'pi_001')

    def test_customer_cannot_access_admin_customers(self):
        self.client.force_authenticate(user=self.customer1)
        response = self.client.get('/api/admin/customers/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── Sales report ──────────────────────────────────────────────────────────

    def test_sales_report_default_day(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/sales/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # Both orders are recent and counted
        total_revenue = sum(Decimal(row['revenue']) for row in response.data)
        self.assertEqual(total_revenue, Decimal('17.00'))

    def test_sales_report_week(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/sales/?range=week')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_sales_report_month(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/sales/?range=month')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_sales_report_invalid_range(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/sales/?range=quarter')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_sales_report_requires_admin(self):
        self.client.force_authenticate(user=self.customer1)
        response = self.client.get('/api/admin/reports/sales/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    # ── Top products ──────────────────────────────────────────────────────────

    def test_top_products_report(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/top-products/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(response.data), 1)
        # product1 sold 2 units, product2 sold 1 — product1 should be first
        self.assertEqual(response.data[0]['product_name'], 'Circle Sticker')
        self.assertEqual(response.data[0]['units_sold'], 2)

    def test_top_products_limit(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/top-products/?limit=1')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)

    # ── Low stock ─────────────────────────────────────────────────────────────

    def test_low_stock_report(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/low-stock/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        # variant1 has stock_qty=3 (below threshold of 10), variant2 has 15 (above)
        skus = [row['sku'] for row in response.data]
        self.assertIn('STK-001', skus)
        self.assertNotIn('STK-002', skus)

    def test_low_stock_custom_threshold(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/reports/low-stock/?threshold=20')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        skus = [row['sku'] for row in response.data]
        # Both variants (3 and 15) are below 20
        self.assertIn('STK-001', skus)
        self.assertIn('STK-002', skus)

    def test_low_stock_requires_admin(self):
        self.client.force_authenticate(user=self.customer1)
        response = self.client.get('/api/admin/reports/low-stock/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
