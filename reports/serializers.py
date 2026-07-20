from rest_framework import serializers
from users.models import User
from orders.models import Order


class OrderSummarySerializer(serializers.ModelSerializer):
    """Lightweight order summary for customer detail view."""
    class Meta:
        model = Order
        fields = ('id', 'status', 'total', 'created_at', 'payment_ref')


class CustomerListSerializer(serializers.ModelSerializer):
    order_count = serializers.IntegerField(read_only=True)

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'date_joined', 'order_count')


class CustomerDetailSerializer(serializers.ModelSerializer):
    orders = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'email', 'first_name', 'last_name', 'date_joined', 'orders')

    def get_orders(self, obj):
        orders = Order.objects.filter(user=obj).order_by('-created_at')
        return OrderSummarySerializer(orders, many=True).data
