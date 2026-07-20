from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CheckoutView, OrderViewSet, StripeWebhookView

router = DefaultRouter()
router.register(r'orders', OrderViewSet, basename='order')
router.register(r'admin/orders', OrderViewSet, basename='admin-order')

urlpatterns = [
    path('checkout', CheckoutView.as_view(), name='checkout'),
    path('webhooks/stripe', StripeWebhookView.as_view(), name='stripe-webhook'),
    path('', include(router.urls)),
]
