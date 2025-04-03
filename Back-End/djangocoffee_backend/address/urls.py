from django.urls import path
from . import api

app_name = 'address'

urlpatterns = [
    # User address endpoints
    path('', api.address_list, name='address_list'),
    path('<uuid:address_id>/', api.address_detail, name='address_detail'),
    path('create/', api.create_address, name='create_address'),
    path('<uuid:address_id>/update/', api.update_address, name='update_address'),
    path('<uuid:address_id>/delete/', api.delete_address, name='delete_address'),
    path('<uuid:address_id>/set-default/', api.set_default_address, name='set_default_address'),
    path('default/', api.get_default_address, name='get_default_address'),
    
    # Province and City endpoints
    path('provinces/', api.province_list, name='province_list'),
    path('provinces/<uuid:province_id>/', api.province_detail, name='province_detail'),
    path('cities/', api.city_list, name='city_list'),
    path('provinces/<uuid:province_id>/cities/', api.city_list, name='province_cities'),
    path('cities/<uuid:city_id>/', api.city_detail, name='city_detail'),
    
    # Admin endpoints
    path('admin/provinces/create/', api.admin_create_province, name='admin_create_province'),
    path('admin/cities/create/', api.admin_create_city, name='admin_create_city'),
    path('admin/provinces/<uuid:province_id>/update/', api.admin_update_province, name='admin_update_province'),
    path('admin/cities/<uuid:city_id>/update/', api.admin_update_city, name='admin_update_city'),
    path('admin/provinces/<uuid:province_id>/delete/', api.admin_delete_province, name='admin_delete_province'),
    path('admin/cities/<uuid:city_id>/delete/', api.admin_delete_city, name='admin_delete_city'),
] 