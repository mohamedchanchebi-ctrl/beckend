from django.db import IntegrityError
from rest_framework import viewsets, permissions, status
from rest_framework.exceptions import PermissionDenied, ValidationError
from rest_framework.response import Response
from users.permissions import IsCustomer
from orders.models import OrderItem
from .models import Review
from .serializers import ReviewSerializer


def has_purchased_product(user, product_id):
    """Check whether the user has at least one *delivered* order containing this product.

    Per SKILLS.md: a review may only be submitted after the order has been
    delivered — a paid-but-not-yet-delivered order is not sufficient.
    """
    return OrderItem.objects.filter(
        order__user=user,
        order__status='delivered',
        variant__product_id=product_id
    ).exists()


class ReviewViewSet(viewsets.ModelViewSet):
    serializer_class = ReviewSerializer
    http_method_names = ['get', 'post', 'put', 'delete', 'head', 'options']

    def get_permissions(self):
        if self.action in ('list', 'retrieve'):
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated(), IsCustomer()]

    def get_queryset(self):
        product_id = self.kwargs.get('product_pk')
        if product_id:
            # Nested: GET /api/products/:product_pk/reviews/
            return Review.objects.filter(product_id=product_id).select_related('user')
        # Top-level: DELETE /api/reviews/:id
        return Review.objects.all().select_related('user')

    def perform_create(self, serializer):
        product_id = self.kwargs.get('product_pk')
        user = self.request.user

        # 1. Enforce "purchased only" rule
        if not has_purchased_product(user, product_id):
            raise PermissionDenied("You can only review products you have purchased.")

        # 2. Enforce one-review-per-user-per-product cleanly before hitting DB
        if Review.objects.filter(user=user, product_id=product_id).exists():
            raise ValidationError("You have already reviewed this product.")

        try:
            serializer.save(user=user, product_id=product_id)
        except IntegrityError:
            # Defensive: catch race condition at the DB unique_together level
            raise ValidationError("You have already reviewed this product.")

    def update(self, request, *args, **kwargs):
        review = self.get_object()
        if review.user != request.user:
            return Response({"error": "You can only edit your own reviews."}, status=status.HTTP_403_FORBIDDEN)
        return super().update(request, *args, **kwargs)

    def destroy(self, request, *args, **kwargs):
        review = self.get_object()
        # Owners can delete their own; admins can delete any
        if review.user != request.user and request.user.role != 'admin':
            return Response({"error": "You can only delete your own reviews."}, status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
