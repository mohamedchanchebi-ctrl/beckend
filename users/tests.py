"""
Tests for the welcome email signal in users/signals.py.

Two cases are verified:
  1. A welcome email is sent exactly once when a new User is successfully created.
  2. No email is sent when registration fails validation (invalid data → User never saved).
"""
from django.test import TestCase, override_settings
from django.core import mail
from django.contrib.auth import get_user_model
from rest_framework.test import APIClient
from rest_framework import status

User = get_user_model()


class WelcomeEmailSignalTest(TestCase):
    """Direct signal tests — bypass the API and test the signal in isolation."""

    def test_welcome_email_sent_on_user_creation(self):
        """Exactly one welcome email goes out when a new User is saved for the first time."""
        User.objects.create_user(email='newuser@example.com', password='StrongPass1!')
        self.assertEqual(len(mail.outbox), 1)
        email = mail.outbox[0]
        self.assertEqual(email.to, ['newuser@example.com'])
        self.assertIn('Welcome', email.subject)
        self.assertIn('Stiko', email.body)

    def test_no_email_sent_on_user_update(self):
        """Updating an existing user must NOT fire the welcome email again."""
        user = User.objects.create_user(email='existing@example.com', password='StrongPass1!')
        mail.outbox.clear()          # discard the creation email
        user.name = 'Updated Name'
        user.save()
        self.assertEqual(len(mail.outbox), 0)

    def test_welcome_email_not_sent_twice(self):
        """Creating two different users produces exactly two emails, one per user."""
        User.objects.create_user(email='alpha@example.com', password='StrongPass1!')
        User.objects.create_user(email='beta@example.com', password='StrongPass1!')
        self.assertEqual(len(mail.outbox), 2)
        recipients = {e.to[0] for e in mail.outbox}
        self.assertIn('alpha@example.com', recipients)
        self.assertIn('beta@example.com', recipients)


class WelcomeEmailRegistrationAPITest(TestCase):
    """End-to-end tests — verify behaviour through the registration API endpoint."""

    def setUp(self):
        self.client = APIClient()
        self.register_url = '/api/auth/register'

    def test_welcome_email_sent_on_successful_registration(self):
        """POST /api/auth/register with valid data → 1 welcome email sent."""
        payload = {
            'email': 'brand_new@example.com',
            'password': 'ValidPass99!',
            'name': 'Brand New',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ['brand_new@example.com'])
        self.assertIn('Welcome', mail.outbox[0].subject)

    def test_no_email_sent_on_failed_registration_missing_password(self):
        """POST with missing password → 400 Bad Request, no email sent."""
        payload = {'email': 'nopass@example.com'}  # missing password
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)

    def test_no_email_sent_on_failed_registration_duplicate_email(self):
        """POST with a duplicate email → 400 Bad Request, no second email sent."""
        User.objects.create_user(email='duplicate@example.com', password='StrongPass1!')
        mail.outbox.clear()  # discard the creation email for the seed user

        payload = {
            'email': 'duplicate@example.com',
            'password': 'AnotherPass99!',
            'name': 'Dup User',
        }
        response = self.client.post(self.register_url, payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(len(mail.outbox), 0)
