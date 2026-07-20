from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import ProductVariant


@receiver(pre_save, sender=ProductVariant)
def low_stock_alert(sender, instance, **kwargs):
    if not instance.pk:
        # New variant being created, no alert
        return

    try:
        old_variant = ProductVariant.objects.get(pk=instance.pk)
    except ProductVariant.DoesNotExist:
        return

    # Let's say our low stock threshold is 10 for alerts
    LOW_STOCK_THRESHOLD = getattr(settings, 'LOW_STOCK_THRESHOLD', 10)

    # Trigger alert if stock drops to or below threshold (and previously was above it)
    if old_variant.stock_qty > LOW_STOCK_THRESHOLD and instance.stock_qty <= LOW_STOCK_THRESHOLD:
        subject = f"Low Stock Alert: {instance.product.name} ({instance.sku})"
        message = (
            f"Product: {instance.product.name}\n"
            f"SKU: {instance.sku}\n"
            f"Current Stock: {instance.stock_qty}\n\n"
            f"Please consider restocking soon."
        )

        admin_email = getattr(settings, 'ADMIN_EMAIL', 'admin@example.com')

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'EMAIL_HOST_USER', 'noreply@example.com'),
            recipient_list=[admin_email],
            fail_silently=True,
        )
