from django.contrib import admin
from .models import WishlistItem


@admin.register(WishlistItem)
class WishlistItemAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'added_at')
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('user', 'product', 'added_at')
