from django.utils import timezone
from rest_framework import serializers
from .models import Discount


class DiscountSerializer(serializers.ModelSerializer):

    class Meta:
        model = Discount
        fields = '__all__'

    def validate_value(self, value):
        if value <= 0:
            raise serializers.ValidationError("Discount value must be positive.")
        return value

    def validate(self, attrs):
        discount_type = attrs.get('type', getattr(self.instance, 'type', None))
        value = attrs.get('value', getattr(self.instance, 'value', None))
        expires_at = attrs.get('expires_at', getattr(self.instance, 'expires_at', None))

        if discount_type == 'percentage' and value is not None and value > 100:
            raise serializers.ValidationError(
                {"value": "Percentage discount cannot exceed 100."}
            )

        # Only enforce future expiry on create (not on partial updates that don't touch expires_at)
        if 'expires_at' in attrs and expires_at <= timezone.now():
            raise serializers.ValidationError(
                {"expires_at": "Expiry date must be in the future."}
            )

        return attrs
