from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from users.permissions import IsCustomer
from .models import WishlistItem
from .serializers import WishlistItemSerializer


class WishlistViewSet(viewsets.ModelViewSet):
    """
    GET  /api/wishlist       -> list items
    POST /api/wishlist       -> add a product
    DELETE /api/wishlist/:productId -> remove by product ID per SKILLS.md spec
    """
    serializer_class = WishlistItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomer]
    http_method_names = ['get', 'post', 'delete', 'head', 'options']

    def get_queryset(self):
        return WishlistItem.objects.filter(user=self.request.user).select_related('product')

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # The URL pk is actually a product_id per spec: DELETE /api/wishlist/:productId
        product_id = kwargs.get('pk')
        deleted, _ = WishlistItem.objects.filter(user=request.user, product_id=product_id).delete()
        if deleted:
            return Response(status=status.HTTP_204_NO_CONTENT)
        return Response({"error": "Product not in wishlist."}, status=status.HTTP_404_NOT_FOUND)
