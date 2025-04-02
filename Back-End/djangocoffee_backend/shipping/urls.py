from django.urls import path
from . import api

urlpatterns = [
    # Public API endpoints
    path('providers/', api.shipping_providers_list, name='shipping-providers-list'),
    path('providers/<uuid:provider_id>/', api.shipping_provider_detail, name='shipping-provider-detail'),
    path('methods/', api.shipping_methods_list, name='shipping-methods-list'),
    path('calculate/', api.calculate_shipping_rates, name='calculate-shipping-rates'),
    
    # User API endpoints
    path('user/shipments/', api.user_shipments_list, name='user-shipments-list'),
    path('user/shipments/<uuid:shipment_id>/', api.user_shipment_detail, name='user-shipment-detail'),
    path('user/orders/<uuid:order_id>/shipment/', api.order_shipment_detail, name='order-shipment-detail'),
    
    # Admin API endpoints - Shipments
    path('admin/shipments/', api.admin_shipments_list, name='admin-shipments-list'),
    path('admin/shipments/<uuid:shipment_id>/', api.admin_shipment_detail, name='admin-shipment-detail'),
    path('admin/shipments/create/', api.admin_create_shipment, name='admin-create-shipment'),
    path('admin/shipments/<uuid:shipment_id>/status/', api.admin_update_shipment_status, name='admin-update-shipment-status'),
    path('admin/shipments/<uuid:shipment_id>/tracking/', api.admin_add_tracking, name='admin-add-tracking'),
    
    # Admin API endpoints - Configuration
    path('admin/configuration/', api.shipping_configuration, name='shipping-configuration'),
    path('admin/configuration/update/', api.update_shipping_configuration, name='update-shipping-configuration'),
    
    # Admin API endpoints - Providers, Methods, Rates
    path('admin/providers/create/', api.admin_create_shipping_provider, name='admin-create-shipping-provider'),
    path('admin/providers/<uuid:provider_id>/update/', api.admin_update_shipping_provider, name='admin-update-shipping-provider'),
    path('admin/methods/create/', api.admin_create_shipping_method, name='admin-create-shipping-method'),
    path('admin/methods/<uuid:method_id>/update/', api.admin_update_shipping_method, name='admin-update-shipping-method'),
    path('admin/rates/', api.admin_shipping_rates_list, name='admin-shipping-rates-list'),
    path('admin/rates/create/', api.admin_create_shipping_rate, name='admin-create-shipping-rate'),
    path('admin/rates/<uuid:rate_id>/update/', api.admin_update_shipping_rate, name='admin-update-shipping-rate'),
    path('admin/rates/<uuid:rate_id>/delete/', api.admin_delete_shipping_rate, name='admin-delete-shipping-rate'),
] 