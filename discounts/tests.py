from datetime import timedelta
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase
from users.models import User
from .models import Discount


def future(days=30):
    return timezone.now() + timedelta(days=days)


def past(days=1):
    return timezone.now() - timedelta(days=days)


class DiscountValidateTestCase(APITestCase):

    def setUp(self):
        self.customer = User.objects.create_user(email='c@example.com', password='pass', role='customer')
        self.admin = User.objects.create_user(email='a@example.com', password='pass', role='admin')

        self.active_pct = Discount.objects.create(
            code='SAVE10', type='percentage', value=10, expires_at=future(), is_active=True
        )
        self.active_fixed = Discount.objects.create(
            code='FLAT5', type='fixed', value=5, expires_at=future(), is_active=True
        )
        self.expired = Discount.objects.create(
            code='OLD20', type='percentage', value=20, expires_at=past(), is_active=True
        )
        self.inactive = Discount.objects.create(
            code='OFF30', type='fixed', value=30, expires_at=future(), is_active=False
        )

    # ── Validate endpoint ────────────────────────────────────────────────────

    def test_validate_valid_code(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/discounts/validate/', {'code': 'SAVE10'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['code'], 'SAVE10')
        self.assertEqual(response.data['type'], 'percentage')

    def test_validate_invalid_code(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/discounts/validate/', {'code': 'BOGUS'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_expired_code(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/discounts/validate/', {'code': 'OLD20'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_inactive_code(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/discounts/validate/', {'code': 'OFF30'})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_validate_requires_auth(self):
        response = self.client.post('/api/discounts/validate/', {'code': 'SAVE10'})
        self.assertIn(response.status_code, [status.HTTP_401_UNAUTHORIZED, status.HTTP_403_FORBIDDEN])

    def test_validate_missing_code(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.post('/api/discounts/validate/', {})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    # ── Admin CRUD ────────────────────────────────────────────────────────────

    def test_admin_list_discounts(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.get('/api/admin/discounts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 4)

    def test_admin_create_discount(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/discounts/', {
            'code': 'NEW15', 'type': 'percentage', 'value': 15,
            'expires_at': (future(60)).isoformat(), 'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['code'], 'NEW15')

    def test_admin_create_rejects_past_expiry(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/discounts/', {
            'code': 'BAD99', 'type': 'fixed', 'value': 5,
            'expires_at': past(10).isoformat(), 'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_create_rejects_percentage_over_100(self):
        self.client.force_authenticate(user=self.admin)
        response = self.client.post('/api/admin/discounts/', {
            'code': 'BIG999', 'type': 'percentage', 'value': 150,
            'expires_at': future().isoformat(), 'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_admin_update_discount(self):
        self.client.force_authenticate(user=self.admin)
        url = f'/api/admin/discounts/{self.active_pct.id}/'
        response = self.client.put(url, {
            'code': 'SAVE10', 'type': 'percentage', 'value': 15,
            'expires_at': future(90).isoformat(), 'is_active': True
        })
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['value'], '15.00')

    def test_admin_delete_discount(self):
        self.client.force_authenticate(user=self.admin)
        url = f'/api/admin/discounts/{self.inactive.id}/'
        response = self.client.delete(url)
        self.assertEqual(response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Discount.objects.filter(id=self.inactive.id).exists())

    def test_customer_cannot_access_admin_discounts(self):
        self.client.force_authenticate(user=self.customer)
        response = self.client.get('/api/admin/discounts/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
