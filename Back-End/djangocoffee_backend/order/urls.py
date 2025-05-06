from django.urls import path
from . import api
from .api import (
    order_list, order_detail, create_order, cancel_order,
    process_payment, update_order_status, admin_order_list,
    admin_order_detail, revenue_report, top_products_report,
    get_order_by_number, user_completed_orders, user_purchased_products,
    create_test_orders, get_order_payment
)

app_name = 'order'

urlpatterns = [
    # User endpoints
    path('list/', order_list, name='order_list'),
    path('detail/<uuid:order_id>/', order_detail, name='order_detail'),
    path('by-number/<str:order_number>/', get_order_by_number, name='get_order_by_number'),
    path('create/', create_order, name='create_order'),
    path('<uuid:order_id>/cancel/', cancel_order, name='cancel_order'),
    path('<uuid:order_id>/pay/', process_payment, name='process_payment'),
    path('user/<uuid:user_id>/completed/', user_completed_orders, name='user_completed_orders'),
    path('user/<uuid:user_id>/purchased-products/', user_purchased_products, name='user_purchased_products'),
    path('create-test-orders/', create_test_orders, name='create_test_orders'),
    
    # Admin endpoints
    path('admin/list/', admin_order_list, name='admin_order_list'),
    path('admin/<uuid:order_id>/', admin_order_detail, name='admin_order_detail'),
    path('admin/<uuid:order_id>/status/', update_order_status, name='update_order_status'),
    path('admin/report/revenue/', revenue_report, name='revenue_report'),
    path('admin/report/top-products/', top_products_report, name='top_products_report'),
    path('<uuid:order_id>/payment/', get_order_payment, name='get_order_payment'),
] 