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
    path('migrate-from-localstorage/', api.migrate_local_storage_addresses, name='migrate_from_localstorage'),
] 