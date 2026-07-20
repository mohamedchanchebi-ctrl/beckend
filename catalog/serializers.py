from rest_framework import serializers
from .models import Category, Product, ProductVariant

class CategorySerializer(serializers.ModelSerializer):
    subcategories = serializers.SerializerMethodField()

    class Meta:
        model = Category
        fields = ('id', 'name', 'slug', 'parent', 'subcategories')

    def get_subcategories(self, obj):
        if obj.subcategories.exists():
            return CategorySerializer(obj.subcategories.all(), many=True).data
        return []

class ProductListSerializer(serializers.ModelSerializer):
    category_name = serializers.CharField(source='category.name', read_only=True)
    
    class Meta:
        model = Product
        fields = ('id', 'name', 'base_price', 'category', 'category_name', 'images', 'is_active')

class ProductVariantSerializer(serializers.ModelSerializer):
    final_price = serializers.SerializerMethodField()
    product_details = ProductListSerializer(source='product', read_only=True)

    class Meta:
        model = ProductVariant
        fields = '__all__'
        
    def get_final_price(self, obj):
        return str(obj.product.base_price + obj.price_modifier)

class ProductDetailSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    category_name = serializers.CharField(source='category.name', read_only=True)

    class Meta:
        model = Product
        fields = '__all__'
