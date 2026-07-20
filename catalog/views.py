from rest_framework import viewsets, permissions, status
from rest_framework.response import Response
from rest_framework.decorators import action
from django.db.models import Q
from users.permissions import IsAdminUser
from .models import Category, Product, ProductVariant
from .serializers import CategorySerializer, ProductListSerializer, ProductDetailSerializer, ProductVariantSerializer

class ReadOnlyOrAdminPermission(permissions.BasePermission):
    def has_permission(self, request, view):
        if request.method in permissions.SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == 'admin')

class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.filter(parent__isnull=True) # Only list top-level by default
    serializer_class = CategorySerializer
    permission_classes = [ReadOnlyOrAdminPermission]

class ProductViewSet(viewsets.ModelViewSet):
    permission_classes = [ReadOnlyOrAdminPermission]
    
    def get_queryset(self):
        queryset = Product.objects.all()
        # Non-admins only see active products
        if not (self.request.user and self.request.user.is_authenticated and self.request.user.role == 'admin'):
            queryset = queryset.filter(is_active=True)
            
        # Filters
        category = self.request.query_params.get('category')
        search = self.request.query_params.get('search')
        min_price = self.request.query_params.get('minPrice')
        max_price = self.request.query_params.get('maxPrice')
        sort = self.request.query_params.get('sort')

        if category:
            queryset = queryset.filter(category__slug=category)
        if search:
            queryset = queryset.filter(Q(name__icontains=search) | Q(description__icontains=search))
        if min_price:
            queryset = queryset.filter(base_price__gte=min_price)
        if max_price:
            queryset = queryset.filter(base_price__lte=max_price)
            
        if sort:
            if sort == 'price_asc':
                queryset = queryset.order_by('base_price')
            elif sort == 'price_desc':
                queryset = queryset.order_by('-base_price')
            elif sort == 'newest':
                queryset = queryset.order_by('-created_at')
                
        # select_related for optimization
        return queryset.select_related('category')

    def get_serializer_class(self):
        if self.action in ['retrieve', 'create', 'update', 'partial_update']:
            return ProductDetailSerializer
        return ProductListSerializer

    @action(detail=True, methods=['post'], permission_classes=[IsAdminUser])
    def variants(self, request, pk=None):
        product = self.get_object()
        serializer = ProductVariantSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save(product=product)
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def destroy(self, request, *args, **kwargs):
        product = self.get_object()
        product.is_active = False
        product.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

class ProductVariantViewSet(viewsets.ModelViewSet):
    queryset = ProductVariant.objects.all()
    serializer_class = ProductVariantSerializer
    permission_classes = [IsAdminUser] # Only accessed directly for edit/delete by admin
