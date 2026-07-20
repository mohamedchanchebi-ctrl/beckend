from django.contrib import admin
from .models import Category, Product, ProductVariant

class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1

@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'parent')
    prepopulated_fields = {'slug': ('name',)}

@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ('name', 'base_price', 'category', 'is_active', 'created_at')
    list_filter = ('is_active', 'category')
    search_fields = ('name',)
    inlines = [ProductVariantInline]

@admin.register(ProductVariant)
class ProductVariantAdmin(admin.ModelAdmin):
    list_display = ('sku', 'product', 'size', 'material', 'finish', 'stock_qty', 'price_modifier')
    list_filter = ('material', 'finish', 'size')
    search_fields = ('sku', 'product__name')
