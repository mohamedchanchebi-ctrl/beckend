from django.contrib import admin
from .models import Order, OrderItem

class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ('variant', 'quantity', 'unit_price')

@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'status', 'total', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('id', 'user__email', 'payment_ref')
    inlines = [OrderItemInline]
    readonly_fields = ('user', 'total', 'payment_ref', 'discount_code', 'created_at')
