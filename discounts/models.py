from django.db import models
from django.utils import timezone

class Discount(models.Model):
    TYPE_CHOICES = (
        ('percentage', 'Percentage'),
        ('fixed', 'Fixed Amount'),
    )

    code = models.CharField(max_length=50, unique=True)
    type = models.CharField(max_length=20, choices=TYPE_CHOICES)
    value = models.DecimalField(max_digits=10, decimal_places=2)
    expires_at = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    def is_valid(self):
        return self.is_active and self.expires_at > timezone.now()

    def __str__(self):
        return self.code
