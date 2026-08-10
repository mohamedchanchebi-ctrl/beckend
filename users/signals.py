from django.db.models.signals import post_save
from django.dispatch import receiver
from django.core.mail import send_mail
from django.conf import settings
from .models import User


@receiver(post_save, sender=User)
def send_welcome_email(sender, instance, created, **kwargs):
    """Send a welcome email once, immediately after a new User is created."""
    if not created:
        return  # Only fire on INSERT, not UPDATE

    subject = "Welcome to Stiko! 🎉"
    body = (
        f"Hi {instance.name or instance.email},\n\n"
        "Thanks for joining Stiko — home of holographic & cyberpunk stickers.\n\n"
        "Your account is ready. Log in any time at:\n"
        "  http://localhost:5173/login\n\n"
        "Happy shopping!\n"
        "— The Stiko Team"
    )

    send_mail(
        subject=subject,
        message=body,
        from_email=getattr(settings, 'EMAIL_HOST_USER', 'noreply@stiko.com'),
        recipient_list=[instance.email],
        fail_silently=True,
    )
