from django.urls import path
from . import api

app_name = 'cart'

urlpatterns = [
    path('', api.get_cart, name='get_cart'),
    path('add/', api.add_to_cart, name='add_to_cart'),
    path('update/<uuid:item_id>/', api.update_cart_item, name='update_cart_item'),
    path('remove/<uuid:item_id>/', api.remove_cart_item, name='remove_cart_item'),
    path('clear/', api.clear_cart, name='clear_cart'),
    path('merge/', api.merge_carts, name='merge_carts'),
] 