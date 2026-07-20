from rest_framework import viewsets, permissions, status
from rest_framework.views import APIView
from rest_framework.response import Response
from users.permissions import IsAdminUser, IsCustomer
from .models import Discount
from .serializers import DiscountSerializer


class DiscountValidateView(APIView):
    """
    POST /api/discounts/validate
    Customer-facing: validate a discount code and return its details if valid.
    Returns 400 for unknown, expired, or inactive codes.
    """
    permission_classes = [permissions.IsAuthenticated, IsCustomer]

    def post(self, request):
        code = request.data.get('code', '').strip()
        if not code:
            return Response({"error": "Code is required."}, status=status.HTTP_400_BAD_REQUEST)

        try:
            discount = Discount.objects.get(code=code)
        except Discount.DoesNotExist:
            return Response({"error": "Invalid discount code."}, status=status.HTTP_400_BAD_REQUEST)

        if not discount.is_valid():
            return Response(
                {"error": "Discount code is expired or inactive."},
                status=status.HTTP_400_BAD_REQUEST
            )

        return Response(DiscountSerializer(discount).data, status=status.HTTP_200_OK)


class DiscountViewSet(viewsets.ModelViewSet):
    """
    Admin-only full CRUD for discount codes.
    GET/POST /api/admin/discounts
    PUT/DELETE /api/admin/discounts/:id
    """
    queryset = Discount.objects.all().order_by('-id')
    serializer_class = DiscountSerializer
    permission_classes = [permissions.IsAuthenticated, IsAdminUser]
    http_method_names = ['get', 'post', 'put', 'patch', 'delete', 'head', 'options']
