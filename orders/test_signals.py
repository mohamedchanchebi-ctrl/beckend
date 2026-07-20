from django.test import TestCase
from django.core import mail
from users.models import User
from catalog.models import Category, Product, ProductVariant
from .models import Order


class OrderSignalTests(TestCase):

    def setUp(self):
        self.customer = User.objects.create_user(email='buyer@example.com', password='pass')
        self.order = Order.objects.create(
            user=self.customer,
            status='pending',
            total='10.00',
            shipping_address={'line1': '123 Test'},
            payment_ref='pi_123'
        )

    def test_email_sent_on_order_paid(self):
        # Empty outbox
        mail.outbox = []
        
        # Change status to paid
        self.order.status = 'paid'
        self.order.save()
        
        # Check email was sent
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('Confirmed', mail.outbox[0].subject)
        self.assertEqual(mail.outbox[0].to, ['buyer@example.com'])

    def test_email_sent_on_order_shipped(self):
        mail.outbox = []
        self.order.status = 'shipped'
        self.order.save()
        
        self.assertEqual(len(mail.outbox), 1)
        self.assertIn('shipped', mail.outbox[0].body)
        self.assertEqual(mail.outbox[0].to, ['buyer@example.com'])

    def test_no_email_if_status_unchanged(self):
        self.order.status = 'paid'
        self.order.save()
        mail.outbox = []

        # Saving again without changing status
        self.order.save()
        
        self.assertEqual(len(mail.outbox), 0)
