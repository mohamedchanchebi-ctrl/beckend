from rest_framework import serializers
from catalog.serializers import ProductListSerializer
from .models import WishlistItem


class WishlistItemSerializer(serializers.ModelSerializer):
    product_details = ProductListSerializer(source='product', read_only=True)

    class Meta:
        model = WishlistItem
        fields = ('id', 'product', 'product_details', 'added_at')
        read_only_fields = ('added_at',)

    def validate(self, attrs):
        request = self.context.get('request')
        product = attrs.get('product')
        if request and product:
            if WishlistItem.objects.filter(user=request.user, product=product).exists():
                raise serializers.ValidationError("This product is already in your wishlist.")
        return attrs
