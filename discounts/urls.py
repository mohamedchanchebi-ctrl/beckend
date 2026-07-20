from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import DiscountValidateView, DiscountViewSet

router = DefaultRouter()
router.register(r'admin/discounts', DiscountViewSet, basename='discount')

urlpatterns = [
    path('discounts/validate/', DiscountValidateView.as_view(), name='discount-validate'),
    path('', include(router.urls)),
]
