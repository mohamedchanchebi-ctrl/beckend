from datetime import timedelta
from django.utils import timezone
from django.db.models import Sum, Count, F, Q
from django.db.models.functions import TruncDay, TruncWeek, TruncMonth
from rest_framework import permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsAdminUser
from users.models import User
from orders.models import Order, OrderItem
from catalog.models import ProductVariant
from .serializers import CustomerListSerializer, CustomerDetailSerializer


class AdminCustomerListView(APIView):
    """GET /api/admin/customers — list all customers with order count."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        customers = (
            User.objects
            .filter(role='customer')
            .annotate(order_count=Count('orders'))
            .order_by('-date_joined')
        )
        serializer = CustomerListSerializer(customers, many=True)
        return Response(serializer.data)


class AdminCustomerDetailView(APIView):
    """GET /api/admin/customers/:id — customer profile + full order history."""
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request, pk):
        try:
            customer = User.objects.get(pk=pk, role='customer')
        except User.DoesNotExist:
            return Response({"error": "Customer not found."}, status=status.HTTP_404_NOT_FOUND)

        serializer = CustomerDetailSerializer(customer, context={'request': request})
        return Response(serializer.data)


class SalesReportView(APIView):
    """
    GET /api/admin/reports/sales?range=day|week|month

    Returns revenue totals grouped by the requested time unit.
    Only counts 'paid', 'processing', 'shipped', or 'delivered' orders.
    Defaults to 'day' (last 30 days).
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    TRUNC_MAP = {
        'day': TruncDay,
        'week': TruncWeek,
        'month': TruncMonth,
    }
    RANGE_DAYS = {
        'day': 30,
        'week': 12 * 7,   # ~3 months
        'month': 365,
    }
    COMPLETED_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

    def get(self, request):
        range_param = request.query_params.get('range', 'day')
        trunc_fn = self.TRUNC_MAP.get(range_param)
        if not trunc_fn:
            return Response(
                {"error": "range must be one of: day, week, month"},
                status=status.HTTP_400_BAD_REQUEST
            )

        since = timezone.now() - timedelta(days=self.RANGE_DAYS[range_param])

        data = (
            Order.objects
            .filter(status__in=self.COMPLETED_STATUSES, created_at__gte=since)
            .annotate(period=trunc_fn('created_at'))
            .values('period')
            .annotate(revenue=Sum('total'), order_count=Count('id'))
            .order_by('period')
        )

        return Response([
            {
                'period': row['period'].isoformat(),
                'revenue': str(row['revenue']),
                'order_count': row['order_count'],
            }
            for row in data
        ])


class TopProductsReportView(APIView):
    """
    GET /api/admin/reports/top-products?limit=10

    Returns best-selling products by units sold and revenue,
    across delivered/paid orders.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    COMPLETED_STATUSES = ['paid', 'processing', 'shipped', 'delivered']

    def get(self, request):
        try:
            limit = min(int(request.query_params.get('limit', 10)), 100)
        except (ValueError, TypeError):
            limit = 10

        data = (
            OrderItem.objects
            .filter(order__status__in=self.COMPLETED_STATUSES)
            .values(
                product_id=F('variant__product__id'),
                product_name=F('variant__product__name'),
            )
            .annotate(
                units_sold=Sum('quantity'),
                revenue=Sum(F('unit_price') * F('quantity')),
            )
            .order_by('-units_sold')[:limit]
        )

        return Response([
            {
                'product_id': row['product_id'],
                'product_name': row['product_name'],
                'units_sold': row['units_sold'],
                'revenue': str(row['revenue']),
            }
            for row in data
        ])


class LowStockReportView(APIView):
    """
    GET /api/admin/reports/low-stock?threshold=10

    Returns product variants whose stock_qty is at or below the threshold.
    Default threshold is 10.
    """
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]

    def get(self, request):
        try:
            threshold = int(request.query_params.get('threshold', 10))
        except (ValueError, TypeError):
            threshold = 10

        variants = (
            ProductVariant.objects
            .filter(stock_qty__lte=threshold, product__is_active=True)
            .select_related('product')
            .order_by('stock_qty')
        )

        return Response([
            {
                'variant_id': v.id,
                'sku': v.sku,
                'product_name': v.product.name,
                'size': v.size,
                'material': v.material,
                'finish': v.finish,
                'stock_qty': v.stock_qty,
            }
            for v in variants
        ])
