from rest_framework import serializers
from .models import Cart, CartItem
from catalog.serializers import ProductVariantSerializer

class CartItemSerializer(serializers.ModelSerializer):
    variant_details = ProductVariantSerializer(source='variant', read_only=True)
    
    class Meta:
        model = CartItem
        fields = ('id', 'variant', 'variant_details', 'quantity')
        
    def validate_quantity(self, value):
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value

class CartSerializer(serializers.ModelSerializer):
    items = serializers.SerializerMethodField()
    total_price = serializers.SerializerMethodField()

    class Meta:
        model = Cart
        fields = ('id', 'user', 'items', 'total_price', 'created_at')
        read_only_fields = ('user',)

    def get_items(self, obj):
        # Exclude items where the product has been deactivated
        active_items = obj.items.filter(variant__product__is_active=True)
        return CartItemSerializer(active_items, many=True).data

    def get_total_price(self, obj):
        active_items = obj.items.filter(variant__product__is_active=True)
        total = sum(
            (item.variant.product.base_price + item.variant.price_modifier) * item.quantity
            for item in active_items
        )
        return str(total)
