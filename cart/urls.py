from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CartView, CartItemViewSet

router = DefaultRouter()
router.register(r'items', CartItemViewSet, basename='cartitem')

urlpatterns = [
    path('', CartView.as_view(), name='cart-detail'),
    path('', include(router.urls)), # This maps to /api/cart/items
]
