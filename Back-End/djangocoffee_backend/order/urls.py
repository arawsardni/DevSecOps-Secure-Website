from django.urls import path
from . import api

app_name = 'order'

urlpatterns = [
    # User endpoints
    path('', api.order_list, name='order_list'),
    path('<uuid:order_id>/', api.order_detail, name='order_detail'),
    path('create/', api.create_order, name='create_order'),
    path('<uuid:order_id>/cancel/', api.cancel_order, name='cancel_order'),
    path('<uuid:order_id>/pay/', api.process_payment, name='process_payment'),
    
    # Admin endpoints
    path('admin/list/', api.admin_order_list, name='admin_order_list'),
    path('admin/<uuid:order_id>/', api.admin_order_detail, name='admin_order_detail'),
    path('admin/<uuid:order_id>/status/', api.update_order_status, name='update_order_status'),
    path('admin/report/revenue/', api.revenue_report, name='revenue_report'),
    path('admin/report/top-products/', api.top_products_report, name='top_products_report'),
] 