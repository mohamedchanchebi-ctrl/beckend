from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('users.urls')),
    path('api/cart/', include('cart.urls')),
    path('api/', include('catalog.urls')),
    path('api/', include('orders.urls')),
    path('api/', include('discounts.urls')),
    path('api/', include('reviews.urls')),
    path('api/', include('wishlist.urls')),
    path('api/', include('reports.urls')),
]
