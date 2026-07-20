from django.contrib import admin
from .models import Discount

@admin.register(Discount)
class DiscountAdmin(admin.ModelAdmin):
    list_display = ('code', 'type', 'value', 'expires_at', 'is_active')
    list_filter = ('is_active', 'type')
    search_fields = ('code',)
