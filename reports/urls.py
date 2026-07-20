from django.urls import path
from .views import (
    AdminCustomerListView,
    AdminCustomerDetailView,
    SalesReportView,
    TopProductsReportView,
    LowStockReportView,
)

urlpatterns = [
    # Admin customer management
    path('admin/customers/', AdminCustomerListView.as_view(), name='admin-customer-list'),
    path('admin/customers/<int:pk>/', AdminCustomerDetailView.as_view(), name='admin-customer-detail'),

    # Admin reports
    path('admin/reports/sales/', SalesReportView.as_view(), name='admin-report-sales'),
    path('admin/reports/top-products/', TopProductsReportView.as_view(), name='admin-report-top-products'),
    path('admin/reports/low-stock/', LowStockReportView.as_view(), name='admin-report-low-stock'),
]
