from rest_framework import serializers
from .models import Review


class ReviewSerializer(serializers.ModelSerializer):
    user_email = serializers.EmailField(source='user.email', read_only=True)

    class Meta:
        model = Review
        fields = ('id', 'product', 'user', 'user_email', 'rating', 'comment', 'created_at')
        # product and user are injected server-side; clients only supply rating + comment
        read_only_fields = ('user', 'product', 'created_at')

    def validate_rating(self, value):
        if not (1 <= value <= 5):
            raise serializers.ValidationError("Rating must be between 1 and 5.")
        return value
