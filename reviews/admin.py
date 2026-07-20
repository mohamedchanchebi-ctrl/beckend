from django.contrib import admin
from .models import Review


@admin.register(Review)
class ReviewAdmin(admin.ModelAdmin):
    list_display = ('id', 'user', 'product', 'rating', 'created_at')
    list_filter = ('rating',)
    search_fields = ('user__email', 'product__name')
    readonly_fields = ('user', 'product', 'rating', 'comment', 'created_at')
