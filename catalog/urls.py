from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import CategoryViewSet, ProductViewSet, ProductVariantViewSet
from reviews.views import ReviewViewSet

router = DefaultRouter()
router.register(r'categories', CategoryViewSet, basename='category')
router.register(r'products', ProductViewSet, basename='product')
router.register(r'variants', ProductVariantViewSet, basename='variant')

# Nested reviews router: GET/POST /api/products/:product_pk/reviews
reviews_router = DefaultRouter()
reviews_router.register(r'reviews', ReviewViewSet, basename='product-review')

urlpatterns = [
    path('', include(router.urls)),
    path('products/<int:product_pk>/', include(reviews_router.urls)),
]
