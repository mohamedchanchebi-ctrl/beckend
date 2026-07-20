from django.test import TestCase
from django.core import mail
from django.conf import settings
from catalog.models import Category, Product, ProductVariant


class CatalogSignalTests(TestCase):

    def setUp(self):
        self.category = Category.objects.create(name='Stickers', slug='stickers')
        self.product = Product.objects.create(
            name='Test Sticker', description='Desc', base_price='5.00', category=self.category
        )
        self.variant = ProductVariant.objects.create(
            product=self.product, size='S', material='Vinyl', finish='Matte',
            stock_qty=15, sku='STK-001', price_modifier='0.00'
        )

    def test_low_stock_email_sent_when_dropping_below_threshold(self):
        mail.outbox = []
        
        # Default threshold is 10
        self.variant.stock_qty = 9
        self.variant.save()
        
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Low Stock Alert', mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, [getattr(settings, 'ADMIN_EMAIL', 'admin@example.com')])

    def test_low_stock_email_not_sent_if_already_below_threshold(self):
        # Drop stock below threshold
        self.variant.stock_qty = 9
        self.variant.save()
        mail.outbox = [] # Clear the alert that was just sent

        # Drop stock further, should NOT trigger another alert
        self.variant.stock_qty = 5
        self.variant.save()
        
        self.assertEqual(len(mail.outbox), 0)

    def test_low_stock_email_not_sent_if_above_threshold(self):
        mail.outbox = []
        
        self.variant.stock_qty = 11
        self.variant.save()
        
        self.assertEqual(len(mail.outbox), 0)
