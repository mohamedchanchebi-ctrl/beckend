from django.db.models.signals import pre_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import Order


@receiver(pre_save, sender=Order)
def order_status_changed(sender, instance, **kwargs):
    if not instance.pk:
        # New order, status is typically 'pending', no email needed yet.
        return

    try:
        old_order = Order.objects.get(pk=instance.pk)
    except Order.DoesNotExist:
        return

    if old_order.status != instance.status:
        # Order status has changed, send email
        subject = f"Order #{instance.id} Status Update"
        
        if instance.status == 'paid':
            message = f"Thank you for your purchase! Your order #{instance.id} is confirmed and paid.\nTotal: ${instance.total}"
            subject = f"Order #{instance.id} Confirmed"
        elif instance.status == 'shipped':
            message = f"Good news! Your order #{instance.id} has been shipped."
        elif instance.status == 'delivered':
            message = f"Your order #{instance.id} has been delivered. Enjoy!"
        else:
            message = f"Your order #{instance.id} status is now: {instance.get_status_display()}."

        send_mail(
            subject=subject,
            message=message,
            from_email=getattr(settings, 'EMAIL_HOST_USER', 'noreply@example.com'),
            recipient_list=[instance.user.email],
            fail_silently=True,
        )
