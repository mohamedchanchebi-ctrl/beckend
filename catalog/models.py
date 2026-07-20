from django.db import models

class Category(models.Model):
    name = models.CharField(max_length=255)
    slug = models.SlugField(max_length=255, unique=True)
    parent = models.ForeignKey('self', on_delete=models.SET_NULL, null=True, blank=True, related_name='subcategories')

    def __str__(self):
        return self.name

    class Meta:
        verbose_name_plural = "Categories"

class Product(models.Model):
    name = models.CharField(max_length=255)
    description = models.TextField()
    base_price = models.DecimalField(max_digits=10, decimal_places=2)
    category = models.ForeignKey(Category, on_delete=models.CASCADE, related_name='products')
    images = models.JSONField(default=list, blank=True) # Array of image URLs
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class ProductVariant(models.Model):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='variants')
    size = models.CharField(max_length=100)
    material = models.CharField(max_length=100)
    finish = models.CharField(max_length=100)
    color = models.CharField(max_length=100, null=True, blank=True)
    price_modifier = models.DecimalField(max_digits=10, decimal_places=2, default=0.00)
    stock_qty = models.IntegerField(default=0)
    sku = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return f"{self.product.name} - {self.sku}"
