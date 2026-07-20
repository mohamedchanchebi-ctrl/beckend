from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsCustomer
from .models import Cart, CartItem
from .serializers import CartSerializer, CartItemSerializer

class CartView(APIView):
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def get_cart(self, request):
        cart, created = Cart.objects.get_or_create(user=request.user)
        return cart

    def get(self, request):
        cart = self.get_cart(request)
        serializer = CartSerializer(cart)
        return Response(serializer.data)

    def delete(self, request):
        cart = self.get_cart(request)
        cart.items.all().delete()
        return Response(status=status.HTTP_204_NO_CONTENT)

class CartItemViewSet(viewsets.ModelViewSet):
    serializer_class = CartItemSerializer
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def get_queryset(self):
        # Users can only access items in their own cart
        return CartItem.objects.filter(cart__user=self.request.user)

    def perform_create(self, serializer):
        cart, _ = Cart.objects.get_or_create(user=self.request.user)
        
        # Check if item already exists in cart, if so, just add quantity
        variant = serializer.validated_data['variant']
        existing_item = CartItem.objects.filter(cart=cart, variant=variant).first()
        
        if existing_item:
            existing_item.quantity += serializer.validated_data.get('quantity', 1)
            existing_item.save()
        else:
            serializer.save(cart=cart)

    # update and destroy are handled nicely by ModelViewSet for the user's queryset
