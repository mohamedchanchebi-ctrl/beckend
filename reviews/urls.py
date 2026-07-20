from django.urls import path, include
from rest_framework.routers import DefaultRouter
from reviews.views import ReviewViewSet

# Top-level route for DELETE /api/reviews/:id
router = DefaultRouter()
router.register(r'reviews', ReviewViewSet, basename='review')

urlpatterns = [
    path('', include(router.urls)),
]
