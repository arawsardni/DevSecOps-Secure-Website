from django.urls import path

from . import api

urlpatterns = [
    path('', api.products_list, name='api_products_list'),
    path('<uuid:product_id>/', api.product_detail, name='api_product_detail'),
]