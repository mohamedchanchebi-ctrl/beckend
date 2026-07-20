from rest_framework import serializers
from .models import Order, OrderItem
from catalog.serializers import ProductVariantSerializer

class OrderItemSerializer(serializers.ModelSerializer):
    variant_details = ProductVariantSerializer(source='variant', read_only=True)

    class Meta:
        model = OrderItem
        fields = ('id', 'variant', 'variant_details', 'quantity', 'unit_price')
        read_only_fields = ('unit_price',)

class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = ('id', 'user', 'status', 'total', 'shipping_address', 'payment_ref', 'discount_code', 'created_at', 'items')
        read_only_fields = ('user', 'status', 'total', 'payment_ref', 'discount_code', 'created_at')
